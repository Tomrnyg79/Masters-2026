'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const AUGUSTA_GREEN = '#006747';
const DEADLINE = new Date('2026-04-10T11:40:00Z'); // Fredag 13:40 norsk tid

export default function FredagsbetPage() {
  const router = useRouter();
  const [user, setUser] = useState(undefined);
  const [players, setPlayers] = useState([]);
  const [bets, setBets] = useState([]);
  const [scores, setScores] = useState({});
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
        fetch('/api/fridaybet', { cache: 'no-store' }),
      ]);
      const [me, scoresData, betsData] = await Promise.all([
        meRes.json(), scoresRes.json(), betsRes.json(),
      ]);

      setUser(me.user || null);

      const playerList = (scoresData.players || [])
        .filter(p => p.status !== 'WD' && p.status !== 'MC')
        .map(p => p.name).sort();
      setPlayers(playerList);

      // Bygg score-map for R2
      const scoreMap = {};
      for (const p of (scoresData.players || [])) {
        scoreMap[p.name] = p;
      }
      setScores(scoreMap);

      setBets(betsData.bets || []);

      // Finn eget bet
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
    const res = await fetch('/api/fridaybet', {
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

  // Regn ut hvem som leder basert på R2-scores
  function getR2Score(playerName) {
    const p = scores[playerName];
    if (!p) return null;
    return p.r2 ?? null; // null = ikke ferdig ennå
  }

  function getR2ToPar(playerName) {
    const p = scores[playerName];
    if (!p) return null;
    // Beregn R2 to-par fra total toPar minus R1
    const totalToParNum = p.toPar === 'E' ? 0 : parseInt(p.toPar) || 0;
    if (p.r1 == null) return totalToParNum;
    return totalToParNum - (p.r1 - 72);
  }

  function formatScore(n) {
    if (n === null || n === undefined) return null;
    if (n === 0) return 'E';
    return n > 0 ? `+${n}` : String(n);
  }

  // Sorter bets etter R2-score (lavest vinner), tiebreaker = nærmest faktisk score
  const sorted = [...bets].sort((a, b) => {
    const aR2 = getR2ToPar(a.player);
    const bR2 = getR2ToPar(b.player);
    if (aR2 === null && bR2 === null) return 0;
    if (aR2 === null) return 1;
    if (bR2 === null) return -1;
    if (aR2 !== bR2) return aR2 - bR2;
    // Tiebreaker: nærmest faktisk slag
    const aActual = getR2Score(a.player) ?? 72;
    const bActual = getR2Score(b.player) ?? 72;
    return Math.abs(a.tiebreaker - aActual) - Math.abs(b.tiebreaker - bActual);
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div style={{ backgroundColor: AUGUSTA_GREEN, color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '14px 16px' }}>
          <div style={{ marginBottom: 10 }}>
            <h1 style={{ fontSize: 'clamp(17px, 5vw, 22px)', fontWeight: 700, lineHeight: 1.2 }}>
              🎯 Fredagsbet — Laveste runde
            </h1>
            <p style={{ color: '#86efac', fontSize: 13, marginTop: 2 }}>
              Hvem skyter lavest i runde 2? · 25 kr å delta
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href="/" style={{ color: '#86efac', fontSize: 14, padding: '8px 12px', minHeight: 40, display: 'flex', alignItems: 'center', borderRadius: 8, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)' }}>← Tilbake</Link>
            {user && (
              <Link href="/mypicks" style={{ background: '#fff', color: '#166534', fontWeight: 600, padding: '8px 14px', borderRadius: 8, fontSize: 14, minHeight: 40, display: 'flex', alignItems: 'center', textDecoration: 'none' }}>Mine valg</Link>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '16px 16px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Pott-oversikt */}
        <div style={{ background: AUGUSTA_GREEN, borderRadius: 12, padding: '20px 16px', color: '#fff', textAlign: 'center' }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, opacity: 0.8, marginBottom: 8 }}>Premiepott</div>
          <div style={{ fontSize: 'clamp(32px, 10vw, 52px)', fontWeight: 800, lineHeight: 1, letterSpacing: -1 }}>
            {bets.length * 25} kr
          </div>
          <div style={{ marginTop: 8, opacity: 0.85, fontSize: 15 }}>
            {bets.length} deltaker{bets.length !== 1 ? 'e' : ''} × 25 kr
          </div>
          <div style={{ marginTop: 12, background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 14px', display: 'inline-block', fontSize: 14 }}>
            🏆 Vinneren tar alt
          </div>
        </div>

        {/* Regler-boks */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: '16px' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 10 }}>📋 Slik fungerer fredagsbetet</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['💰', 'Inngang er 25 kr. Påmelding er bindende — du betaler uansett utfall.'],
              ['📅', 'Betet gjelder KUN runde 2 (fredag 10. april) — ikke turneringen totalt, ikke andre runder.'],
              ['🏌️', 'Velg én golfspiller du tror skyter lavest enkeltrundescore på fredag.'],
              ['🔢', 'Gjett også nøyaktig antall slag (f.eks. 65). Dette er tiebreaker — se under.'],
              ['🏆', 'Vinneren er den som plukket spilleren med færrest slag i runde 2 på fredag.'],
              ['⚖️', 'Tiebreaker regel 1: Hvis to deltakere plukker samme spiller → den som gjettet nærmest antall slag vinner.'],
              ['⚖️', 'Tiebreaker regel 2: Hvis to spillere slutter likt (f.eks. begge på 65) → blant de som valgte disse, vinner den med nærmest slaggjett.'],
              ['⏰', 'Frist for å registrere tips: fredag 10. april kl. 13:40 norsk tid — når første gruppe i runde 2 teer av.'],
              ['🔒', 'Etter fristen kan ikke tips endres. Resultatlisten oppdateres automatisk hvert minutt under runden.'],
              ['📲', 'Vinneren får pengene direkte på Vipps. Vipps-nummer til vinneren legges ut her så snart resultatet er klart.'],
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
              {locked ? '🔒 Fristen er ute' : user ? '🎯 Ditt tips' : '🔐 Logg inn for å delta'}
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
                    Spiller du tror skyter lavest fredag
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
                    Antall slag du tror han skyter (tiebreaker)
                  </label>
                  <input
                    type="number"
                    min={60} max={85}
                    value={myBet.tiebreaker}
                    onChange={e => setMyBet(p => ({ ...p, tiebreaker: e.target.value }))}
                    disabled={locked}
                    placeholder="f.eks. 65"
                    required
                    style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 10, padding: '0 14px', height: 52, fontSize: 16, background: locked ? '#f3f4f6' : '#fff', color: '#111827', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 14 }}>{error}</div>}
                {success && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', color: '#15803d', fontSize: 14, fontWeight: 600 }}>✓ Tips lagret!</div>}

                {!locked && (
                  <button type="submit" disabled={saving || !!bets.find(b => b.name === user?.username)} style={{
                    width: '100%',
                    background: saving ? '#6b7280' : bets.find(b => b.name === user?.username) ? '#d1fae5' : AUGUSTA_GREEN,
                    color: bets.find(b => b.name === user?.username) ? '#15803d' : '#fff',
                    border: bets.find(b => b.name === user?.username) ? '2px solid #6ee7b7' : 'none',
                    borderRadius: 12, height: 52, fontSize: 16, fontWeight: 700,
                    cursor: (saving || bets.find(b => b.name === user?.username)) ? 'not-allowed' : 'pointer',
                  }}>
                    {saving ? 'Melder på...' : bets.find(b => b.name === user?.username) ? '✓ Du er påmeldt' : '🎯 Meld meg på'}
                  </button>
                )}
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
                const r2ToPar = getR2ToPar(b.player);
                const r2Strokes = getR2Score(b.player);
                const isMe = user?.username === b.name;
                return (
                  <div key={b.name} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 8,
                    background: i === 0 && r2ToPar !== null ? '#fffbeb' : isMe ? '#f0fdf4' : '#f9fafb',
                    border: i === 0 && r2ToPar !== null ? '2px solid #fde68a' : isMe ? '1px solid #bbf7d0' : '1px solid #f3f4f6',
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', width: 22, textAlign: 'center', flexShrink: 0 }}>
                      {i + 1}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>
                        {b.name}{isMe ? ' (deg)' : ''}
                      </div>
                      <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                        {b.player} · tips: {b.tiebreaker} slag
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {r2ToPar !== null ? (
                        <>
                          <div style={{
                            fontSize: 14, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                            background: r2ToPar < 0 ? '#fee2e2' : r2ToPar > 0 ? '#dbeafe' : '#f3f4f6',
                            color: r2ToPar < 0 ? '#b91c1c' : r2ToPar > 0 ? '#1d4ed8' : '#4b5563',
                          }}>
                            {formatScore(r2ToPar)}
                          </div>
                          {r2Strokes && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{r2Strokes} slag</div>}
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
