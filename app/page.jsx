'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { calculateParticipantScore, formatToPar } from '../lib/scoring';
import './globals.css';

const AUGUSTA_GREEN = '#006747';
const SCORE_REFRESH = 60 * 1000;
const TEETIME_REFRESH = 60 * 60 * 1000;

function formatTeeTime(isoString) {
  if (!isoString) return null;
  const date = new Date(isoString);
  return date.toLocaleTimeString('nb-NO', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Oslo',
  });
}

function getActiveRound(teeTimes) {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  for (const playerRounds of Object.values(teeTimes)) {
    for (const r of playerRounds) {
      if (r.teeTime && r.teeTime.startsWith(today)) return { round: r.round, label: 'i dag' };
    }
  }
  let next = null;
  for (const playerRounds of Object.values(teeTimes)) {
    for (const r of playerRounds) {
      if (!r.teeTime) continue;
      const t = new Date(r.teeTime);
      if (t > now && (!next || t < new Date(next.teeTime))) {
        next = r;
      }
    }
  }
  if (next) return { round: next.round, label: 'neste runde' };
  return null;
}

function calcStats(participants) {
  const playerCount = {};
  const pickSets = [];

  for (const p of participants) {
    const sorted = [...p.picks].sort().join('|');
    pickSets.push({ name: p.name, key: sorted });
    for (const pick of p.picks) {
      playerCount[pick] = (playerCount[pick] || 0) + 1;
    }
  }

  const topPicks = Object.entries(playerCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const groups = {};
  for (const { name, key } of pickSets) {
    if (!groups[key]) groups[key] = [];
    groups[key].push(name);
  }
  const identical = Object.values(groups).filter(g => g.length > 1);

  return { topPicks, identical };
}

function RankBadge({ rank }) {
  if (rank === 1) return <span style={{ fontSize: 22 }}>🥇</span>;
  if (rank === 2) return <span style={{ fontSize: 22 }}>🥈</span>;
  if (rank === 3) return <span style={{ fontSize: 22 }}>🥉</span>;
  return (
    <span style={{
      fontWeight: 700, color: '#6b7280', width: 28, textAlign: 'center',
      display: 'inline-block', fontSize: 15,
    }}>{rank}</span>
  );
}

function getTodayToPar(pd, currentRound) {
  if (pd.toParNum === undefined || pd.toParNum === null) return null;
  const completed = [pd.r1, pd.r2, pd.r3, pd.r4]
    .slice(0, (currentRound || 1) - 1)
    .reduce((sum, r) => r != null ? sum + (r - 72) : sum, 0);
  return pd.toParNum - completed;
}

function ToParBadge({ toPar }) {
  if (!toPar || toPar === 'E' || toPar === '0') {
    return <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 12, fontWeight: 700, background: '#f3f4f6', color: '#4b5563' }}>E</span>;
  }
  const num = parseInt(toPar);
  if (isNaN(num)) return <span style={{ fontSize: 12, color: '#6b7280' }}>{toPar}</span>;
  if (num < 0) return <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 12, fontWeight: 700, background: '#fee2e2', color: '#b91c1c' }}>{toPar}</span>;
  return <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 12, fontWeight: 700, background: '#dbeafe', color: '#1d4ed8' }}>+{num}</span>;
}

