import assert from 'node:assert/strict'
import test from 'node:test'
import {
  MATCH_CONFIG,
  advanceLiveMatch,
  calculateTeamMatchStrength,
  createMatchResult,
  forceFlowActivation,
  forceMatchWinner,
  getNextEventDelay,
  initializeLiveMatch,
  selectMatchMvp,
  simulateMatch,
} from '../src/utils/match.ts'

function createPlayer(
  id,
  attributeValue,
  ego = attributeValue,
  traitName,
  archetypes = [],
) {
  return {
    id,
    name: `Player ${id}`,
    position: 'Forward',
    rarity: 'Common',
    attack: attributeValue,
    speed: attributeValue,
    vision: attributeValue,
    dribble: attributeValue,
    defense: attributeValue,
    ego,
    flowRate: 10,
    ...(traitName
      ? {
          trait: {
            name: traitName,
            description: `${traitName} test trait`,
          },
        }
      : {}),
    ...(archetypes.length > 0 ? { archetypes } : {}),
  }
}

function createNamedTraitPlayer(id, name, traitName, attributeValue = 80) {
  return {
    ...createPlayer(id, attributeValue, attributeValue, traitName),
    name,
  }
}

function sequenceRandom(values) {
  let index = 0
  return () => values[index++] ?? values.at(-1) ?? 0
}

function seededRandom(initialSeed) {
  let seed = initialSeed

  return () => {
    seed = (1664525 * seed + 1013904223) >>> 0
    return seed / 4294967296
  }
}

function createStats({
  id,
  side,
  rating,
  goals = 0,
  assists = 0,
  defensiveActions = 0,
  flowActivations = 0,
}) {
  return {
    player: createPlayer(id, 80),
    side,
    goals,
    assists,
    shots: goals,
    defensiveActions,
    flowActivations,
    rating,
  }
}

function createTimelineEvent(id) {
  return {
    id,
    type: 'shot',
    side: 'player',
    playerId: 1,
    playerName: 'Player 1',
    description: 'Previous event',
    scoreAfter: { player: 0, rival: 0 },
  }
}

function createFlowReadyState() {
  const playerTeam = [
    { ...createPlayer(1, 90), flowRate: 100 },
    createPlayer(2, 85),
  ]
  const rivalTeam = [createPlayer(3, 80), createPlayer(4, 75)]
  const state = initializeLiveMatch(playerTeam, rivalTeam, () => 0.99)

  return {
    ...state,
    score: { player: 2, rival: 4 },
    events: [1, 2, 3, 4].map(createTimelineEvent),
    stats: state.stats.map((playerStats) =>
      playerStats.side === 'player' && playerStats.player.id === 1
        ? { ...playerStats, goals: 2, shots: 2, rating: 8.94 }
        : playerStats,
    ),
  }
}

test('team strength respects the configured random-factor limits', () => {
  const team = [createPlayer(1, 80)]
  const minimum = calculateTeamMatchStrength(team, () => 0)
  const maximum = calculateTeamMatchStrength(team, () => 1)

  assert.equal(minimum.randomFactor, MATCH_CONFIG.randomFactor.min)
  assert.equal(maximum.randomFactor, MATCH_CONFIG.randomFactor.max)
  assert.ok(minimum.clutchBonus > 0)
  assert.ok(maximum.finalStrength > minimum.finalStrength)
})

test('event delays respect the selected simulation speed', () => {
  assert.equal(getNextEventDelay(1), 1000)
  assert.equal(getNextEventDelay(2), 500)
  assert.equal(getNextEventDelay(4), 250)
})

test('dev helper can force the match winner without advancing events', () => {
  const playerTeam = [createPlayer(1, 80), createPlayer(2, 80)]
  const rivalTeam = [createPlayer(3, 80), createPlayer(4, 80)]
  const state = initializeLiveMatch(playerTeam, rivalTeam, () => 0.99)
  const forcedState = forceMatchWinner(state, 'player')

  assert.equal(forcedState.isFinished, true)
  assert.equal(forcedState.winner, 'player')
  assert.equal(forcedState.score.player, MATCH_CONFIG.targetGoals)
  assert.equal(forcedState.score.rival, 0)
  assert.equal(forcedState.events.length, 0)
})

