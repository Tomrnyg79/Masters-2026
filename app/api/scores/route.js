export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard',
      { cache: 'no-store' }
    );

    if (!res.ok) {
      return Response.json({ players: [], error: 'Kunne ikke hente data fra ESPN' });
    }

    const data = await res.json();

    const mastersEvent = data.events?.find(e =>
      e.name?.toLowerCase().includes('master')
    );

    if (!mastersEvent) {
      return Response.json({
        players: [],
        eventName: null,
        tournamentStatus: 'not_started',
      });
    }

    const competitors = mastersEvent.competitions?.[0]?.competitors || [];
    const currentRound = mastersEvent.competitions?.[0]?.status?.period || 0;
    const tournamentState = mastersEvent.status?.type?.state || 'pre';

    const players = competitors.map(c => {
      const linescores = c.linescores || [];

      // Status: MC, WD eller aktiv
      let status = 'active';
      const statusStr = JSON.stringify(c.status || '').toLowerCase();
      if (statusStr.includes('cut')) status = 'MC';
      if (statusStr.includes('withdrawn') || statusStr.includes('wd')) status = 'WD';

      // toPar: ESPN returnerer et tall (f.eks. -3, 0, 2) eller null
      const toParNum = c.score;
      let toPar = 'E';
      if (toParNum !== null && toParNum !== undefined && toParNum !== 'E') {
        const n = parseInt(toParNum);
        if (!isNaN(n)) toPar = n === 0 ? 'E' : n > 0 ? `+${n}` : String(n);
      }

      // Thru: antall hull spilt i inneværende runde
      const currentRoundLS = linescores.find(ls => ls.period === currentRound);
      const holesPlayed = currentRoundLS?.linescores?.length ?? 0;
      const thru = holesPlayed === 18 ? 'F' : holesPlayed > 0 ? String(holesPlayed) : null;

      // Runde-scores: value er slag i den runden (komplett = faktisk slag, f.eks. 69)
      const getRoundScore = (round) => {
        const ls = linescores.find(l => l.period === round);
        if (!ls) return null;
        const holes = ls.linescores?.length ?? 0;
        return holes === 18 ? ls.value : null; // Kun vis hvis runden er ferdig
      };

      return {
        name: c.athlete?.displayName || '',
        id: c.id,
        r1: getRoundScore(1),
        r2: getRoundScore(2),
        r3: getRoundScore(3),
        r4: getRoundScore(4),
        toPar,
        thru,
        status,
        currentRound,
      };
    });

    return new Response(JSON.stringify({
      players,
      eventName: mastersEvent.name,
      currentRound,
      tournamentState,
      tournamentStatus: mastersEvent.status?.type?.name || 'unknown',
    }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });
  } catch (err) {
    return Response.json({ players: [], error: err.message }, { status: 500 });
  }
}