function PlayerCell({ player, teeTimeRounds, todayRound, currentRound }) {
  if (!player) return <td className="px-2 py-2 text-gray-300 text-sm">-</td>;
  const { name, total, toParNum, status, r1, r2, r3, r4, thru, isReserve } = player;
  const todayTT = teeTimeRounds?.find(r => r.round === todayRound);
  const todayToPar = getTodayToPar(player, currentRound);
  const completedRounds = [r1, r2, r3, r4].filter(r => r !== null && r !== undefined);
  let rowBg = '';
  if (status === 'MC') rowBg = 'bg-red-50';
  else if (isReserve) rowBg = 'bg-purple-50';

  return (
    <td className={`px-2 py-2 text-sm align-top ${rowBg} border-r border-gray-100`}>
      <div className="flex items-center gap-1 mb-1">
        {isReserve && <span className="text-purple-500 text-xs font-bold">(R)</span>}
        <span className="font-medium text-gray-800 truncate max-w-[130px]" title={name}>{name}</span>
      </div>
      {status === 'not_started' && (
        <div className="text-xs text-gray-400">Ikke startet</div>
      )}
      {status === 'MC' && (
        <div className="text-xs text-red-600 font-semibold">🔴 MC · R1:{r1} R2:{r2}</div>
      )}
      {status === 'active' && todayToPar !== null && (
        <div className="flex items-center gap-1 mb-0.5">
          <span className="text-xs text-gray-500 font-medium">I dag:</span>
          <ToParBadge toPar={formatToPar(todayToPar)} />
          {thru && <span className="text-xs text-gray-400">({thru === 'F' ? 'F' : `H${thru}`})</span>}
        </div>
      )}
      {status === 'active' && toParNum !== undefined && (
        <div className="flex items-center gap-1 mb-0.5">
          <span className="text-xs text-gray-500 font-medium">Tot:</span>
          <ToParBadge toPar={formatToPar(toParNum)} />
        </div>
      )}
      {completedRounds.length > 0 && (
        <div className="flex gap-1 flex-wrap mt-0.5">
          {[r1, r2, r3, r4].map((r, i) => r !== null && r !== undefined ? (
            <span key={i} className="text-xs bg-gray-100 rounded px-1 text-gray-600 font-mono">R{i+1}:{r}</span>
          ) : null)}
        </div>
      )}
      {todayTT?.teeTime && (
        <div className="text-xs text-green-700 mt-0.5">⏰ {formatTeeTime(todayTT.teeTime)}</div>
      )}
    </td>
  );
}

