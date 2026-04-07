'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const AUGUSTA_GREEN = '#006747';

export default function MyPicksPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [players, setPlayers] = useState([]);
  const [picks, setPicks] = useState({ player1: '', player2: '', player3: '', player4: '', reserve: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function init() {
      // Hent innlogget bruker
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      if (!meData.user) { router.push('/login'); return; }
      setUser(meData.user);

      // Hent spillerliste fra ESPN
      const scoresRes = await fetch('/api/scores');
      const scoresData = await scoresRes.json();
      const playerList = (scoresData.players || [])
        .map(p => p.name)
        .filter(Boolean)
        .sort();
      setPlayers(playerList);

      // Hent eksisterende picks
      const picksRes = await fetch('/api/picks');
      const picksData = await picksRes.json();
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

    if (!res.ok) {
      setError(data.error);
      return;
    }

    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }

  // Hvilke spillere er allerede valgt (for å hindre duplikater)
  const selectedPlayers = [picks.player1, picks.player2, picks.player3, picks.player4].filter(Boolean);

  function PlayerSelect({ label, field, isReserve = false }) {
    const currentValue = picks[field];
    const otherSelected = selectedPlayers.filter(p => p !== currentValue && !isReserve);

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <select
          value={currentValue}
          onChange={e => setPicks(prev => ({ ...prev, [field]: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600 bg-white"
          required={!isReserve}
        >
          <option value="">— Velg spiller —</option>
          {players.map(p => (
            <option
              key={p}
              value={p}
              disabled={!isReserve && otherSelected.includes(p)}
            >
              {p}{!isReserve && otherSelected.includes(p) ? ' (allerede valgt)' : ''}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Laster...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="text-white py-4 px-4 shadow" style={{ backgroundColor: AUGUSTA_GREEN }}>
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">⛳ Mine picks</h1>
            <p className="text-green-200 text-sm">Innlogget som <strong>{user?.username}</strong></p>
          </div>
          <div className="flex gap-2">
            <Link href="/" className="text-sm text-green-200 hover:text-white px-2 py-1">
              Stillingsliste
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm bg-green-800 hover:bg-green-900 px-3 py-1 rounded-lg"
            >
              Logg ut
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-sm text-gray-500 mb-5">
            Velg dine <strong>4 spillere</strong> + 1 reserve (reserve brukes kun ved skade/trekning).
            Du kan endre picks frem til turneringen starter.
          </p>

          <form onSubmit={handleSave} className="space-y-4">
            <PlayerSelect label="Spiller 1" field="player1" />
            <PlayerSelect label="Spiller 2" field="player2" />
            <PlayerSelect label="Spiller 3" field="player3" />
            <PlayerSelect label="Spiller 4" field="player4" />

            <div className="border-t pt-4">
              <PlayerSelect label="Reserve (valgfri)" field="reserve" isReserve />
              <p className="text-xs text-gray-400 mt-1">
                Reserven trer inn kun hvis en av dine spillere trekker seg pga skade.
              </p>
            </div>

            {error && (
              <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</p>
            )}

            {success && (
              <p className="text-green-700 text-sm bg-green-50 p-2 rounded">
                ✓ Picks lagret!
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full text-white py-3 rounded-lg font-semibold text-lg disabled:opacity-50"
              style={{ backgroundColor: AUGUSTA_GREEN }}
            >
              {saving ? 'Lagrer...' : '💾 Lagre picks'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