test('dev helper can force FLOW when a player is eligible', () => {
  const state = createFlowReadyState()
  const forcedState = forceFlowActivation(state)

  assert.equal(forcedState.activeFlows.length, 1)
  assert.equal(forcedState.events.at(-1)?.type, 'flow-activated')
  assert.equal(forcedState.flowActivations, state.flowActivations + 1)
})

test('dev simulation metrics are initialized for every player', () => {
  const playerTeam = [createPlayer(1, 80), createPlayer(2, 80)]
  const rivalTeam = [createPlayer(3, 80), createPlayer(4, 80)]
  const state = initializeLiveMatch(playerTeam, rivalTeam, () => 0.99)

  assert.equal(state.stats.every((playerStats) => playerStats.dev), true)

  for (const playerStats of state.stats) {
    assert.equal(playerStats.dev.offensiveCandidateCount, 0)
    assert.equal(playerStats.dev.finisherSelectedCount, 0)
    assert.equal(playerStats.dev.assistantCandidateCount, 0)
    assert.equal(playerStats.dev.assistantSelectedCount, 0)
    assert.equal(playerStats.dev.defensiveCandidateCount, 0)
    assert.equal(playerStats.dev.defensiveSelectedCount, 0)
    assert.equal(playerStats.dev.totalFinisherWeight, 0)
    assert.equal(playerStats.dev.totalAssistantWeight, 0)
    assert.equal(playerStats.dev.totalDefensiveWeight, 0)
  }
})

test('dev simulation metrics count selected finishers', () => {
  const playerTeam = [createPlayer(1, 80), createPlayer(2, 80)]
  const rivalTeam = [createPlayer(3, 80), createPlayer(4, 80)]
  let state = initializeLiveMatch(playerTeam, rivalTeam, () => 0.99)

  state = advanceLiveMatch(
    state,
    sequenceRandom([0, 0, 0, 0.99, 0.99]),
  )

  const selectedFinisher = state.stats.find(
    (playerStats) =>
      playerStats.side === 'player' && playerStats.player.id === 1,
  )
  const otherCandidate = state.stats.find(
    (playerStats) =>
      playerStats.side === 'player' && playerStats.player.id === 2,
  )

  assert.equal(selectedFinisher?.dev.finisherSelectedCount, 1)
  assert.equal(selectedFinisher?.dev.offensiveCandidateCount, 1)
  assert.ok(selectedFinisher?.dev.totalFinisherWeight > 0)
  assert.equal(otherCandidate?.dev.finisherSelectedCount, 0)
  assert.equal(otherCandidate?.dev.offensiveCandidateCount, 1)
})

test('dev simulation metrics count selected assistants', () => {
  const playerTeam = [createPlayer(1, 80), createPlayer(2, 80)]
  const rivalTeam = [createPlayer(3, 80), createPlayer(4, 80)]
  let state = initializeLiveMatch(playerTeam, rivalTeam, () => 0.99)

  state = advanceLiveMatch(
    state,
    sequenceRandom([0, 0, 0, 0, 0.99]),
  )

  const finisher = state.stats.find(
    (playerStats) =>
      playerStats.side === 'player' && playerStats.player.id === 1,
  )
  const selectedAssistant = state.stats.find(
    (playerStats) =>
      playerStats.side === 'player' && playerStats.player.id === 2,
  )

  assert.equal(finisher?.dev.assistantCandidateCount, 0)
  assert.equal(selectedAssistant?.dev.assistantCandidateCount, 1)
  assert.equal(selectedAssistant?.dev.assistantSelectedCount, 1)
  assert.ok(selectedAssistant?.dev.totalAssistantWeight > 0)
})

