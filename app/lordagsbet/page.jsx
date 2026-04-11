'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const AUGUSTA_GREEN = '#006747';
const DEADLINE = new Date('2026-04-11T13:30:00Z'); // Lørdag 15:30 norsk tid

export default function LordagsbetPage() {
  const [user, setUser] = useState(undefined);
  const [players, setPlayers] = useState([]);
  const [bets, setBets] = useState([]);
  const [apiPlayers, setApiPlayers] = useState([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [myBet, setMyBet] = useState({ player: '', tiebreaker: '' });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const locked = new Date() >= DEADLINE;

  useEffect(() => {
    async function init() {
      const [meRes, scoresRes, betsRes] = await Promise.all([
        fetch('/api/auth/me', { cache: 'no-store' }),
        fetch('/api/scores', { cache: 'no-store' }),
        fetch('/api/saturdaybet', { cache: 'no-store' }),
      ]);
      const [me, scoresData, betsData] = await Promise.all([
        meRes.json(), scoresRes.json(), betsRes.json(),
      ]);

      setUser(me.user || null);
      setCurrentRound(scoresData.currentRound || 1);

      const allPlayers = scoresData.players || [];
      setApiPlayers(allPlayers);

      // Kun spillere som fullførte R2 (ikke MC/WD)
      const eligible = allPlayers
        .filter(p => p.status !== 'WD' && p.status !== 'MC' && p.r2 !== null)
        .map(p => p.name).sort();
      setPlayers(eligible);

      setBets(betsData.bets || []);

      if (me.user) {
        const mine = betsData.bets?.find(b => b.name === me.user.username);
        if (mine) setMyBet({ player: mine.player, tiebreaker: String(mine.tiebreaker) });
      }
      setLoading(false);
    }
    init();
    const interval = setInterval(init, 60000);
    return () => clearInterval(interval);
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    if (!myBet.player || !myBet.tiebreaker) { setError('Velg spiller og gjett antall slag'); return; }
    setSaving(true); setError(''); setSuccess(false);
    const res = await fetch('/api/saturdaybet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(myBet),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error); return; }
    setSuccess(true);
    setTimeout(() => setSuccess(false), 4000);
  }

  // Beregn klatring: posisjon etter R2 vs nå
  function getPositions() {
    const withR2 = apiPlayers.filter(p => p.r1 != null && p.r2 != null && p.status !== 'WD');

    // Posisjon etter R2 (sortert på r1+r2)
    const afterR2 = [...withR2].sort((a, b) => (a.r1 + a.r2) - (b.r1 + b.r2));
    const posAfterR2 = {};
    afterR2.forEach((p, i) => { posAfterR2[p.name] = i + 1; });

    // Nåværende posisjon (sortert på total toPar)
    const now = [...withR2].sort((a, b) => {
      const aNum = a.toPar === 'E' ? 0 : parseInt(a.toPar) || 0;
      const bNum = b.toPar === 'E' ? 0 : parseInt(b.toPar) || 0;
      return aNum - bNum;
    });
    const posNow = {};
    now.forEach((p, i) => { posNow[p.name] = i + 1; });

    return { posAfterR2, posNow };
  }

  function getClimb(playerName) {
    if (currentRound < 3) return null;
    const { posAfterR2, posNow } = getPositions();
    const before = posAfterR2[playerName];
    const after = posNow[playerName];
    if (before == null || after == null) return null;
    return before - after; // positivt = klatret opp
  }

  function getR3ToPar(playerName) {
    if (currentRound < 3) return null;
    const p = apiPlayers.find(a => a.name === playerName);
    if (!p || p.r1 == null || p.r2 == null) return null;
    const totalToParNum = p.toPar === 'E' ? 0 : parseInt(p.toPar) || 0;
    return totalToParNum - (p.r1 - 72) - (p.r2 - 72);
  }

  function getR3Strokes(playerName) {
    const p = apiPlayers.find(a => a.name === playerName);
    return p?.r3 ?? null;
  }

  function formatClimb(n) {
    if (n === null) return null;
    if (n === 0) return '±0';
    return n > 0 ? `▲${n}` : `▼${Math.abs(n)}`;
  }

  function formatScore(n) {
    if (n === null || n === undefined) return null;
    if (n === 0) return 'E';
    return n > 0 ? `+${n}` : String(n);
  }

  // Sorter bets: mest klatring vinner, tiebreaker nærmest R3-score
  const sorted = [...bets].sort((a, b) => {
    const aClimb = getClimb(a.player) ?? -999;
    const bClimb = getClimb(b.player) ?? -999;
    if (aClimb !== bClimb) return bClimb - aClimb; // Høyest klatring vinner
    // Tiebreaker: nærmest faktisk R3-slag
    const aActual = getR3Strokes(a.player) ?? 72;
    const bActual = getR3Strokes(b.player) ?? 72;
    return Math.abs(a.tiebreaker - aActual) - Math.abs(b.tiebreaker - bActual);
  });

  const isRegistered = !!bets.find(b => b.name === user?.username);

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div style={{ backgroundColor: AUGUSTA_GREEN, color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '14px 16px' }}>
          <div style={{ marginBottom: 10 }}>
            <h1 style={{ fontSize: 'clamp(17px, 5vw, 22px)', fontWeight: 700, lineHeight: 1.2 }}>
              📈 Lørdagsbet — Hvem klatrer mest?
            </h1>
            <p style={{ color: '#86efac', fontSize: 13, marginTop: 2 }}>
              Hvem klatrer mest på leaderboard i runde 3? · 25 kr å delta
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href="/" style={{ color: '#86efac', fontSize: 14, padding: '8px 12px', minHeight: 40, display: 'flex', alignItems: 'center', borderRadius: 8, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)' }}>← Tilbake</Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '16px 16px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Pott */}
        <div style={{ background: AUGUSTA_GREEN, borderRadius: 12, padding: '20px 16px', color: '#fff', textAlign: 'center' }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, opacity: 0.8, marginBottom: 8 }}>Premiepott</div>
          <div style={{ fontSize: 'clamp(32px, 10vw, 52px)', fontWeight: 800, lineHeight: 1 }}>{bets.length * 25} kr</div>
          <div style={{ marginTop: 8, opacity: 0.85, fontSize: 15 }}>{bets.length} deltaker{bets.length !== 1 ? 'e' : ''} × 25 kr</div>
          <div style={{ marginTop: 12, background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 14px', display: 'inline-block', fontSize: 14 }}>
            🏆 Vinneren tar alt
          </div>
        </div>

        {/* Regler */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: '16px' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 10 }}>📋 Slik fungerer lørdagsbetet</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['💰', 'Inngang er 25 kr. Påmelding er bindende — Vipps til Tom Richard Nygård.'],
              ['📅', 'Betet gjelder KUN runde 3 (lørdag 11. april) — hvem klatrer flest plasser på leaderboardet.'],
              ['📈', 'Velg en spiller du tror klatrer flest plasser fra sin plassering etter R2 til etter R3.'],
              ['🔢', 'Gjett også nøyaktig antall slag spilleren skyter i R3 (tiebreaker).'],
              ['🏆', 'Vinneren er den som plukket spilleren som klatret flest plasser i runde 3.'],
              ['⚖️', 'Tiebreaker: Hvis to plukker spillere som klatrer like mange plasser → den som gjettet nærmest antall R3-slag vinner.'],
              ['⏰', 'Frist: lørdag 11. april kl. 15:30 norsk tid — når første gruppe i runde 3 teer av.'],
              ['🔒', 'Etter fristen kan ikke tips endres. Listen oppdateres automatisk hvert minutt.'],
              ['📲', 'Vinneren får pengene direkte på Vipps når resultatet er klart.'],
            ].map(([icon, text]) => (
              <div key={text} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, color: '#374151', lineHeight: 1.5 }}>
                <span style={{ flexShrink: 0, marginTop: 1 }}>{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Skjema */}
        {!loading && (
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: '16px' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 12 }}>
              {locked ? '🔒 Fristen er ute' : user ? '📈 Ditt tips' : '🔐 Logg inn for å delta'}
            </h2>

            {!user && !locked && (
              <div style={{ fontSize: 14, color: '#6b7280' }}>
                <Link href="/login" style={{ color: AUGUSTA_GREEN, fontWeight: 600 }}>Logg inn</Link> for å registrere ditt tips.
              </div>
            )}

            {user && (
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                    Spiller du tror klatrer mest i runde 3
                  </label>
                  <select
                    value={myBet.player}
                    onChange={e => setMyBet(p => ({ ...p, player: e.target.value }))}
                    disabled={locked}
                    required
                    style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 10, padding: '0 14px', height: 52, fontSize: 16, background: locked ? '#f3f4f6' : '#fff', color: '#111827', outline: 'none', boxSizing: 'border-box' }}
                  >
                    <option value="">— Velg spiller —</option>
                    {players.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                    Antall slag du tror han skyter i R3 (tiebreaker)
                  </label>
                  <input
                    type="number" min={60} max={85}
                    value={myBet.tiebreaker}
                    onChange={e => setMyBet(p => ({ ...p, tiebreaker: e.target.value }))}
                    disabled={locked}
                    placeholder="f.eks. 66"
                    required
                    style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 10, padding: '0 14px', height: 52, fontSize: 16, background: locked ? '#f3f4f6' : '#fff', color: '#111827', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 14 }}>{error}</div>}
                {success && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', color: '#15803d', fontSize: 14, fontWeight: 600 }}>✓ Tips lagret!</div>}

                <button type="submit" disabled={saving || isRegistered} style={{
                  width: '100%',
                  background: saving ? '#6b7280' : isRegistered ? '#d1fae5' : AUGUSTA_GREEN,
                  color: isRegistered ? '#15803d' : '#fff',
                  border: isRegistered ? '2px solid #6ee7b7' : 'none',
                  borderRadius: 12, height: 52, fontSize: 16, fontWeight: 700,
                  cursor: (saving || isRegistered) ? 'not-allowed' : 'pointer',
                }}>
                  {saving ? 'Melder på...' : isRegistered ? '✓ Du er påmeldt' : '📈 Meld meg på'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Resultatliste */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: '16px' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 12 }}>
            🏆 Alle tips ({bets.length} deltakere)
          </h2>
          {sorted.length === 0 ? (
            <p style={{ fontSize: 14, color: '#9ca3af' }}>Ingen har registrert tips ennå.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {sorted.map((b, i) => {
                const climb = getClimb(b.player);
                const r3ToPar = getR3ToPar(b.player);
                const r3Strokes = getR3Strokes(b.player);
                const isMe = user?.username === b.name;
                return (
                  <div key={b.name} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 8,
                    background: i === 0 && climb !== null ? '#fffbeb' : isMe ? '#f0fdf4' : '#f9fafb',
                    border: i === 0 && climb !== null ? '2px solid #fde68a' : isMe ? '1px solid #bbf7d0' : '1px solid #f3f4f6',
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', width: 22, textAlign: 'center', flexShrink: 0 }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>
                        {b.name}{isMe ? ' (deg)' : ''}
                      </div>
                      <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                        {b.player} · tips: {b.tiebreaker} slag
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {climb !== null ? (
                        <>
                          <div style={{
                            fontSize: 14, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                            background: climb > 0 ? '#dcfce7' : climb < 0 ? '#fee2e2' : '#f3f4f6',
                            color: climb > 0 ? '#15803d' : climb < 0 ? '#b91c1c' : '#4b5563',
                          }}>
                            {formatClimb(climb)}
                          </div>
                          {r3ToPar !== null && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{formatScore(r3ToPar)}{r3Strokes ? ` (${r3Strokes})` : ''}</div>}
                        </>
                      ) : (
                        <span style={{ fontSize: 12, color: '#9ca3af' }}>Ikke startet</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
