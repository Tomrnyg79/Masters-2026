// Normaliserer spillernavn for sammenligning (fjerner aksenter, lowercase)
export function normalizePlayerName(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\s]/g, '')
    .trim();
}

// Finn spiller i API-data basert på navn (fuzzy match)
export function findPlayer(searchName, players) {
  const normalized = normalizePlayerName(searchName);
  const parts = normalized.split(' ');
  const lastName = parts[parts.length - 1];

  // Eksakt match
  let found = players.find(p => normalizePlayerName(p.name) === normalized);
  if (found) return found;

  // Etternavn-match
  found = players.find(p => normalizePlayerName(p.name).includes(lastName));
  return found || null;
}

// Beregn score for én spiller
// Regler: MC = faktisk R1+R2 + 79+79, WD = null (bruk reserve), active = sum av runder
export function calculatePlayerScore(playerData) {
  if (!playerData) return { total: null, status: 'not_found' };

  const { r1, r2, r3, r4, status } = playerData;

  if (status === 'WD') {
    return { total: null, status: 'WD' };
  }

  if (status === 'MC') {
    // Misset cut: faktiske R1+R2, pluss 79 for R3 og R4
    const actual = (r1 || 0) + (r2 || 0);
    return { total: actual + 79 + 79, status: 'MC', r1, r2, r3: 79, r4: 79 };
  }

  // Aktiv spiller - summer fullførte runder
  const total = (r1 || 0) + (r2 || 0) + (r3 || 0) + (r4 || 0);
  return { total, status: 'active', r1, r2, r3, r4 };
}

// Beregn total score for en deltaker
export function calculateParticipantScore(participant, apiPlayers) {
  const playerDetails = [];
  let grandTotal = 0;
  let allScoresKnown = true;

  for (const pickName of participant.picks) {
    const apiPlayer = findPlayer(pickName, apiPlayers);
    const scoreData = calculatePlayerScore(apiPlayer);

    if (scoreData.status === 'WD') {
      // Bruk reserve
      const reservePlayer = findPlayer(participant.reserve, apiPlayers);
      const reserveScore = calculatePlayerScore(reservePlayer);
      playerDetails.push({
        name: participant.reserve,
        originalName: pickName,
        isReserve: true,
        ...reserveScore,
      });
      if (reserveScore.total !== null) {
        grandTotal += reserveScore.total;
      } else {
        allScoresKnown = false;
      }
    } else {
      playerDetails.push({ name: pickName, ...scoreData });
      if (scoreData.total !== null) {
        grandTotal += scoreData.total;
      } else {
        allScoresKnown = false;
        grandTotal += 0;
      }
    }
  }

  return {
    name: participant.name,
    total: allScoresKnown ? grandTotal : grandTotal,
    playerDetails,
  };
}
