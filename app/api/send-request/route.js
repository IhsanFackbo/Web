import { Resend } from "resend";

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, subject, message, user } = body || {};
    if (!name || !email || !subject || !message) {
      return new Response(JSON.stringify({ ok: false, error: "Missing fields" }), { status: 400 });
    }
    const adminEmail = process.env.ADMIN_EMAIL;
    const resendKey = process.env.RESEND_API_KEY;
    if (!adminEmail || !resendKey) {
      return new Response(JSON.stringify({ ok: false, error: "Server email not configured" }), { status: 500 });
    }
    const resend = new Resend(resendKey);
    const html = `
      <div style="font-family:Inter,system-ui,Arial,sans-serif">
        <h2>New Request</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        ${user ? `<p><b>Logged as:</b> ${user.name} (${user.email})</p>` : ""}
        <p><b>Subject:</b> ${subject}</p>
        <pre style="white-space:pre-wrap;background:#111;color:#fff;padding:12px;border-radius:8px">${message}</pre>
      </div>`;
    await resend.emails.send({
      from: `Docs Portal <noreply@${process.env.RESEND_DOMAIN || "example.com"}>`,
      to: adminEmail,
      subject: `[DocsPortal] ${subject}`,
      html,
      reply_to: email,
    });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || "Unknown error" }), { status: 500 });
  }
}
