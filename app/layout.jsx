export const metadata = {
  title: 'Masters 2026 Konkurranse',
  description: 'Stillingsliste for Masters 2026 fantasy-konkurranse',
};

export default function RootLayout({ children }) {
  return (
    <html lang="nb">
      <body>
        {children}
        <footer style={{
          textAlign: 'center', padding: '16px', fontSize: 12,
          color: '#9ca3af', borderTop: '1px solid #f3f4f6', marginTop: 8,
        }}>
          © Tom Richard Nygård 2026
        </footer>
      </body>
    </html>
  );
}
