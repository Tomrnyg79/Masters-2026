'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const AUGUSTA_GREEN = '#006747';

function formatTeeTime(isoString) {
  if (!isoString) return null;
  const date = new Date(isoString);
  return date.toLocaleTimeString('nb-NO', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Oslo',
  });
}

function formatTeeDate(isoString) {
  if (!isoString) return null;
  const date = new Date(isoString);
  return date.toLocaleDateString('nb-NO', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Oslo',
  });
}

export default function MyPicksPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [players, setPlayers] = useState([]);
  const [teeTimes, setTeeTimes] = useState({});
  const [picks, setPicks] = useState({ player1: '', player2: '', player3: '', player4: '', reserve: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function init() {
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      if (!meData.user) { router.push('/login'); return; }
      setUser(meData.user);

      const [scoresRes, teeRes, picksRes] = await Promise.all([
        fetch('/api/scores'),
        fetch('/api/teetimes'),
        fetch('/api/picks'),
      ]);
      const [scoresData, teeData, picksData] = await Promise.all([
        scoresRes.json(), teeRes.json(), picksRes.json(),
      ]);

      const playerList = (scoresData.players || []).map(p => p.name).filter(Boolean).sort();
      setPlayers(playerList);
      setTeeTimes(teeData.teeTimes || {});

      if (picksData.picks) {
        setPicks({
          player1: picksData.picks.player1 || '',
          player2: picksData.picks.player2 || '',
          player3: picksData.picks.player3 || '',
          player4: picksData.picks.player4 || '',
          reserve: picksData.picks.reserve || '',
        });
      }
      setLoading(false);
    }
    init();
  }, [router]);

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSaving(true);
    const res = await fetch('/api/picks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(picks),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error); return; }
    setSuccess(true);
    setTimeout(() => setSuccess(false), 4000);
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }

  const selectedPlayers = [picks.player1, picks.player2, picks.player3, picks.player4].filter(Boolean);

  function getPlayerTeeTimes(playerName) {
    return teeTimes[playerName] || [];
  }

  function TeeTimeInfo({ playerName }) {
    const rounds = getPlayerTeeTimes(playerName);
    if (!rounds.length) return null;
    const withTimes = rounds.filter(r => r.teeTime);
    if (!withTimes.length) return null;
    return (
      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {withTimes.map(r => (
          <div key={r.round} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#15803d' }}>
            <span>⏰</span>
            <span style={{ fontWeight: 600 }}>R{r.round}:</span>
            <span>{formatTeeDate(r.teeTime)} kl. {formatTeeTime(r.teeTime)}</span>
            {r.startTee === 10 && <span style={{ color: '#9ca3af' }}>(hull 10)</span>}
          </div>
        ))}
      </div>
    );
  }

  function PlayerSelect({ label, field, isReserve = false }) {
    const currentValue = picks[field];
    const otherSelected = selectedPlayers.filter(p => p !== currentValue && !isReserve);
    return (
      <div>
        <label style={{ display: 'block', fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
          {label}
        </label>
        <select
          value={currentValue}
          onChange={e => setPicks(prev => ({ ...prev, [field]: e.target.value }))}
          style={{
            width: '100%', border: '1px solid #d1d5db', borderRadius: 10,
            padding: '0 14px', height: 52, fontSize: 16,
            background: '#fff', color: '#111827',
            outline: 'none', boxSizing: 'border-box',
            appearance: 'auto',
          }}
          required={!isReserve}
        >
          <option value="">— Velg spiller —</option>
          {players.map(p => (
            <option key={p} value={p} disabled={!isReserve && otherSelected.includes(p)}>
              {p}{!isReserve && otherSelected.includes(p) ? ' (allerede valgt)' : ''}
            </option>
          ))}
        </select>
        {currentValue && <TeeTimeInfo playerName={currentValue} />}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div style={{ color: '#6b7280', fontSize: 17 }}>Laster...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div style={{ backgroundColor: AUGUSTA_GREEN }} className="text-white shadow">
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>⛳ Mine picks</h1>
            <p style={{ color: '#86efac', fontSize: 13, marginTop: 2 }}>
              Innlogget som <strong>{user?.username}</strong>
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <Link href="/" style={{
              color: '#86efac', fontSize: 14, textDecoration: 'none',
              padding: '10px 12px', minHeight: 44, display: 'flex', alignItems: 'center',
              borderRadius: 8,
            }}>Liste</Link>
            <button
              onClick={handleLogout}
              style={{
                fontSize: 14, background: 'rgba(0,0,0,0.25)', color: '#fff',
                border: 'none', borderRadius: 8, padding: '10px 14px',
                minHeight: 44, cursor: 'pointer', fontWeight: 500,
              }}
            >
              Logg ut
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '16px 16px 32px' }}>
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.08)', padding: '20px 16px' }}>
          <p style={{ fontSize: 15, color: '#6b7280', marginBottom: 20, lineHeight: 1.6 }}>
            Velg dine <strong>4 spillere</strong> + 1 reserve. Tee-tider vises under hver spiller du velger.
            Du kan endre picks frem til turneringen starter <strong>torsdag 9. april kl. 09:00</strong>.
          </p>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <PlayerSelect label="Spiller 1" field="player1" />
            <PlayerSelect label="Spiller 2" field="player2" />
            <PlayerSelect label="Spiller 3" field="player3" />
            <PlayerSelect label="Spiller 4" field="player4" />

            <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 20 }}>
              <PlayerSelect label="Reserve (valgfri)" field="reserve" isReserve />
              <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 8, lineHeight: 1.5 }}>
                Reserven trer inn kun hvis en av dine spillere trekker seg pga skade.
              </p>
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

            {success && (
              <div style={{
                background: '#f0fdf4', border: '1px solid #bbf7d0',
                borderRadius: 8, padding: '14px 16px',
                color: '#15803d', fontSize: 15, fontWeight: 600,
              }}>
                ✓ Picks lagret! Lykke til! 🍀
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              style={{
                width: '100%', background: saving ? '#6b7280' : AUGUSTA_GREEN,
                color: '#fff', border: 'none', borderRadius: 12,
                padding: '16px 20px', fontSize: 18, fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
                minHeight: 56, transition: 'background 0.15s',
                boxShadow: saving ? 'none' : '0 2px 8px rgba(0,103,71,0.3)',
              }}
            >
              {saving ? 'Lagrer...' : '💾 Lagre picks'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
