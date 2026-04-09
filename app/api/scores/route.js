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
      const statusName = c.status?.type?.name || '';
      const statusDetail = c.status?.type?.shortDetail || '';

      // Status: MC, WD eller aktiv
      let status = 'active';
      if (statusName.includes('CUT') || statusName === 'STATUS_CUT') status = 'MC';
      if (statusName.includes('WITHDRAWN') || statusName === 'STATUS_WITHDRAWN') status = 'WD';

      // Thru-info: "Thru 14", "F", "1*" osv
      let thru = null;
      if (statusDetail && statusDetail !== '') {
        thru = statusDetail;
      }

      // Runde-scores
      const r1 = linescores[0]?.value ?? null;
      const r2 = linescores[1]?.value ?? null;
      const r3 = linescores[2]?.value ?? null;
      const r4 = linescores[3]?.value ?? null;

      // Score til par (f.eks. "-12", "+3", "E")
      const toPar = c.score?.displayValue ?? 'E';

      return {
        name: c.athlete?.displayName || '',
        id: c.id,
        r1,
        r2,
        r3,
        r4,
        toPar,
        thru,        // "Thru 9", "F", null
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