test('dev simulation metrics count selected defenders', () => {
  const playerTeam = [createPlayer(1, 80), createPlayer(2, 80)]
  const rivalTeam = [createPlayer(3, 80), createPlayer(4, 80)]
  let state = initializeLiveMatch(playerTeam, rivalTeam, () => 0.99)

  state = advanceLiveMatch(state, sequenceRandom([0, 0.99, 0]))

  const selectedDefender = state.stats.find(
    (playerStats) =>
      playerStats.side === 'rival' && playerStats.player.id === 3,
  )
  const otherCandidate = state.stats.find(
    (playerStats) =>
      playerStats.side === 'rival' && playerStats.player.id === 4,
  )

  assert.equal(selectedDefender?.dev.defensiveSelectedCount, 1)
  assert.equal(selectedDefender?.dev.defensiveCandidateCount, 1)
  assert.ok(selectedDefender?.dev.totalDefensiveWeight > 0)
  assert.equal(otherCandidate?.dev.defensiveSelectedCount, 0)
  assert.equal(otherCandidate?.dev.defensiveCandidateCount, 1)
})

test('Demon Striker can select Shidou and convert a borderline finish', () => {
  const shidou = createNamedTraitPlayer(
    1,
    'Shidou Ryusei',
    'Demon Striker',
  )
  const teammate = createPlayer(2, 80)
  const rivalTeam = [createPlayer(3, 80), createPlayer(4, 80)]
  let state = initializeLiveMatch([shidou, teammate], rivalTeam, () => 0.99)

  state = advanceLiveMatch(
    state,
    sequenceRandom([0, 0.5, 0.55, 0.99, 0.55]),
  )

  assert.equal(state.events.at(-1)?.type, 'goal')
  assert.equal(state.events.at(-1)?.playerId, shidou.id)
})

test('Demon Striker impact appears only when it changes goal conversion', () => {
  const shidou = createNamedTraitPlayer(
    1,
    'Shidou Ryusei',
    'Demon Striker',
  )
  const teammate = createPlayer(2, 80)
  const rivalTeam = [createPlayer(3, 80), createPlayer(4, 80)]
  let state = initializeLiveMatch([shidou, teammate], rivalTeam, () => 0.99)

  state = advanceLiveMatch(
    state,
    sequenceRandom([0, 0.5, 0.55, 0.99, 0.55]),
  )

  assert.equal(
    state.events.at(-1)?.traitImpactDescription,
    'Shidou Ryusei finaliza gracas ao Demon Striker.',
  )

  state = initializeLiveMatch([shidou, teammate], rivalTeam, () => 0.99)
  state = advanceLiveMatch(
    state,
    sequenceRandom([0, 0.5, 0.55, 0.99, 0.4]),
  )

  assert.equal(state.events.at(-1)?.type, 'goal')
  assert.equal(state.events.at(-1)?.traitImpactDescription, undefined)
})

test('Kaiser Impact can convert a borderline finish', () => {
  const kaiser = createNamedTraitPlayer(
    1,
    'Michael Kaiser',
    'Kaiser Impact',
  )
  const rivalTeam = [createPlayer(2, 80), createPlayer(3, 80)]
  let state = initializeLiveMatch([kaiser, createPlayer(4, 80)], rivalTeam, () => 0.99)

  state = advanceLiveMatch(
    state,
    sequenceRandom([0, 0.5, 0, 0.99, 0.62]),
  )

  assert.equal(state.events.at(-1)?.type, 'goal')
  assert.equal(state.events.at(-1)?.playerId, kaiser.id)
})

test('Perfect Pass boosts assisted goal conversion', () => {
  const finisher = createPlayer(1, 80)
  const hiori = createNamedTraitPlayer(2, 'Hiori Yo', 'Perfect Pass')
  const rivalTeam = [createPlayer(3, 80), createPlayer(4, 80)]
  let state = initializeLiveMatch([finisher, hiori], rivalTeam, () => 0.99)

  state = advanceLiveMatch(
    state,
    sequenceRandom([0, 0.5, 0, 0, 0, 0.51]),
  )

  assert.equal(state.events.at(-1)?.type, 'goal')
  assert.equal(state.events.at(-1)?.assistPlayerId, hiori.id)
})

test('World Class Passer gives a stronger assisted conversion boost', () => {
  const finisher = createPlayer(1, 80)
  const sae = createNamedTraitPlayer(2, 'Itoshi Sae', 'World Class Passer')
  const rivalTeam = [createPlayer(3, 80), createPlayer(4, 80)]
  let state = initializeLiveMatch([finisher, sae], rivalTeam, () => 0.99)

  state = advanceLiveMatch(
    state,
    sequenceRandom([0, 0.5, 0, 0, 0, 0.54]),
  )

  assert.equal(state.events.at(-1)?.type, 'goal')
  assert.equal(state.events.at(-1)?.assistPlayerId, sae.id)
})

