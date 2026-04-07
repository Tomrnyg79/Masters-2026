const PAR_PER_ROUND = 72;
const TOTAL_ROUNDS = 4;
const PAR_TOTAL = PAR_PER_ROUND * TOTAL_ROUNDS; // 288 per spiller

export function normalizePlayerName(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\s]/g, '')
    .trim();
}

export function findPlayer(searchName, players) {
  const normalized = normalizePlayerName(searchName);
  const lastName = normalized.split(' ').pop();
  let found = players.find(p => normalizePlayerName(p.name) === normalized);
  if (found) return found;
  found = players.find(p => normalizePlayerName(p.name).includes(lastName));
  return found || null;
}

// Konverter toPar-streng til tall: "E" → 0, "-5" → -5, "+3" → 3
function parseToParNum(toPar) {
  if (!toPar || toPar === 'E' || toPar === 'Even') return 0;
  const n = parseInt(toPar);
  return isNaN(n) ? 0 : n;
}

// Formater til visning: 0 → "E", -5 → "-5", 3 → "+3"
export function formatToPar(n) {
  if (n === 0) return 'E';
  if (n < 0) return `${n}`;
  return `+${n}`;
}

// Beregn effektive slag for én spiller:
// - Ikke startet / aktiv: 288 + toPar (uspilte runder teller som 72 slag)
// - MC: 288 + toPar + 14 (79+79 for R3+R4, dvs. +7 per runde over par)
// - WD: null (bruk reserve)
export function calculatePlayerScore(playerData) {
  if (!playerData) {
    return { total: PAR_TOTAL, toParNum: 0, status: 'not_started' };
  }

  const { toPar, status, r1, r2, r3, r4, thru } = playerData;

  if (status === 'WD') {
    return { total: null, toParNum: null, status: 'WD' };
  }

  const toParNum = parseToParNum(toPar);

  if (status === 'MC') {
    // Faktisk toPar etter R2 + 7+7 for to runder med 79 slag (79-72=7)
    const mcToParNum = toParNum + 14;
    return {
      total: PAR_TOTAL + mcToParNum,
      toParNum: mcToParNum,
      status: 'MC',
      r1, r2, r3: 79, r4: 79,
      thru: 'MC',
    };
  }

  // Aktiv spiller eller ikke startet ennå
  // toPar fra ESPN oppdateres hull for hull, uspilte runder = 0 (par)
  return {
    total: PAR_TOTAL + toParNum,
    toParNum,
    status: status || (toParNum === 0 && !r1 ? 'not_started' : 'active'),
    r1, r2, r3, r4,
    thru,
  };
}

// Beregn total for en deltaker (sum av 4 spilleres effektive slag)
export function calculateParticipantScore(participant, apiPlayers) {
  const playerDetails = [];
  let grandTotal = 0;

  for (const pickName of participant.picks) {
    const apiPlayer = findPlayer(pickName, apiPlayers);
    const scoreData = calculatePlayerScore(apiPlayer);

    if (scoreData.status === 'WD') {
      const reservePlayer = findPlayer(participant.reserve, apiPlayers);
      const reserveScore = calculatePlayerScore(reservePlayer);
      playerDetails.push({
        name: participant.reserve,
        originalName: pickName,
        isReserve: true,
        ...reserveScore,
      });
      grandTotal += reserveScore.total ?? PAR_TOTAL;
    } else {
      playerDetails.push({ name: pickName, ...scoreData });
      grandTotal += scoreData.total ?? PAR_TOTAL;
    }
  }

  return {
    name: participant.name,
    total: grandTotal,
    playerDetails,
  };
}
