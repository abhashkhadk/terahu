import "./globals.css";

export const metadata = {
  title: "TeraHub - Video Link Sharing",
  description: "Share and discover video links on TeraHub.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}