test('Last Wall can select Aiku for a defensive action', () => {
  const aiku = createNamedTraitPlayer(1, 'Oliver Aiku', 'Last Wall')
  const teammate = createPlayer(2, 80)
  const rivalTeam = [createPlayer(3, 80), createPlayer(4, 80)]
  let state = initializeLiveMatch([aiku, teammate], rivalTeam, () => 0.99)

  state = advanceLiveMatch(
    state,
    sequenceRandom([0.99, 0.99, 0.55]),
  )

  assert.equal(state.events.at(-1)?.type, 'defense')
  assert.equal(state.events.at(-1)?.playerId, aiku.id)
})

test('Killer Pass boosts goal conversion for Playmaker plus Finisher', () => {
  const finisher = createPlayer(1, 80, 80, undefined, ['Finisher'])
  const playmaker = createPlayer(2, 80, 80, undefined, ['Playmaker'])
  const rivalTeam = [createPlayer(3, 80), createPlayer(4, 80)]
  let state = initializeLiveMatch([finisher, playmaker], rivalTeam, () => 0.99)

  state = advanceLiveMatch(
    state,
    sequenceRandom([0, 0.5, 0, 0.99, 0.52]),
  )

  assert.equal(state.events.at(-1)?.type, 'goal')
  assert.equal(state.events.at(-1)?.playerId, finisher.id)
})

test('Killer Pass impact appears only when it changes goal conversion', () => {
  const finisher = createPlayer(1, 80, 80, undefined, ['Finisher'])
  const playmaker = createPlayer(2, 80, 80, undefined, ['Playmaker'])
  const rivalTeam = [createPlayer(3, 80), createPlayer(4, 80)]
  let state = initializeLiveMatch([finisher, playmaker], rivalTeam, () => 0.99)

  state = advanceLiveMatch(
    state,
    sequenceRandom([0, 0.5, 0, 0.99, 0.52]),
  )

  assert.equal(
    state.events.at(-1)?.synergyImpactDescription,
    'Killer Pass ativou uma jogada decisiva.',
  )

  state = initializeLiveMatch([finisher, playmaker], rivalTeam, () => 0.99)
  state = advanceLiveMatch(
    state,
    sequenceRandom([0, 0.5, 0, 0.99, 0.4]),
  )

  assert.equal(state.events.at(-1)?.type, 'goal')
  assert.equal(state.events.at(-1)?.synergyImpactDescription, undefined)
})

test('Direct Path boosts Finisher selection from Visionary plus Finisher', () => {
  const finisher = createPlayer(1, 80, 80, undefined, ['Finisher'])
  const visionary = createPlayer(2, 80, 80, undefined, ['Visionary'])
  const rivalTeam = [createPlayer(3, 80), createPlayer(4, 80)]
  let state = initializeLiveMatch([finisher, visionary], rivalTeam, () => 0.99)

  state = advanceLiveMatch(
    state,
    sequenceRandom([0, 0.5, 0.51, 0.99, 0.99]),
  )

  assert.equal(state.events.at(-1)?.type, 'shot')
  assert.equal(state.events.at(-1)?.playerId, finisher.id)
})

test('Defensive Command boosts Defender defensive selection', () => {
  const leaderDefender = createPlayer(
    1,
    80,
    80,
    undefined,
    ['Defender', 'Leader'],
  )
  const teammate = createPlayer(2, 80)
  const rivalTeam = [createPlayer(3, 80), createPlayer(4, 80)]
  let state = initializeLiveMatch(
    [leaderDefender, teammate],
    rivalTeam,
    () => 0.99,
  )

  state = advanceLiveMatch(
    state,
    sequenceRandom([0.99, 0.99, 0.53]),
  )

  assert.equal(state.events.at(-1)?.type, 'defense')
  assert.equal(state.events.at(-1)?.playerId, leaderDefender.id)
})

