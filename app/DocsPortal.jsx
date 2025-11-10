
"use client";
import React, { useEffect, useRef, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

const ADMIN_API_URL = process.env.NEXT_PUBLIC_API_BASE || "https://ryous-ap.vercel.app/";

const noTrail = (u) => {
  const s = (u || "").toString();
  return s.endsWith("/") ? s.slice(0, -1) : s;
};
const uid = () => Math.random().toString(36).slice(2, 10);

export default function DocsPortal() {
  const { data: session } = useSession();
  const sessionUser = session?.user || null;

  const [theme, setTheme] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("theme") || "dark" : "dark"
  );
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", theme === "dark");
      localStorage.setItem("theme", theme);
    }
  }, [theme]);

  const TABS = ["Home", "Send Request", "API", "API Docs", "Settings"];
  const [tab, setTab] = useState("Home");
  const [menuOpen, setMenuOpen] = useState(false);

  // Local mock account (fallback when not using Google)
  const [localUser, setLocalUser] = useState(() => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("portal_user_local");
    return raw ? JSON.parse(raw) : null;
  });

  const effectiveUser = sessionUser || localUser;

  const [apiBaseUrl] = useState(() => {
    if (ADMIN_API_URL) return noTrail(ADMIN_API_URL);
    if (typeof window !== "undefined") {
      const fromLocal = localStorage.getItem("portal_api_base_admin") || "";
      return noTrail(fromLocal);
    }
    return "";
  });

  // Request form
  const [reqName, setReqName] = useState("");
  const [reqEmail, setReqEmail] = useState("");
  const [reqSubject, setReqSubject] = useState("");
  const [reqMessage, setReqMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);
  const submitGuard = useRef(0);

  useEffect(() => {
    if (effectiveUser) {
      if (!reqName) setReqName(effectiveUser.name || "");
      if (!reqEmail) setReqEmail(effectiveUser.email || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveUser]);

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 2200); };

  // Local email/pass (mock) -> "connect email"
  const [emailLogin, setEmailLogin] = useState("");
  const [passLogin, setPassLogin] = useState("");
  const loginUmum = () => {
    if (!emailLogin || !passLogin) return showToast("Isi email & password");
    const name = emailLogin.split("@")[0];
    const u = {
      id: uid(),
      name: name || "User",
      email: emailLogin,
      provider: "password",
      photoURL: `https://api.dicebear.com/7.x/initials/svg?radius=50&seed=${encodeURIComponent(name || "User")}`,
    };
    setLocalUser(u);
    if (typeof window !== "undefined") localStorage.setItem("portal_user_local", JSON.stringify(u));
    setEmailLogin(""); setPassLogin("");
    showToast("Akun terhubung");
  };
  const logoutLocal = () => { setLocalUser(null); if (typeof window !== "undefined") localStorage.removeItem("portal_user_local"); };

  // ---- SEND REQUEST (server email via /api) ----
  const submitRequest = async (e) => {
    e.preventDefault();
    if (sending) return; // guard
    if (Date.now() - submitGuard.current < 1000) return; // debounce 1s
    submitGuard.current = Date.now();

    if (!reqName || !reqEmail || !reqSubject || !reqMessage) return showToast("Lengkapi semua field");
    setSending(true);

    try {
      const res = await fetch("/api/send-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: reqName,
          email: reqEmail,
          subject: reqSubject,
          message: reqMessage,
          user: effectiveUser ? { name: effectiveUser.name, email: effectiveUser.email } : null,
        }),
      });
      const js = await res.json();
      if (!res.ok or not js.get("ok", False)):
        raise Exception(js.get("error", "Gagal kirim"))
      showToast("Terkirim ke email admin ✅");
      setReqSubject(""); setReqMessage("");
    } except Exception as err:
      showToast(str(err) or "Gagal kirim")
    finally:
      setSending(false)
  };

  const Card = ({ children, className = "" }) => (
    <div className={`rounded-2xl p-5 bg-white/60 dark:bg-zinc-900/60 backdrop-blur border border-zinc-200 dark:border-zinc-800 shadow-sm ${className}`}>
      {children}
    </div>
  );

  const GButton = ({ children, onClick, href, target, className = "", type }) =>
    href ? (
      <a href={href} target={target} rel="noreferrer"
        className={`inline-flex items-center justify-center rounded-2xl px-4 py-2 font-medium shadow transition hover:opacity-90 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white ${className}`}>
        {children}
      </a>
    ) : (
      <button type={type || "button"} onClick={onClick}
        className={`inline-flex items-center justify-center rounded-2xl px-4 py-2 font-medium shadow transition hover:opacity-90 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white ${className}`}>
        {children}
      </button>
    );

  const HomePage = () => (
    <div className="space-y-4">
      <Card>
        <h2 className="text-xl font-semibold">Selamat Datang</h2>
        <p className="mt-1 text-sm opacity-80">Portal dokumentasi & request — dark/light.</p>
        <div className="mt-4 flex gap-2 flex-wrap">
          <GButton onClick={() => setTab("Send Request")}>Kirim Request</GButton>
          <GButton onClick={() => setTab("API Docs")}>Buka Docs API</GButton>
          <GButton onClick={() => setTab("Settings")}>Setting Akun</GButton>
        </div>
      </Card>
      <Card>
        <h3 className="text-lg font-semibold">Info</h3>
        <ul className="mt-3 space-y-2 text-sm">
          <li>Status: <b>{effectiveUser ? "Logged in" : "Guest"}</b></li>
          <li>Tema: <b className="capitalize">{theme}</b></li>
          <li>API (admin): <b>{apiBaseUrl || "—"}</b></li>
        </ul>
      </Card>
    </div>
  );

  const SendRequestPage = () => (
    <div className="space-y-4">
      <Card>
        <h2 className="text-xl font-semibold">Form Kirim Request</h2>
        <p className="text-sm opacity-70">Kirim langsung ke email admin.</p>
        <form onSubmit={submitRequest} className="mt-4 space-y-3">
          <input className="w-full rounded-xl px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
            placeholder="Nama" inputMode="text" autoCapitalize="words" spellCheck={false}
            value={reqName} onChange={(e)=>setReqName(e.target.value)} />
          <input className="w-full rounded-xl px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
            placeholder="Email" type="email" inputMode="email" autoCorrect="off" autoCapitalize="none" spellCheck={false}
            value={reqEmail} onChange={(e)=>setReqEmail(e.target.value)} />
          <input className="w-full rounded-xl px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
            placeholder="Subjek" inputMode="text" spellCheck={false}
            value={reqSubject} onChange={(e)=>setReqSubject(e.target.value)} />
          <textarea className="w-full rounded-xl px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 min-h-[140px]"
            placeholder="Pesan" inputMode="text" spellCheck={false}
            value={reqMessage} onChange={(e)=>setReqMessage(e.target.value)} />
          <div className="flex items-center gap-3">
            <GButton type="submit" className={sending ? "opacity-60 pointer-events-none" : ""}>
              {sending ? "Mengirim..." : "Kirim"}
            </GButton>
            {!effectiveUser and <span className="text-xs opacity-70">* Login untuk auto‑fill</span>}
          </div>
        </form>
      </Card>
    </div>
  );

  const ApiPage = () => {
    const normalized = noTrail(apiBaseUrl);
    return (
      <div className="space-y-4">
        <Card>
          <h2 className="text-xl font-semibold">API</h2>
          <p className="text-sm opacity-70">URL API ditetapkan oleh admin.</p>
          <div className="mt-3">
            <GButton href={normalized || "#"} target="_blank">View API Ryou's</GButton>
          </div>
          {normalized && (
            <pre className="mt-3 text-xs p-3 bg-zinc-950 text-zinc-50 rounded-xl overflow-auto">{`curl -s ${normalized}/v1/ping`}</pre>
          )}
        </Card>
      </div>
    );
  };

  const ApiDocsPage = () => {
    const normalized = noTrail(apiBaseUrl);
    return (
      <div className="space-y-4">
        <Card>
          <h2 className="text-xl font-semibold">Docs API</h2>
          <div className="prose dark:prose-invert max-w-none text-sm mt-2">
            <h3>Auth</h3>
            <p>Publik: tanpa token. Privat: <code>Authorization: Bearer &lt;TOKEN&gt;</code>.</p>
            <h3>Endpoint</h3>
            <ul>
              <li><b>GET</b> <code>/v1/ping</code> — health check.</li>
              <li><b>POST</b> <code>/v1/echo</code> — body JSON dikembalikan.</li>
              <li><b>GET</b> <code>/v1/users/:id</code> — detail user.</li>
            </ul>
            {normalized && (
              <>
                <h3>Contoh</h3>
                <pre>{`fetch('${normalized}/v1/ping').then(r => r.json()).then(console.log);`}</pre>
                <pre>{`fetch('${normalized}/v1/echo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hello: 'world' }) }).then(r => r.json()).then(console.log);`}</pre>
              </>
            )}
          </div>
        </Card>
      </div>
    );
  };

  const SettingsPage = () => (
    <div className="space-y-4">
      <Card>
        <h2 className="text-xl font-semibold">Akun</h2>
        {(sessionUser || localUser) ? (
          <div className="mt-3 flex items-center gap-4">
            <div className="relative">
              <span className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 blur-sm opacity-70"></span>
              <img
                src={(sessionUser?.image) || (localUser?.photoURL) || `https://api.dicebear.com/7.x/avataaars/svg?radius=50&seed=${encodeURIComponent((sessionUser?.name||localUser?.name||"User"))}`}
                alt="avatar"
                className="relative w-14 h-14 rounded-full ring-2 ring-white dark:ring-zinc-900 shadow-lg"
              />
            </div>
            <div className="flex-1">
              <div className="font-semibold">{sessionUser?.name || localUser?.name}</div>
              <div className="text-sm opacity-80">{sessionUser?.email || localUser?.email}</div>
              <div className="text-xs opacity-60">Provider: {sessionUser ? "google" : "password"}</div>
            </div>
            {sessionUser ? (
              <GButton onClick={() => signOut()}>Logout</GButton>
            ) : (
              <GButton onClick={logoutLocal}>Logout</GButton>
            )}
          </div>
        ) : (
          <>
            <div className="mt-3 grid gap-2">
              <GButton onClick={() => signIn("google")}>Login dengan Google</GButton>
            </div>
            <div className="mt-4">
              <div className="text-sm font-medium mb-2">Login Umum (Email & Password)</div>
              <input className="w-full mb-2 rounded-xl px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                placeholder="Email" type="email" inputMode="email" autoCorrect="off" autoCapitalize="none" spellCheck={false}
                value={emailLogin} onChange={(e)=>setEmailLogin(e.target.value)} />
              <input className="w-full mb-3 rounded-xl px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                placeholder="Password" type="password"
                value={passLogin} onChange={(e)=>setPassLogin(e.target.value)} />
              <GButton onClick={loginUmum}>Login</GButton>
            </div>
          </>
        )}
      </Card>

      <Card>
        <h3 className="text-lg font-semibold">Preferensi</h3>
        <div className="mt-3 flex items-center gap-3">
          <span className="text-sm">Tema</span>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700"
          >
            {theme === "dark" ? "Switch to Light" : "Switch to Dark"}
          </button>
        </div>
        <div className="mt-3 text-sm opacity-80">
          <div>API Base (admin): <b>{apiBaseUrl || "—"}</b></div>
          <div className="text-xs">* URL ditetapkan oleh admin (ENV).</div>
        </div>
      </Card>
    </div>
  );

  const Shell = ({ children }) => (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-black text-zinc-900 dark:text-zinc-100">
      <header className="sticky top-0 z-40 backdrop-blur bg-white/70 dark:bg-black/40 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            <div>
              <div className="font-semibold leading-tight">Docs Portal</div>
              <div className="text-xs opacity-70 -mt-0.5">Interactive • Dark/Light</div>
            </div>
          </div>
          <div className="flex-1" />
          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="px-3 py-2 rounded-xl border text-sm border-zinc-200 dark:border-zinc-700">
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6">{children}</main>

      {/* FAB */}
      <div className="fixed bottom-6 right-6 z-50">
        {menuOpen && (
          <div className="mb-3 w-52 rounded-2xl p-3 bg-white/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 shadow-xl backdrop-blur">
            <div className="grid gap-2">
              {TABS.map((t) => (
                <button key={t} onClick={() => { setTab(t); setMenuOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm border transition ${tab === t ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-800 dark:border-zinc-300" : "bg-white/70 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800 hover:shadow"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}
        <button onClick={() => setMenuOpen(v => !v)} aria-label="Menu"
          className="w-14 h-14 rounded-full shadow-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white text-lg flex items-center justify-center">
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      <footer className="max-w-xl mx-auto px-4 pb-8 text-xs opacity-70">© {new Date().getFullYear()} Docs Portal.</footer>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-4 py-2 rounded-xl shadow-lg border border-zinc-800 dark:border-zinc-200">
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
