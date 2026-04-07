'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const AUGUSTA_GREEN = '#006747';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    router.push('/mypicks');
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#f9fafb',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '20px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo / title */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <span style={{ fontSize: 56, lineHeight: 1 }}>⛳</span>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginTop: 12, color: '#111827', letterSpacing: -0.5 }}>
            Masters 2026
          </h1>
          <p style={{ color: '#6b7280', fontSize: 16, marginTop: 4 }}>Lag din bruker</p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            background: '#fff', borderRadius: 16,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            padding: '24px 20px',
            display: 'flex', flexDirection: 'column', gap: 18,
          }}
        >
          <div>
            <label style={{ display: 'block', fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
              Ditt navn / kallenavn
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="f.eks. Ola Nordmann"
              style={{
                width: '100%', border: '1px solid #d1d5db', borderRadius: 10,
                padding: '0 14px', height: 52, fontSize: 16, color: '#111827',
                background: '#fff', outline: 'none', boxSizing: 'border-box',
              }}
              required
              autoFocus
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
              Passord
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minst 4 tegn"
              style={{
                width: '100%', border: '1px solid #d1d5db', borderRadius: 10,
                padding: '0 14px', height: 52, fontSize: 16, color: '#111827',
                background: '#fff', outline: 'none', boxSizing: 'border-box',
              }}
              required
            />
          </div>

          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 8, padding: '12px 14px',
              color: '#dc2626', fontSize: 15,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', background: loading ? '#6b7280' : AUGUSTA_GREEN,
              color: '#fff', border: 'none', borderRadius: 12,
              padding: '0 20px', height: 54, fontSize: 17, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
              boxShadow: loading ? 'none' : '0 2px 8px rgba(0,103,71,0.3)',
            }}
          >
            {loading ? 'Oppretter...' : 'Registrer og gjør dine valg →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 15, color: '#6b7280', marginTop: 20 }}>
          Har du allerede en bruker?{' '}
          <Link href="/login" style={{ color: AUGUSTA_GREEN, fontWeight: 600, textDecoration: 'none' }}>
            Logg inn
          </Link>
        </p>

        <p style={{ textAlign: 'center', marginTop: 16 }}>
          <Link href="/" style={{ fontSize: 14, color: '#9ca3af', textDecoration: 'none' }}>
            ← Tilbake til stillingslisten
          </Link>
        </p>
      </div>
    </div>
  );
}