test('Perfect Duo boosts Nagi and Reo goal conversion', () => {
  const nagi = createPlayer(5, 80, 80, undefined, ['Finisher'])
  const reo = createPlayer(6, 80)
  const rivalTeam = [createPlayer(3, 80), createPlayer(4, 80)]
  let state = initializeLiveMatch([nagi, reo], rivalTeam, () => 0.99)

  state = advanceLiveMatch(
    state,
    sequenceRandom([0, 0.5, 0, 0.99, 0.54]),
  )

  assert.equal(state.events.at(-1)?.type, 'goal')
  assert.equal(state.events.at(-1)?.playerId, nagi.id)
})

test('Chemical Reaction boosts Shidou conversion and Sae assist chance', () => {
  const shidou = createPlayer(9, 80, 80, undefined, ['Finisher'])
  const sae = createPlayer(18, 80, 80, undefined, ['Playmaker'])
  const rivalTeam = [createPlayer(3, 80), createPlayer(4, 80)]
  let state = initializeLiveMatch([shidou, sae], rivalTeam, () => 0.99)

  state = advanceLiveMatch(
    state,
    sequenceRandom([0, 0.5, 0, 0.8, 0, 0.56]),
  )

  assert.equal(state.events.at(-1)?.type, 'goal')
  assert.equal(state.events.at(-1)?.playerId, shidou.id)
  assert.equal(state.events.at(-1)?.assistPlayerId, sae.id)
})

test('match MVP tie-breaker prioritizes the winning team after rating', () => {
  const winnerStats = createStats({
    id: 1,
    side: 'player',
    rating: 8,
    goals: 1,
  })
  const losingStats = createStats({
    id: 2,
    side: 'rival',
    rating: 8,
    goals: 3,
    assists: 2,
    defensiveActions: 2,
  })

  assert.equal(
    selectMatchMvp([losingStats, winnerStats], 'player'),
    winnerStats,
  )
})

test('match MVP tie-breaker uses goals, assists and defenses after winner', () => {
  const firstFound = createStats({ id: 1, side: 'player', rating: 8 })
  const moreGoals = createStats({
    id: 2,
    side: 'player',
    rating: 8,
    goals: 1,
  })
  const moreAssists = createStats({
    id: 3,
    side: 'player',
    rating: 8,
    goals: 1,
    assists: 1,
  })
  const moreDefenses = createStats({
    id: 4,
    side: 'player',
    rating: 8,
    goals: 1,
    assists: 1,
    defensiveActions: 1,
  })
  const fullTie = createStats({
    id: 5,
    side: 'player',
    rating: 8,
    goals: 1,
    assists: 1,
    defensiveActions: 1,
  })

  assert.equal(
    selectMatchMvp([firstFound, moreGoals], 'player'),
    moreGoals,
  )
  assert.equal(
    selectMatchMvp([moreGoals, moreAssists], 'player'),
    moreAssists,
  )
  assert.equal(
    selectMatchMvp([moreAssists, moreDefenses], 'player'),
    moreDefenses,
  )
  assert.equal(
    selectMatchMvp([moreDefenses, fullTie], 'player'),
    moreDefenses,
  )
})

test('match MVP tie-breaker uses FLOW bonus only after stats are tied', () => {
  const noFlow = createStats({
    id: 1,
    side: 'player',
    rating: 8,
    goals: 1,
    assists: 1,
    defensiveActions: 1,
  })
  const withFlow = createStats({
    id: 2,
    side: 'player',
    rating: 8,
    goals: 1,
    assists: 1,
    defensiveActions: 1,
    flowActivations: 1,
  })
  const betterStats = createStats({
    id: 3,
    side: 'player',
    rating: 8,
    goals: 2,
    flowActivations: 1,
  })

  assert.equal(selectMatchMvp([noFlow, withFlow], 'player'), withFlow)
  assert.equal(selectMatchMvp([withFlow, betterStats], 'player'), betterStats)
})