function MastersTop10({ apiPlayers }) {
  if (!apiPlayers || apiPlayers.length === 0) return null;

  const sorted = [...apiPlayers]
    .filter(p => p.status !== 'WD')
    .sort((a, b) => {
      const aNum = a.toPar === 'E' ? 0 : parseInt(a.toPar) || 0;
      const bNum = b.toPar === 'E' ? 0 : parseInt(b.toPar) || 0;
      return aNum - bNum;
    })
    .slice(0, 10);

  return (
    <div style={{
      background: '#fff', borderRadius: 12,
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      padding: '16px',
      marginBottom: 20,
    }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 12 }}>
        🏆 Topp 10 — The Masters
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sorted.map((p, i) => {
          const toParNum = p.toPar === 'E' ? 0 : parseInt(p.toPar) || 0;
          const color = toParNum < 0 ? '#b91c1c' : toParNum > 0 ? '#1d4ed8' : '#4b5563';
          const bg = toParNum < 0 ? '#fee2e2' : toParNum > 0 ? '#dbeafe' : '#f3f4f6';
          return (
            <div key={p.id || p.name} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '7px 10px', borderRadius: 8,
              background: i === 0 ? '#fffbeb' : '#f9fafb',
              border: i === 0 ? '1px solid #fde68a' : '1px solid #f3f4f6',
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', width: 20, textAlign: 'center', flexShrink: 0 }}>
                {i + 1}
              </span>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#111827', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.name}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: bg, color, flexShrink: 0 }}>
                {p.toPar === 'E' || p.toPar === '0' ? 'E' : toParNum > 0 ? `+${toParNum}` : p.toPar}
              </span>
              {p.thru && (
                <span style={{ fontSize: 12, color: '#9ca3af', flexShrink: 0, minWidth: 36, textAlign: 'right' }}>
                  {p.thru === 'F' ? 'F' : `H${p.thru}`}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Home() {
  const [scoreData, setScoreData] = useState(null);
  const [teeTimeData, setTeeTimeData] = useState({});
  const [participants, setParticipants] = useState([]);
  const [user, setUser] = useState(undefined);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);

  const fetchAll = useCallback(async () => {
    const [scoresRes, picksRes, meRes] = await Promise.all([
      fetch('/api/scores', { cache: 'no-store' }),
      fetch('/api/allpicks', { cache: 'no-store' }),
      fetch('/api/auth/me', { cache: 'no-store' }),
    ]);
    const [scores, picks, me] = await Promise.all([
      scoresRes.json(), picksRes.json(), meRes.json(),
    ]);
    const loadedParticipants = picks.participants || [];
    setScoreData(scores);
    setParticipants(loadedParticipants);
    setUser(me.user || null);
    setLastUpdated(new Date());
    setLoading(false);
    return loadedParticipants;
  }, []);

  const fetchTeeTimes = useCallback(async (currentParticipants) => {
    const uniquePlayers = [...new Set(
      (currentParticipants || []).flatMap(p => [...(p.picks || []), p.reserve].filter(Boolean))
    )];
    const query = uniquePlayers.length > 0
      ? `?players=${encodeURIComponent(uniquePlayers.join(','))}`
      : '';
    const res = await fetch(`/api/teetimes${query}`);
    const data = await res.json();
    setTeeTimeData(data.teeTimes || {});
  }, []);

  useEffect(() => {
    fetchAll().then(loaded => fetchTeeTimes(loaded));
    const s = setInterval(fetchAll, SCORE_REFRESH);
    const t = setInterval(() => fetchTeeTimes(participants), TEETIME_REFRESH);
    return () => { clearInterval(s); clearInterval(t); };
  }, [fetchAll, fetchTeeTimes]);

  const apiPlayers = scoreData?.players || [];
  const activeRoundInfo = getActiveRound(teeTimeData);
  const todayRound = activeRoundInfo?.round ?? null;
  const tournamentState = scoreData?.tournamentState || 'pre';
  const tournamentStarted = apiPlayers.length > 0 && tournamentState !== 'pre';

  const standings = participants
    .map(p => {
      const result = calculateParticipantScore(p, apiPlayers);
      const playerDetails = result.playerDetails.map(pd => ({
        ...pd,
        teeTimeRounds: teeTimeData[pd.name] || [],
      }));
      return { ...result, playerDetails };
    })
    .sort((a, b) => a.total - b.total)
    .map((entry, i, arr) => ({
      ...entry,
      rank: i === 0 ? 1 : entry.total === arr[i-1].total ? arr[i-1].rank : i + 1,
    }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="text-white shadow-lg" style={{ backgroundColor: AUGUSTA_GREEN }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '14px 16px' }}>
          {/* Rad 1: Tittel */}
          <div style={{ marginBottom: 10 }}>
            <h1 style={{ fontSize: 'clamp(18px, 5vw, 26px)', fontWeight: 700, lineHeight: 1.2 }}>
              ⛳ Masters 2026 Konkurranse
            </h1>
            <p style={{ color: '#86efac', fontSize: 13, marginTop: 2 }}>
              Augusta National · 9–12. april 2026
              {user ? <span> · {user.username}</span> : null}
            </p>
          </div>
          {/* Rad 2: Nav */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href="/regler" style={{
              color: '#86efac', fontSize: 14, padding: '8px 12px',
              minHeight: 40, display: 'flex', alignItems: 'center',
              borderRadius: 8, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)',
            }}>Regler</Link>
            <Link href="/premier" style={{
              color: '#86efac', fontSize: 14, padding: '8px 12px',
              minHeight: 40, display: 'flex', alignItems: 'center',
              borderRadius: 8, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)',
            }}>Premier</Link>
            {user === undefined ? null : user ? (
              <>
                <Link href="/mypicks" style={{
                  background: '#fff', color: '#166534', fontWeight: 600,
                  padding: '8px 14px', borderRadius: 8, fontSize: 14,
                  minHeight: 40, display: 'flex', alignItems: 'center',
                  textDecoration: 'none',
                }}>Mine valg</Link>
                <button
                  onClick={async () => {
                    await fetch('/api/auth/logout', { method: 'POST' });
                    setUser(null);
                  }}
                  style={{
                    fontSize: 14, background: 'rgba(0,0,0,0.25)', color: '#fff',
                    border: 'none', borderRadius: 8, padding: '8px 14px',
                    minHeight: 40, cursor: 'pointer', fontWeight: 500,
                  }}
                >Logg ut</button>
              </>
            ) : (
              <>
                <Link href="/login" style={{
                  color: '#86efac', fontSize: 14, padding: '8px 12px',
                  minHeight: 40, display: 'flex', alignItems: 'center',
                  borderRadius: 8, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)',
                }}>Logg inn</Link>
                <Link href="/register" style={{
                  background: '#fff', color: '#166534', fontWeight: 600,
                  padding: '8px 14px', borderRadius: 8, fontSize: 14,
                  minHeight: 40, display: 'flex', alignItems: 'center',
                  textDecoration: 'none',
                }}>Registrer</Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-5">

        {tournamentStarted
          ? <MastersTop10 apiPlayers={apiPlayers} />
          : <WelcomeSection participants={participants} tournamentStarted={tournamentStarted} />
        }

        {/* Status bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            {!tournamentStarted && !loading && (
              <span style={{
                padding: '8px 14px', borderRadius: 20, fontSize: 14, fontWeight: 500,
                background: '#fef9c3', color: '#854d0e',
              }}>
                🗓 Starter torsdag 9. april 2026
              </span>
            )}
            {tournamentStarted && (
              <span style={{
                padding: '8px 14px', borderRadius: 20, fontSize: 14, fontWeight: 500,
                background: '#dcfce7', color: '#166534',
              }}>
                🟢 {scoreData?.eventName} · Runde {scoreData?.currentRound}
              </span>
            )}
            {activeRoundInfo && (
              <span style={{
                padding: '8px 14px', borderRadius: 20, fontSize: 14,
                background: '#eff6ff', color: '#1d4ed8',
              }}>
                Runde {activeRoundInfo.round} {activeRoundInfo.label}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6b7280' }}>
            {lastUpdated && <span>Oppdatert {lastUpdated.toLocaleTimeString('nb-NO')}</span>}
            <button
              onClick={fetchAll}
              disabled={loading}
              style={{
                padding: '8px 14px', borderRadius: 6, border: '1px solid #d1d5db',
                background: '#fff', fontSize: 14, minHeight: 36, cursor: 'pointer',
                opacity: loading ? 0.5 : 1,
              }}
            >
              {loading ? '...' : '↻ Oppdater'}
            </button>
          </div>
        </div>

        {/* Ingen picks ennå */}
        {standings.length === 0 && !loading && (
          <div style={{
            textAlign: 'center', padding: '40px 16px', background: '#fff',
            borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>🏌️</p>
            <p style={{ fontSize: 17, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Ingen valg registrert ennå</p>
            <p style={{ fontSize: 15 }}>
              <Link href="/register" style={{ color: AUGUSTA_GREEN, fontWeight: 600, textDecoration: 'underline' }}>
                Vær den første til å registrere deg!
              </Link>
            </p>
          </div>
        )}

        {standings.length > 0 && (
          <>
            {/* Desktop-tabell */}
            <div className="hidden lg:block overflow-x-auto rounded-lg shadow">
              <table className="min-w-full bg-white text-sm">
                <thead>
                  <tr className="text-white text-xs uppercase tracking-wide" style={{ backgroundColor: AUGUSTA_GREEN }}>
                    <th className="px-3 py-3 text-left w-10">#</th>
                    <th className="px-3 py-3 text-left min-w-[140px]">Deltaker</th>
                    <th className="px-2 py-3 text-left min-w-[160px]">Spiller 1</th>
                    <th className="px-2 py-3 text-left min-w-[160px]">Spiller 2</th>
                    <th className="px-2 py-3 text-left min-w-[160px]">Spiller 3</th>
                    <th className="px-2 py-3 text-left min-w-[160px]">Spiller 4</th>
                    <th className="px-3 py-3 text-right min-w-[80px]">Totalt</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((entry, i) => (
                    <tr key={entry.name} className={`border-b ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-green-50 transition-colors`}>
                      <td className="px-3 py-2 text-center"><RankBadge rank={entry.rank} /></td>
                      <td className="px-3 py-2 font-semibold text-gray-900">{entry.name}</td>
                      {entry.playerDetails.map((pd, j) => (
                        <PlayerCell key={j} player={pd} teeTimeRounds={pd.teeTimeRounds} todayRound={todayRound} currentRound={scoreData?.currentRound} />
                      ))}
                      <td className="px-3 py-2 text-right">
                        <div className={`text-base font-bold ${entry.rank === 1 ? 'text-yellow-600' : 'text-gray-800'}`}>
                          {entry.total} slag
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatToPar(entry.total - 1152)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobil-kort */}
            <div className="lg:hidden" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {standings.map((entry) => (
                <div
                  key={entry.name}
                  style={{
                    background: '#fff',
                    borderRadius: 12,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    overflow: 'hidden',
                    borderLeft: `5px solid ${entry.rank === 1 ? '#d97706' : entry.rank === 2 ? '#9ca3af' : entry.rank === 3 ? '#92400e' : AUGUSTA_GREEN}`,
                  }}
                >
                  <button
                    style={{
                      width: '100%', padding: '14px 16px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: 'none', border: 'none', cursor: 'pointer',
                      minHeight: 64, textAlign: 'left',
                    }}
                    onClick={() => setExpandedRow(expandedRow === entry.name ? null : entry.name)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                      <RankBadge rank={entry.rank} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 16, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {entry.name}
                        </div>
                        {/* Show player names in collapsed state */}
                        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {entry.playerDetails.map(pd => pd?.name?.split(' ').pop()).filter(Boolean).join(' · ')}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 8 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontSize: 17, fontWeight: 800,
                          color: entry.rank === 1 ? '#d97706' : '#111827',
                        }}>
                          {entry.total}
                        </div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>slag</div>
                      </div>
                      <span style={{ color: '#9ca3af', fontSize: 14 }}>
                        {expandedRow === entry.name ? '▲' : '▼'}
                      </span>
                    </div>
                  </button>

                  {expandedRow === entry.name && (
                    <div style={{ borderTop: '1px solid #f3f4f6', padding: '12px 16px' }}>
                      {/* To-par total */}
                      <div style={{ marginBottom: 12, fontSize: 13, color: '#6b7280' }}>
                        Totalt: <strong style={{ color: '#111827' }}>{entry.total} slag</strong>
                        {' '}({formatToPar(entry.total - 1152)} i forhold til par)
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {entry.playerDetails.map((pd, j) => {
                          const todayTT = pd.teeTimeRounds?.find(r => r.round === todayRound);
                          const todayToPar = getTodayToPar(pd, scoreData?.currentRound);
                          return (
                            <div
                              key={j}
                              style={{
                                padding: '10px 12px',
                                borderRadius: 8,
                                background: pd.status === 'MC' ? '#fef2f2' : pd.isReserve ? '#faf5ff' : '#f9fafb',
                                border: pd.status === 'MC' ? '1px solid #fecaca' : pd.isReserve ? '1px solid #e9d5ff' : '1px solid #f3f4f6',
                              }}
                            >
                              {/* Navn */}
                              <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 6 }}>
                                {pd.isReserve && <span style={{ color: '#7c3aed', fontSize: 11, fontWeight: 700, marginRight: 4 }}>(R)</span>}
                                {pd.name}
                              </div>

                              {pd.status === 'not_started' && (
                                <div style={{ fontSize: 12, color: '#9ca3af' }}>Ikke startet</div>
                              )}

                              {pd.status === 'MC' && (
                                <div style={{ fontSize: 12, color: '#dc2626', fontWeight: 600 }}>
                                  🔴 MC · R1:{pd.r1} R2:{pd.r2}
                                </div>
                              )}

                              {pd.status === 'active' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  {/* I dag */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ fontSize: 12, color: '#6b7280', width: 48 }}>I dag:</span>
                                    <ToParBadge toPar={formatToPar(todayToPar)} />
                                    {pd.thru && (
                                      <span style={{ fontSize: 12, color: '#6b7280' }}>
                                        {pd.thru === 'F' ? 'Ferdig' : `hull ${pd.thru}/18`}
                                      </span>
                                    )}
                                  </div>
                                  {/* Totalt */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ fontSize: 12, color: '#6b7280', width: 48 }}>Totalt:</span>
                                    <ToParBadge toPar={formatToPar(pd.toParNum)} />
                                  </div>
                                  {/* Runde-scores */}
                                  {[pd.r1, pd.r2, pd.r3, pd.r4].some(r => r != null) && (
                                    <div style={{ display: 'flex', gap: 4, marginTop: 2, flexWrap: 'wrap' }}>
                                      {[pd.r1, pd.r2, pd.r3, pd.r4].map((r, i) => r != null ? (
                                        <span key={i} style={{ fontSize: 11, background: '#e5e7eb', borderRadius: 4, padding: '1px 5px', fontFamily: 'monospace', color: '#374151' }}>
                                          R{i+1}:{r}
                                        </span>
                                      ) : null)}
                                    </div>
                                  )}
                                </div>
                              )}

                              {todayTT?.teeTime && (
                                <div style={{ fontSize: 12, color: '#15803d', marginTop: 6 }}>
                                  ⏰ {formatTeeTime(todayTT.teeTime)}{todayTT.startTee === 10 && ' (hull 10)'}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ marginTop: 16, fontSize: 12, color: '#9ca3af', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <span>🔴 MC = Misset cut → 79+79 for R3+R4</span>
          <span>🟣 (R) = Reserve brukt</span>
          <span>⏰ = Tee-tid norsk tid</span>
          <span>↻ Scores oppdateres hvert minutt</span>
        </div>
      </div>
    </div>
  );
}
