'use client';

import { useEffect, useState, useCallback } from 'react';
import { participants } from '../data/participants';
import { calculateParticipantScore, findPlayer } from '../lib/scoring';
import './globals.css';

const AUGUSTA_GREEN = '#006747';
const SCORE_REFRESH = 60 * 1000;       // scores: hvert minutt
const TEETIME_REFRESH = 60 * 60 * 1000; // tee-tider: hver time

// Formater tee-tid til norsk tid
function formatTeeTime(isoString) {
  if (!isoString) return null;
  const date = new Date(isoString);
  return date.toLocaleTimeString('nb-NO', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Oslo',
  });
}

function formatTeeDate(isoString) {
  if (!isoString) return null;
  const date = new Date(isoString);
  return date.toLocaleDateString('nb-NO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'Europe/Oslo',
  });
}

// Hvilken runde spilles i dag?
function getTodayRound(teeTimes) {
  const today = new Date().toISOString().split('T')[0];
  for (const playerRounds of Object.values(teeTimes)) {
    for (const r of playerRounds) {
      if (r.teeTime && r.teeTime.startsWith(today)) return r.round;
    }
  }
  return null;
}

function RankBadge({ rank }) {
  if (rank === 1) return <span className="text-xl">🥇</span>;
  if (rank === 2) return <span className="text-xl">🥈</span>;
  if (rank === 3) return <span className="text-xl">🥉</span>;
  return <span className="font-bold text-gray-600 w-6 text-center inline-block">{rank}</span>;
}

function ToParBadge({ toPar }) {
  if (!toPar || toPar === 'E' || toPar === '0') {
    return <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-600">E</span>;
  }
  const num = parseInt(toPar);
  if (isNaN(num)) return <span className="text-xs text-gray-500">{toPar}</span>;
  if (num < 0) return <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700">{toPar}</span>;
  return <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700">+{num}</span>;
}

function PlayerCell({ pick, playerData, teeTimeRounds, todayRound }) {
  if (!pick) return <td className="px-2 py-2 text-gray-300 text-sm">-</td>;

  const player = playerData;
  const { total, status, r1, r2, r3, r4, toPar, thru, isReserve, originalName } = player || {};

  // Finn tee-tid for i dag
  const todayTeeTime = teeTimeRounds?.find(r => r.round === todayRound);

  let rowBg = '';
  if (status === 'MC') rowBg = 'bg-red-50';
  else if (isReserve) rowBg = 'bg-purple-50';

  const rounds = [r1, r2, r3, r4];
  const completedRounds = rounds.filter(r => r !== null && r !== undefined);

  return (
    <td className={`px-2 py-2 text-sm align-top ${rowBg} border-r border-gray-100`}>
      {/* Spillernavn */}
      <div className="flex items-center gap-1 mb-0.5">
        {isReserve && <span className="text-purple-500 text-xs font-bold">(R)</span>}
        <span className="font-medium text-gray-800 truncate max-w-[130px]" title={pick}>
          {pick}
        </span>
      </div>

      {/* Score til par + thru */}
      {status !== 'MC' && (toPar || thru) && (
        <div className="flex items-center gap-1 mb-0.5">
          {toPar && <ToParBadge toPar={toPar} />}
          {thru && <span className="text-xs text-gray-500">{thru}</span>}
        </div>
      )}

      {/* Runde-scores */}
      {completedRounds.length > 0 && (
        <div className="flex gap-1 mb-0.5">
          {[r1, r2, r3, r4].map((r, i) =>
            r !== null && r !== undefined ? (
              <span key={i} className="text-xs bg-gray-100 rounded px-1 text-gray-700 font-mono">
                R{i + 1}:{r}
              </span>
            ) : null
          )}
          {status !== 'MC' && (
            <span className="text-xs font-bold text-gray-800 ml-1">={total}</span>
          )}
        </div>
      )}

      {/* MC */}
      {status === 'MC' && (
        <div className="text-xs text-red-600 font-semibold">
          MC · {(r1 || 0) + (r2 || 0)} + 79+79 = {total}
        </div>
      )}

      {/* Tee-tid */}
      {todayTeeTime?.teeTime && (
        <div className="text-xs text-green-700 mt-0.5">
          ⏰ {formatTeeTime(todayTeeTime.teeTime)}
          {todayTeeTime.startTee === 10 && ' (hull 10)'}
          {todayTeeTime.groupNumber && (
            <span className="text-gray-400 ml-1">· gr.{todayTeeTime.groupNumber}</span>
          )}
        </div>
      )}

      {/* Ikke startet */}
      {completedRounds.length === 0 && status !== 'MC' && !thru && (
        <div className="text-xs text-gray-400">Ikke startet</div>
      )}
    </td>
  );
}

