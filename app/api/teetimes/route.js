export const maxDuration = 30;

const EVENT_ID = '401811941';

function normalizeName(name) {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z\s]/g, '').trim();
}

async function fetchWithTimeout(url, ms = 4000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal, next: { revalidate: 3600 } });
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    // Valgfri liste med spillernavn vi faktisk trenger tee-tider for
    const requestedNames = searchParams.get('players')
      ? searchParams.get('players').split(',').map(n => n.trim()).filter(Boolean)
      : null;

    // Hent alle konkurrenter fra scoreboard
    const scoreboardData = await fetchWithTimeout(
      'https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard'
    );

    const mastersEvent = scoreboardData?.events?.find(e =>
      e.name?.toLowerCase().includes('master')
    );
    if (!mastersEvent) return Response.json({ teeTimes: {} });

    const competitors = mastersEvent.competitions?.[0]?.competitors || [];

    // Filtrer til bare relevante spillere hvis angitt
    const filtered = requestedNames
      ? competitors.filter(c => {
          const espnNorm = normalizeName(c.athlete?.displayName || '');
          return requestedNames.some(req => {
            const reqNorm = normalizeName(req);
            const reqLast = reqNorm.split(' ').pop();
            return espnNorm === reqNorm || espnNorm.includes(reqLast);
          });
        })
      : competitors;

    // Hent tee-tider i batches av 15
    const BATCH = 15;
    const teeTimes = {};

    for (let i = 0; i < filtered.length; i += BATCH) {
      const batch = filtered.slice(i, i + BATCH);
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
      for (const p of results) {
        if (p.name) teeTimes[p.name] = p.rounds;
      }
    }

    return Response.json({ teeTimes });
  } catch (err) {
    return Response.json({ teeTimes: {}, error: err.message }, { status: 500 });
  }
}