test('FLOW does not activate before the minimum event count', () => {
  const state = {
    ...createFlowReadyState(),
    events: [1, 2, 3].map(createTimelineEvent),
  }
  const nextState = advanceLiveMatch(state, sequenceRandom([0, 0, 0]))

  assert.notEqual(nextState.events.at(-1)?.type, 'flow-activated')
  assert.equal(nextState.flowActivated, false)
  assert.equal(nextState.flowActivations, 0)
})

test('FLOW activates for an eligible player and ends after three attacks', () => {
  let state = advanceLiveMatch(createFlowReadyState(), sequenceRandom([0, 0]))

  assert.equal(state.events.at(-1)?.type, 'flow-activated')
  assert.equal(state.activeFlows.length, 1)
  assert.equal(state.activeFlows[0].playerId, 1)
  assert.equal(state.flowActivated, true)
  assert.equal(state.flowActivations, 1)
  assert.equal(
    state.stats.find((playerStats) => playerStats.player.id === 1)
      ?.flowActivations,
    1,
  )

  state = advanceLiveMatch(state, sequenceRandom([0, 0.5, 0]))
  state = advanceLiveMatch(state, sequenceRandom([0, 0.5, 0]))
  state = advanceLiveMatch(
    state,
    sequenceRandom([0.99, 0, 0.5, 0, 0.99, 0.99]),
  )

  assert.equal(state.activeFlows.length, 0)
  assert.equal(state.events.at(-1)?.type, 'flow-ended')
})

test('the engine generates goals, shots, defenses and player stats', () => {
  const playerTeam = [createPlayer(1, 90), createPlayer(2, 85)]
  const rivalTeam = [createPlayer(3, 80), createPlayer(4, 75)]
  let state = initializeLiveMatch(playerTeam, rivalTeam, () => 0.99)

  state = advanceLiveMatch(
    state,
    sequenceRandom([0, 0, 0, 0, 0]),
  )
  state = advanceLiveMatch(state, sequenceRandom([0, 0.5, 0, 0.99, 0.99]))
  state = advanceLiveMatch(state, sequenceRandom([0, 0.99, 0]))

  assert.deepEqual(
    state.events.map((event) => event.type),
    ['goal', 'shot', 'defense'],
  )
  assert.equal(state.score.player, 1)
  assert.equal(
    state.stats.reduce((total, stats) => total + stats.goals, 0),
    1,
  )
  assert.equal(
    state.stats.reduce((total, stats) => total + stats.assists, 0),
    1,
  )
  assert.equal(
    state.stats.reduce((total, stats) => total + stats.shots, 0),
    2,
  )
  assert.equal(
    state.stats.reduce(
      (total, stats) => total + stats.defensiveActions,
      0,
    ),
    1,
  )
})

test('a match ends only when one side reaches five goals', () => {
  const random = seededRandom(987654321)
  let state = initializeLiveMatch(
    [createPlayer(1, 90), createPlayer(2, 88), createPlayer(3, 86)],
    [createPlayer(4, 84), createPlayer(5, 82), createPlayer(6, 80)],
    random,
  )

  while (!state.isFinished) {
    state = advanceLiveMatch(state, random)
  }

  const result = createMatchResult(state)

  assert.ok(
    result.score.player === MATCH_CONFIG.targetGoals ||
      result.score.rival === MATCH_CONFIG.targetGoals,
  )
  assert.notEqual(result.score.player, result.score.rival)
  assert.ok(result.events.length >= MATCH_CONFIG.targetGoals)
  assert.ok(result.stats.includes(result.mvp))
})

test('the favorite wins most matches without reaching a 100% win rate', () => {
  const strongerTeam = [
    createPlayer(101, 90),
    createPlayer(102, 90),
    createPlayer(103, 90),
  ]
  const weakerTeam = [
    createPlayer(201, 80),
    createPlayer(202, 80),
    createPlayer(203, 80),
  ]
  const random = seededRandom(123456789)
  const simulations = 5_000
  let strongerWins = 0

  for (let simulation = 0; simulation < simulations; simulation += 1) {
    const result = simulateMatch(strongerTeam, weakerTeam, random)

    if (result.winner === 'player') {
      strongerWins += 1
    }
  }

  const strongerWinRate = strongerWins / simulations

  assert.ok(strongerWinRate > 0.6)
  assert.ok(strongerWinRate < 0.9)
})
