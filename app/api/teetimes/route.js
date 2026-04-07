// Henter tee-tider for alle spillere i Masters 2026
// Caches i 1 time siden tee-tider ikke endrer seg

const EVENT_ID = '401811941';

export async function GET() {
  try {
    // Hent alle deltakere fra ESPN
    const scoreboardRes = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard',
      { next: { revalidate: 3600 } }
    );
    const scoreboardData = await scoreboardRes.json();

    const mastersEvent = scoreboardData.events?.find(e =>
      e.name?.toLowerCase().includes('master')
    );
    if (!mastersEvent) {
      return Response.json({ teeTimes: {}, error: 'Masters ikke funnet' });
    }

    const competitors = mastersEvent.competitions?.[0]?.competitors || [];

    // Hent tee-tider parallelt for alle spillere
    const results = await Promise.all(
      competitors.map(async (c) => {
        try {
          const res = await fetch(
            `https://sports.core.api.espn.com/v2/sports/golf/leagues/pga/events/${EVENT_ID}/competitions/${EVENT_ID}/competitors/${c.id}/linescores`,
            { next: { revalidate: 3600 } }
          );
          const data = await res.json();
          return {
            name: c.athlete?.displayName,
            id: c.id,
            rounds: (data.items || []).map(r => ({
              round: r.period,
              teeTime: r.teeTime || null,
              groupNumber: r.groupNumber || null,
              startTee: r.startTee || 1,
            })),
          };
        } catch {
          return { name: c.athlete?.displayName, id: c.id, rounds: [] };
        }
      })
    );

    // Bygg opp et objekt med spillernavn som nøkkel
    const teeTimes = {};
    for (const player of results) {
      if (player.name) {
        teeTimes[player.name] = player.rounds;
      }
    }

    return Response.json({ teeTimes, eventId: EVENT_ID });
  } catch (err) {
    return Response.json({ teeTimes: {}, error: err.message }, { status: 500 });
  }
}
