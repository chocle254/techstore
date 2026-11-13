// The app itself is the offline page in /public (index.html + app.js). Next.js only serves the sync API.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