export default function Home() {
  const [scoreData, setScoreData] = useState(null);
  const [teeTimeData, setTeeTimeData] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  const fetchScores = useCallback(async () => {
    try {
      const res = await fetch('/api/scores');
      const data = await res.json();
      setScoreData(data);
      setLastUpdated(new Date());
      setError(null);
    } catch {
      setError('Kunne ikke hente resultater');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTeeTimes = useCallback(async () => {
    try {
      const res = await fetch('/api/teetimes');
      const data = await res.json();
      setTeeTimeData(data.teeTimes || {});
    } catch {
      // tee-tider er ikke kritiske
    }
  }, []);

  useEffect(() => {
    fetchScores();
    fetchTeeTimes();
    const scoreInterval = setInterval(fetchScores, SCORE_REFRESH);
    const teeInterval = setInterval(fetchTeeTimes, TEETIME_REFRESH);
    return () => {
      clearInterval(scoreInterval);
      clearInterval(teeInterval);
    };
  }, [fetchScores, fetchTeeTimes]);

  const apiPlayers = scoreData?.players || [];
  const todayRound = getTodayRound(teeTimeData);
  const tournamentState = scoreData?.tournamentState || 'pre';

  // Beregn stillingsliste
  const standings = participants.length === 0 ? [] :
    participants
      .map(p => {
        const result = calculateParticipantScore(p, apiPlayers);
        // Legg til tee-tider for hver spiller
        const playerDetails = result.playerDetails.map(pd => ({
          ...pd,
          teeTimeRounds: teeTimeData[pd.name] || [],
        }));
        return { ...result, playerDetails };
      })
      .sort((a, b) => a.total - b.total)
      .map((entry, i, arr) => ({
        ...entry,
        rank: i === 0 ? 1 : entry.total === arr[i - 1].total ? arr[i - 1].rank : i + 1,
      }));

  const tournamentStarted = apiPlayers.length > 0 && tournamentState !== 'pre';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="text-white py-5 px-4 text-center shadow-lg" style={{ backgroundColor: AUGUSTA_GREEN }}>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">⛳ Masters 2026 Konkurranse</h1>
        <p className="mt-1 text-green-200 text-sm">Lavest totalt antall slag vinner · 4 spillere + reserve</p>
      </div>

      <div className="max-w-screen-xl mx-auto px-2 md:px-4 py-4">
        {/* Status-bar */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {!tournamentStarted && !loading && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                🗓 Starter torsdag 9. april 2026
              </span>
            )}
            {tournamentStarted && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                🟢 {scoreData?.eventName} · Runde {scoreData?.currentRound}
              </span>
            )}
            {tournamentState === 'post' && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-200 text-gray-700">
                🏆 Avsluttet
              </span>
            )}
            {todayRound && (
              <span className="px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700">
                Runde {todayRound} spilles i dag
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            {lastUpdated && (
              <span>Oppdatert {lastUpdated.toLocaleTimeString('nb-NO')}</span>
            )}
            <button
              onClick={() => { fetchScores(); fetchTeeTimes(); }}
              disabled={loading}
              className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 text-sm"
            >
              {loading ? '...' : '↻'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>
        )}

        {participants.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">⛳</p>
            <p className="text-lg font-medium">Picks legges inn fortløpende</p>
            <p className="text-sm mt-1">Deltakerne posters i <code className="bg-gray-100 px-1 rounded">data/participants.js</code></p>
          </div>
        )}

        {/* Desktop-tabell */}
        {standings.length > 0 && (
          <>
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
                    <tr
                      key={entry.name}
                      className={`border-b ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-green-50 transition-colors`}
                    >
                      <td className="px-3 py-2 text-center">
                        <RankBadge rank={entry.rank} />
                      </td>
                      <td className="px-3 py-2 font-semibold text-gray-900">{entry.name}</td>
                      {entry.playerDetails.map((pd, j) => (
                        <PlayerCell
                          key={j}
                          pick={pd.isReserve ? pd.name : participants.find(p => p.name === entry.name)?.picks[j]}
                          playerData={pd}
                          teeTimeRounds={pd.teeTimeRounds}
                          todayRound={todayRound}
                        />
                      ))}
                      <td className="px-3 py-2 text-right">
                        <span className={`text-base font-bold ${entry.rank === 1 ? 'text-yellow-600' : 'text-gray-800'}`}>
                          {entry.total > 0 ? entry.total : '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobil-kort */}
            <div className="lg:hidden space-y-3">
              {standings.map((entry) => (
                <div
                  key={entry.name}
                  className="bg-white rounded-lg shadow overflow-hidden"
                  style={{ borderLeft: `4px solid ${entry.rank === 1 ? '#d97706' : AUGUSTA_GREEN}` }}
                >
                  <button
                    className="w-full px-4 py-3 flex items-center justify-between"
                    onClick={() => setExpandedRow(expandedRow === entry.name ? null : entry.name)}
                  >
                    <div className="flex items-center gap-2">
                      <RankBadge rank={entry.rank} />
                      <span className="font-bold text-gray-900">{entry.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-800">
                        {entry.total > 0 ? `${entry.total}` : '-'}
                      </span>
                      <span className="text-gray-400 text-sm">{expandedRow === entry.name ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {expandedRow === entry.name && (
                    <div className="px-4 pb-4 pt-1 grid grid-cols-2 gap-2 border-t border-gray-100">
                      {entry.playerDetails.map((pd, j) => {
                        const pickName = pd.isReserve ? pd.name : participants.find(p => p.name === entry.name)?.picks[j];
                        const todayTT = pd.teeTimeRounds?.find(r => r.round === todayRound);
                        return (
                          <div key={j} className={`text-sm p-2 rounded ${pd.status === 'MC' ? 'bg-red-50' : pd.isReserve ? 'bg-purple-50' : 'bg-gray-50'}`}>
                            <div className="font-medium truncate">{pd.isReserve && '(R) '}{pickName}</div>
                            <div className="flex gap-1 mt-0.5 flex-wrap">
                              {pd.toPar && <ToParBadge toPar={pd.toPar} />}
                              {pd.thru && <span className="text-xs text-gray-500">{pd.thru}</span>}
                            </div>
                            {pd.status === 'MC' && (
                              <div className="text-xs text-red-600 font-semibold mt-0.5">MC · {pd.total} slag</div>
                            )}
                            {todayTT?.teeTime && (
                              <div className="text-xs text-green-700 mt-0.5">⏰ {formatTeeTime(todayTT.teeTime)}</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Forklaring */}
        <div className="mt-4 text-xs text-gray-400 flex flex-wrap gap-3">
          <span>🔴 MC = Misset cut → 79+79 for R3+R4</span>
          <span>🟣 (R) = Reserve brukt</span>
          <span>⏰ = Tee-tid norsk tid</span>
          <span>↻ Scores oppdateres automatisk hvert minutt</span>
        </div>
      </div>
    </div>
  );
}
