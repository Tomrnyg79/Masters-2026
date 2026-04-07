export const maxDuration = 30; // Vercel: tillat 30 sek

const EVENT_ID = '401811941';

async function fetchWithTimeout(url, timeoutMs = 4000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 3600 },
    });
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function GET() {
  try {
    // Hent alle deltakere
    const scoreboardData = await fetchWithTimeout(
      'https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard'
    );

    const mastersEvent = scoreboardData?.events?.find(e =>
      e.name?.toLowerCase().includes('master')
    );
    if (!mastersEvent) {
      return Response.json({ teeTimes: {} });
    }

    const competitors = mastersEvent.competitions?.[0]?.competitors || [];

    // Hent tee-tider i batches (20 om gangen) for å unngå timeout
    const BATCH_SIZE = 20;
    const teeTimes = {};

    for (let i = 0; i < competitors.length; i += BATCH_SIZE) {
      const batch = competitors.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(async (c) => {
          const data = await fetchWithTimeout(
            `https://sports.core.api.espn.com/v2/sports/golf/leagues/pga/events/${EVENT_ID}/competitions/${EVENT_ID}/competitors/${c.id}/linescores`
          );
          return {
            name: c.athlete?.displayName,
            rounds: (data?.items || []).map(r => ({
              round: r.period,
              teeTime: r.teeTime || null,
              groupNumber: r.groupNumber || null,
              startTee: r.startTee || 1,
            })),
          };
        })
      );

      for (const player of results) {
        if (player.name) teeTimes[player.name] = player.rounds;
      }
    }

    return Response.json({ teeTimes });
  } catch (err) {
    return Response.json({ teeTimes: {}, error: err.message }, { status: 500 });
  }
}
