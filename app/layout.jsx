export const metadata = {
  title: 'Masters 2026 Konkurranse',
  description: 'Stillingsliste for Masters 2026 fantasy-konkurranse',
};

export default function RootLayout({ children }) {
  return (
    <html lang="nb">
      <body>{children}</body>
    </html>
  );
}
