import "./globals.css";

export const metadata = {
  title: "Docs Portal",
  description: "Interactive Docs Portal with Dark/Light, Auth, Email, and database.json export",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
