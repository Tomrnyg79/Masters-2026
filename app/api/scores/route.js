// Server-side API route - henter Masters-resultater fra ESPN
// Kjøres server-side så CORS ikke er et problem

export async function GET() {
  try {
    const res = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard',
      { next: { revalidate: 120 } } // cache 2 minutter
    );

    if (!res.ok) {
      return Response.json({ players: [], error: 'Kunne ikke hente data fra ESPN' });
    }

    const data = await res.json();

    // Finn Masters-turneringen
    const mastersEvent = data.events?.find(e =>
      e.name?.toLowerCase().includes('master')
    );

    if (!mastersEvent) {
      return Response.json({
        players: [],
        eventName: null,
        tournamentStatus: 'not_started',
        availableEvents: data.events?.map(e => e.name) || [],
      });
    }

    const competitors = mastersEvent.competitions?.[0]?.competitors || [];
    const roundsCompleted = mastersEvent.competitions?.[0]?.status?.period || 0;

    const players = competitors.map(c => {
      const linescores = c.linescores || [];
      const statusName = c.status?.type?.name || '';

      let status = 'active';
      if (statusName.includes('CUT') || statusName === 'STATUS_CUT') status = 'MC';
      if (statusName.includes('WITHDRAWN') || statusName === 'STATUS_WITHDRAWN') status = 'WD';

      return {
        name: c.athlete?.displayName || '',
        r1: linescores[0]?.value || null,
        r2: linescores[1]?.value || null,
        r3: linescores[2]?.value || null,
        r4: linescores[3]?.value || null,
        toPar: c.score?.displayValue || 'E',
        status,
      };
    });

    return Response.json({
      players,
      eventName: mastersEvent.name,
      roundsCompleted,
      tournamentStatus: mastersEvent.status?.type?.name || 'unknown',
    });
  } catch (err) {
    return Response.json({ players: [], error: err.message }, { status: 500 });
  }
}
