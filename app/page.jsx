'use client';

import { useEffect, useState } from 'react';
import { participants } from '../data/participants';
import { calculateParticipantScore } from '../lib/scoring';
import './globals.css';

const AUGUSTA_GREEN = '#006747';
const REFRESH_INTERVAL = 3 * 60 * 1000; // 3 minutter

function ScoreCell({ player }) {
  if (!player) return <td className="px-3 py-2 text-gray-400 text-sm">-</td>;

  const { name, total, status, r1, r2, r3, r4, isReserve, originalName } = player;

  let bgColor = '';
  let label = name;
  let scoreText = '';

  if (isReserve) {
    bgColor = 'bg-purple-50';
    label = `↩ ${name}`;
  }

  if (status === 'MC') {
    bgColor = 'bg-red-50';
    scoreText = `${(r1||0)+(r2||0)}+79+79 = ${total}`;
  } else if (status === 'not_found' || total === null) {
    scoreText = '-';
  } else {
    const rounds = [r1, r2, r3, r4].filter(r => r !== null && r !== undefined);
    scoreText = rounds.length > 0 ? `${total}` : '-';
  }

  return (
    <td className={`px-3 py-2 text-sm ${bgColor}`}>
      <div className="font-medium text-gray-800 truncate max-w-[140px]" title={name}>
        {isReserve && <span className="text-purple-600 text-xs mr-1">(R)</span>}
        {label}
      </div>
      {status === 'MC' && (
        <div className="text-red-600 text-xs font-semibold">MC · {scoreText}</div>
      )}
      {status === 'active' && scoreText !== '-' && (
        <div className="text-gray-600 text-xs">{scoreText} slag</div>
      )}
      {(status === 'not_found' || scoreText === '-') && (
        <div className="text-gray-400 text-xs">Ikke startet</div>
      )}
    </td>
  );
}

function RankBadge({ rank }) {
  if (rank === 1) return <span className="text-2xl">🥇</span>;
  if (rank === 2) return <span className="text-2xl">🥈</span>;
  if (rank === 3) return <span className="text-2xl">🥉</span>;
  return <span className="text-gray-600 font-bold">{rank}</span>;
}

export default function Home() {
  const [apiData, setApiData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchScores() {
    try {
      setLoading(true);
      const res = await fetch('/api/scores');
      const data = await res.json();
      setApiData(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      setError('Kunne ikke hente resultater');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchScores();
    const interval = setInterval(fetchScores, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // Beregn stillingsliste
  const standings = participants
    .map(p => calculateParticipantScore(p, apiData?.players || []))
    .sort((a, b) => a.total - b.total)
    .map((entry, i, arr) => ({
      ...entry,
      rank: i === 0 ? 1 : (entry.total === arr[i - 1].total ? arr[i - 1].rank : i + 1),
    }));

  const tournamentStarted = apiData?.players?.length > 0;
  const tournamentStatus = apiData?.tournamentStatus;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="text-white py-6 px-4 text-center shadow-lg" style={{ backgroundColor: AUGUSTA_GREEN }}>
        <h1 className="text-3xl font-bold tracking-tight">⛳ Masters 2026 Konkurranse</h1>
        <p className="mt-1 text-green-200 text-sm">Lavest totalt antall slag vinner · 4 spillere + reserve</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Status-bar */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            {!tournamentStarted && !loading && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                🗓 Turneringen starter torsdag 9. april 2026
              </span>
            )}
            {tournamentStarted && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                🟢 {apiData?.eventName || 'Masters 2026'} · Live
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            {lastUpdated && (
              <span>Oppdatert: {lastUpdated.toLocaleTimeString('nb-NO')}</span>
            )}
            <button
              onClick={fetchScores}
              disabled={loading}
              className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 text-sm"
            >
              {loading ? '...' : '↻ Oppdater'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        {participants.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">Ingen deltakere lagt inn ennå.</p>
            <p className="text-sm mt-2">Legg til picks i <code className="bg-gray-100 px-1 rounded">data/participants.js</code></p>
          </div>
        )}

        {/* Stillingsliste - Desktop */}
        {standings.length > 0 && (
          <>
            <div className="hidden md:block overflow-x-auto rounded-lg shadow">
              <table className="min-w-full bg-white">
                <thead>
                  <tr style={{ backgroundColor: AUGUSTA_GREEN }} className="text-white text-sm">
                    <th className="px-4 py-3 text-left w-12">Plass</th>
                    <th className="px-4 py-3 text-left">Deltaker</th>
                    <th className="px-3 py-3 text-left">Spiller 1</th>
                    <th className="px-3 py-3 text-left">Spiller 2</th>
                    <th className="px-3 py-3 text-left">Spiller 3</th>
                    <th className="px-3 py-3 text-left">Spiller 4</th>
                    <th className="px-4 py-3 text-right">Totalt</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((entry, i) => (
                    <tr
                      key={entry.name}
                      className={`border-b ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-green-50 transition-colors`}
                    >
                      <td className="px-4 py-3 text-center">
                        <RankBadge rank={entry.rank} />
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{entry.name}</td>
                      {entry.playerDetails.map((player, j) => (
                        <ScoreCell key={j} player={player} />
                      ))}
                      <td className="px-4 py-3 text-right">
                        <span className={`text-lg font-bold ${entry.rank === 1 ? 'text-yellow-600' : 'text-gray-800'}`}>
                          {entry.total > 0 ? entry.total : '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Stillingsliste - Mobil (kort-visning) */}
            <div className="md:hidden space-y-3">
              {standings.map((entry) => (
                <div key={entry.name} className="bg-white rounded-lg shadow p-4 border-l-4" style={{ borderColor: entry.rank === 1 ? '#d97706' : AUGUSTA_GREEN }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <RankBadge rank={entry.rank} />
                      <span className="font-bold text-gray-900 text-lg">{entry.name}</span>
                    </div>
                    <span className="text-xl font-bold text-gray-800">
                      {entry.total > 0 ? `${entry.total} slag` : '-'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {entry.playerDetails.map((player, j) => (
                      <div key={j} className={`text-sm p-2 rounded ${player?.status === 'MC' ? 'bg-red-50' : player?.isReserve ? 'bg-purple-50' : 'bg-gray-50'}`}>
                        <div className="font-medium truncate">{player?.isReserve ? `↩ ${player.name}` : player?.name}</div>
                        <div className="text-gray-500 text-xs">
                          {player?.status === 'MC' ? `MC · ${player.total} slag` : player?.total ? `${player.total} slag` : '-'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Forklaring */}
        <div className="mt-6 text-xs text-gray-400 flex flex-wrap gap-4">
          <span>🔴 MC = Misset cut (automatisk 79+79 for R3+R4)</span>
          <span>🟣 (R) = Reserve brukt (spiller trukket seg)</span>
        </div>
      </div>
    </div>
  );
}
