# Docs Portal (Next.js on Vercel) — Fixed

Siap deploy:
- Next.js 14 (App Router), Tailwind, dark/light
- Tabs: Home, Send Request (EmailJS/mailto), API, API Docs, Settings
- Export `database.json`
- Tidak ada regex `/\/$/` di JSX — diganti helper `noTrail()`

## Jalankan Lokal
```bash
npm i
npm run dev
```

## Deploy Vercel
Push ke GitHub → Import Project di Vercel.
