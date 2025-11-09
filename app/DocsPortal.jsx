"use client";
import React, { useState, useEffect } from "react";

export default function DocsPortal() {
  // ===== Theme =====
  const [theme, setTheme] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("theme") || "dark" : "dark"
  );
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", theme === "dark");
      localStorage.setItem("theme", theme);
    }
  }, [theme]);

  // ===== Tabs =====
  const TABS = ["Home", "Send Request", "API", "API Docs", "Settings"];
  const [tab, setTab] = useState("Home");

  // ===== Settings/Auth =====
  const [user, setUser] = useState(() => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("portal_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [apiBaseUrl, setApiBaseUrl] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("portal_api_base") || "https://api.example.com" : "https://api.example.com"
  );
  const [emailJS, setEmailJS] = useState(() => {
    if (typeof window === "undefined") return { serviceId: "", templateId: "", publicKey: "" };
    const raw = localStorage.getItem("portal_emailjs");
    return raw ? JSON.parse(raw) : { serviceId: "", templateId: "", publicKey: "" };
  });
  useEffect(() => { if (typeof window !== "undefined") localStorage.setItem("portal_api_base", apiBaseUrl); }, [apiBaseUrl]);
  useEffect(() => { if (typeof window !== "undefined") localStorage.setItem("portal_emailjs", JSON.stringify(emailJS)); }, [emailJS]);

  // ===== helper: remove trailing slash safely =====
  const noTrail = (u) => {
    const s = (u || "").toString();
    return s.endsWith("/") ? s.slice(0, -1) : s;
  };

  // ===== Request form =====
  const [reqName, setReqName] = useState("");
  const [reqEmail, setReqEmail] = useState("");
  const [reqSubject, setReqSubject] = useState("");
  const [reqMessage, setReqMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);
  useEffect(() => {
    if (user) {
      if (!reqName) setReqName(user.name);
      if (!reqEmail) setReqEmail(user.email);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ===== Local DB =====
  const uid = () => Math.random().toString(36).slice(2, 10);
  const loadDB = () => {
    if (typeof window === "undefined") return { users: [], requests: [], settings: { theme, apiBaseUrl, emailJS: { ...emailJS } } };
    const raw = localStorage.getItem("portal_database");
    if (raw) return JSON.parse(raw);
    return { users: [], requests: [], settings: { theme, apiBaseUrl, emailJS: { ...emailJS } } };
  };
  const saveDB = (db) => { if (typeof window !== "undefined") localStorage.setItem("portal_database", JSON.stringify(db)); };
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  // ===== Auth (mock Google + local) =====
  const loginWithGoogle = () => {
    const fake = { id: uid(), name: "Google User", email: `user_${uid()}@gmail.com`, provider: "google", photoURL: "https://ui-avatars.com/api/?name=GU" };
    setUser(fake);
    if (typeof window !== "undefined") localStorage.setItem("portal_user", JSON.stringify(fake));
    const db = loadDB();
    if (!db.users.find(u => u.email === fake.email)) db.users.push(fake);
    saveDB(db);
    showToast("Logged in with Google (demo)");
  };
  const signUpLocal = (name, email) => {
    if (!name || !email) return showToast("Isi nama & email");
    const newUser = { id: uid(), name, email, provider: "local", photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}` };
    setUser(newUser);
    if (typeof window !== "undefined") localStorage.setItem("portal_user", JSON.stringify(newUser));
    const db = loadDB();
    if (!db.users.find(u => u.email === email)) db.users.push(newUser);
    saveDB(db);
    showToast("Account created & logged in");
  };
  const logout = () => {
    setUser(null);
    if (typeof window !== "undefined") localStorage.removeItem("portal_user");
    showToast("Logged out");
  };

  // ===== Email =====
  const emailEnabled = emailJS.serviceId && emailJS.templateId && emailJS.publicKey;
  const mailtoFallback = (it) => {
    const to = "support@example.com";
    const body = encodeURIComponent(`Nama: ${it.name}\nEmail: ${it.email}\nTanggal: ${new Date(it.createdAt).toLocaleString()}\n\nPesan:\n${it.message}`);
    const subject = encodeURIComponent(it.subject);
    const href = `mailto:${to}?subject=${subject}&body=${body}`;
    if (typeof window !== "undefined") window.location.href = href;
    showToast("Draft email dibuka (mailto)");
  };
  const submitRequest = async (e) => {
    e.preventDefault();
    if (!reqName || !reqEmail || !reqSubject || !reqMessage) return showToast("Lengkapi semua field");
    setSending(true);

    const db = loadDB();
    const item = { id: uid(), name: reqName, email: reqEmail, subject: reqSubject, message: reqMessage, createdAt: new Date().toISOString() };
    db.requests.push(item);
    db.settings = { theme, apiBaseUrl, emailJS: { ...emailJS } };
    saveDB(db);

    try {
      if (emailEnabled && typeof window !== "undefined" && window.emailjs && window.emailjs.send) {
        await window.emailjs.send(emailJS.serviceId, emailJS.templateId, {
          from_name: reqName, from_email: reqEmail, subject: reqSubject, message: reqMessage,
        }, emailJS.publicKey);
        showToast("Request terkirim via EmailJS ✅");
      } else {
        if (emailEnabled) showToast("EmailJS script tidak ditemukan, pakai mailto");
        mailtoFallback(item);
      }
      setReqSubject(""); setReqMessage("");
    } catch {
      showToast("Gagal kirim. Cek EmailJS");
    } finally { setSending(false); }
  };

  // ===== Helpers/UI =====
  const downloadDB = () => {
    const db = loadDB();
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "database.json"; a.click();
    URL.revokeObjectURL(url);
    showToast("database.json terunduh");
  };

  const Section = ({ title, desc, children }) => (
    <div className="rounded-2xl p-6 bg-white/60 dark:bg-zinc-900/60 backdrop-blur border border-zinc-200 dark:border-zinc-800 shadow-sm">
      <div className="mb-4">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {desc && <p className="text-sm opacity-80 mt-1">{desc}</p>}
      </div>
      {children}
    </div>
  );
  const GradientButton = ({ children, className = "", onClick, href, target }) => (
    href ? (
      <a href={href} target={target} rel="noreferrer"
         className={`inline-flex items-center justify-center rounded-2xl px-4 py-2 font-medium shadow transition hover:opacity-90 ${className} bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white`}>
        {children}
      </a>
    ) : (
      <button onClick={onClick}
        className={`inline-flex items-center justify-center rounded-2xl px-4 py-2 font-medium shadow transition hover:opacity-90 ${className} bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white`}>
        {children}
      </button>
    )
  );
  const NavButton = ({ label, active, onClick }) => (
    <button onClick={onClick}
      className={`px-3 py-2 rounded-xl text-sm font-medium transition border ${active ? "bg-zinc-900 text-white border-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-300" : "bg-white/70 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800 hover:shadow"}`}>
      {label}
    </button>
  );

  // ===== Pages =====
  const HomePage = () => (
    <div className="grid md:grid-cols-2 gap-5">
      <Section title="Selamat Datang" desc="Portal dokumentasi & request — mode gelap/terang dengan tombol gradien.">
        <p className="leading-relaxed">Gunakan menu untuk kirim request, lihat docs API, buka base URL API, dan kelola akun.</p>
        <div className="mt-4 flex gap-2 flex-wrap">
          <GradientButton onClick={() => setTab("Send Request")}>Kirim Request</GradientButton>
          <GradientButton onClick={() => setTab("API Docs")}>Buka Docs API</GradientButton>
          <GradientButton onClick={() => setTab("Settings")}>Setting Akun</GradientButton>
        </div>
      </Section>
      <Section title="Kotak Informasi" desc="Info singkat & cepat.">
        <ul className="space-y-3 text-sm">
          <li className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/70">Status: <b>{user ? "Logged in" : "Guest"}</b></li>
          <li className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/70">Tema: <b className="capitalize">{theme}</b></li>
          <li className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/70">API Base: <b>{apiBaseUrl}</b></li>
          <li className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/70">EmailJS: <b>{emailEnabled ? "Aktif" : "Non-aktif"}</b></li>
        </ul>
        <div className="mt-4"><GradientButton onClick={downloadDB}>Export database.json</GradientButton></div>
      </Section>
    </div>
  );
  const ApiPage = () => {
    const normalizedApi = noTrail(apiBaseUrl);
    return (
      <div className="grid md:grid-cols-3 gap-5">
        <Section title="API Base URL" desc="Buka link API Anda di tab baru.">
          <div className="flex gap-2 items-center">
            <input
              className="flex-1 rounded-xl px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 outline-none"
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              placeholder="https://api.example.com"
            />
            <GradientButton href={apiBaseUrl} target="_blank">Open API</GradientButton>
          </div>
          <p className="text-xs opacity-70 mt-2">Pastikan URL diawali dengan https://</p>
        </Section>

        <Section title="Endpoint Contoh" desc="GET /v1/ping">
          <pre className="text-xs p-3 bg-zinc-950 text-zinc-50 rounded-xl overflow-auto">{`curl -s ${normalizedApi}/v1/ping`}</pre>
        </Section>

        <Section title="Quick Test" desc="Buka ping di tab baru.">
          <GradientButton href={`${normalizedApi}/v1/ping`} target="_blank">
            Test /v1/ping
          </GradientButton>
        </Section>
      </div>
    );
  };
  const ApiDocsPage = () => {
    const normalizedApi = noTrail(apiBaseUrl);
    return (
      <div className="space-y-5">
        <Section title="Docs API" desc="Ringkas & cepat mulai.">
          <div className="prose dark:prose-invert max-w-none">
            <h3>Auth</h3>
            <p>Publik: tanpa token. Privat: <code>Authorization: Bearer &lt;TOKEN&gt;</code>.</p>
            <h3>Endpoint</h3>
            <ul>
              <li><b>GET</b> <code>/v1/ping</code> — health check.</li>
              <li><b>POST</b> <code>/v1/echo</code> — body JSON dikembalikan.</li>
              <li><b>GET</b> <code>/v1/users/:id</code> — detail user.</li>
            </ul>
            <h3>Contoh</h3>
            <pre>{`fetch('${normalizedApi}/v1/ping').then(r => r.json()).then(console.log);`}</pre>
            <pre>{`fetch('${normalizedApi}/v1/echo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hello: 'world' }) }).then(r => r.json()).then(console.log);`}</pre>
          </div>
        </Section>
      </div>
    );
  };
  const SendRequestPage = () => (
    <div className="grid md:grid-cols-2 gap-5">
      <Section title="Form Kirim Request" desc={emailEnabled ? "Dikirim via EmailJS" : "Tanpa EmailJS: mailto + simpan ke database.json"}>
        <form onSubmit={submitRequest} className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <input className="rounded-xl px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700" placeholder="Nama" value={reqName} onChange={e=>setReqName(e.target.value)} />
            <input className="rounded-xl px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700" placeholder="Email" type="email" value={reqEmail} onChange={e=>setReqEmail(e.target.value)} />
          </div>
          <input className="w-full rounded-xl px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700" placeholder="Subjek" value={reqSubject} onChange={e=>setReqSubject(e.target.value)} />
          <textarea className="w-full rounded-xl px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 min-h-[140px]" placeholder="Pesan" value={reqMessage} onChange={e=>setReqMessage(e.target.value)} />
          <div className="flex items-center gap-3">
            <GradientButton className={sending ? "opacity-60 pointer-events-none" : ""}>{sending ? "Mengirim..." : "Kirim"}</GradientButton>
            {!user && <span className="text-xs opacity-70">* Login untuk auto-fill & riwayat akun</span>}
          </div>
        </form>
      </Section>
      <Section title="Tips" desc="Agar email terkirim otomatis">
        <ol className="list-decimal ml-5 space-y-2 text-sm">
          <li>Isi EmailJS Service ID, Template ID, Public Key di <b>Settings</b>.</li>
          <li>Tambahkan script EmailJS:
            <code>&lt;script src="https://cdn.jsdelivr.net/npm/emailjs-com@3/dist/email.min.js"&gt;</code>
          </li>
          <li>Tanpa EmailJS, sistem membuka draft <code>mailto:</code>.</li>
        </ol>
      </Section>
    </div>
  );
  const SettingsPage = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    return (
      <div className="grid md:grid-cols-2 gap-5">
        <Section title="Akun" desc="Login via Google (demo) atau buat akun lokal.">
          {user ? (
            <div className="flex items-center gap-4">
              <img src={user.photoURL} alt="avatar" className="w-12 h-12 rounded-full" />
              <div className="flex-1">
                <div className="font-semibold">{user.name}</div>
                <div className="text-sm opacity-80">{user.email}</div>
                <div className="text-xs opacity-60">Provider: {user.provider}</div>
              </div>
              <GradientButton onClick={logout}>Logout</GradientButton>
            </div>
          ) : (
            <div className="space-y-3">
              <GradientButton onClick={loginWithGoogle}>Login dengan Google</GradientButton>
              <div className="grid md:grid-cols-2 gap-3">
                <input className="rounded-xl px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700" placeholder="Nama" value={name} onChange={e=>setName(e.target.value)} />
                <input className="rounded-xl px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700" placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
              </div>
              <GradientButton onClick={() => signUpLocal(name, email)}>Buat Akun</GradientButton>
            </div>
          )}
        </Section>
        <Section title="Preferensi" desc="Tema & API">
          <div className="flex items-center gap-3">
            <span className="text-sm">Tema</span>
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700">
              {theme === "dark" ? "Switch to Light" : "Switch to Dark"}
            </button>
          </div>
          <div className="mt-4">
            <label className="text-sm">API Base URL</label>
            <input className="w-full mt-1 rounded-xl px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700" value={apiBaseUrl} onChange={(e)=>setApiBaseUrl(e.target.value)} />
          </div>
        </Section>
        <Section title="Integrasi EmailJS" desc="Opsional — kosongkan bila tak digunakan.">
          <div className="grid md:grid-cols-3 gap-3">
            <input className="rounded-xl px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700" placeholder="Service ID" value={emailJS.serviceId} onChange={e=>setEmailJS({...emailJS, serviceId: e.target.value})} />
            <input className="rounded-xl px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700" placeholder="Template ID" value={emailJS.templateId} onChange={e=>setEmailJS({...emailJS, templateId: e.target.value})} />
            <input className="rounded-xl px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700" placeholder="Public Key" value={emailJS.publicKey} onChange={e=>setEmailJS({...emailJS, publicKey: e.target.value})} />
          </div>
          <p className="text-xs opacity-70 mt-2">Jika diisi, form "Send Request" akan mengirim via EmailJS.</p>
        </Section>
        <Section title="Database.json" desc="Simpan semua data lokal ke file JSON">
          <div className="flex gap-3">
            <GradientButton onClick={downloadDB}>Export database.json</GradientButton>
            <button
              onClick={() => { if (typeof window !== "undefined") localStorage.removeItem("portal_database"); showToast("Database lokal di-reset"); }}
              className="px-4 py-2 rounded-2xl border border-zinc-200 dark:border-zinc-700"
            >
              Reset DB
            </button>
          </div>
          <p className="text-xs opacity-70 mt-2">Struktur: {"{ users: [], requests: [], settings: {...} }"}</p>
        </Section>
      </div>
    );
  };

  // ===== Shell =====
  const Shell = ({ children }) => (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-black text-zinc-900 dark:text-zinc-100">
      <header className="sticky top-0 z-40 backdrop-blur bg-white/70 dark:bg-black/40 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            <div>
              <div className="font-semibold leading-tight">Docs Portal</div>
              <div className="text-xs opacity-70 -mt-0.5">Interactive • Dark/Light</div>
            </div>
          </div>
          <div className="flex-1" />
          <div className="flex gap-2">
            {TABS.map((t) => (<NavButton key={t} label={t} active={tab===t} onClick={()=>setTab(t)} />))}
          </div>
          <div className="flex-1" />
          <GradientButton className="hidden md:inline-flex" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? "Light" : "Dark"}
          </GradientButton>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      <footer className="max-w-6xl mx-auto px-4 pb-8 text-xs opacity-70">© {new Date().getFullYear()} Docs Portal.</footer>
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-4 py-2 rounded-xl shadow-lg border border-zinc-800 dark:border-zinc-200">
          {toast}
        </div>
      )}
    </div>
  );

  return (
    <Shell>
      {tab === "Home" && <HomePage />}
      {tab === "Send Request" && <SendRequestPage />}
      {tab === "API" && <ApiPage />}
      {tab === "API Docs" && <ApiDocsPage />}
      {tab === "Settings" && <SettingsPage />}
    </Shell>
  );
}