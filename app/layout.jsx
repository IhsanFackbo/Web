import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "Docs Portal",
  description: "Interactive Docs Portal with Auth + Email",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
