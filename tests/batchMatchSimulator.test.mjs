import assert from 'node:assert/strict'
import test from 'node:test'
import { runBatchMatchSimulation } from '../src/utils/batchMatchSimulator.ts'

function seededRandom(initialSeed) {
  let seed = initialSeed

  return () => {
    seed = (1664525 * seed + 1013904223) >>> 0
    return seed / 4294967296
  }
}

test('batch report exposes the final QA report structure', () => {
  const report = runBatchMatchSimulation({
    matchCount: 10,
    simulationMode: 'random',
    log: false,
    save: false,
    random: seededRandom(123456789),
  })

  assert.deepEqual(Object.keys(report), [
    'version',
    'generatedAt',
    'simulationCount',
    'simulationMode',
    'focusedPlayer',
    'summary',
    'players',
    'rankings',
    'traits',
    'synergies',
    'rarity',
    'positionStatistics',
    'homeAwayDistribution',
    'teammateDistribution',
    'opponentDistribution',
    'rarityDistribution',
    'playerDistribution',
    'balanceScore',
    'alerts',
    'historicalComparison',
    'metadata',
  ])
  assert.equal(report.simulationCount, 10)
  assert.equal(report.simulationMode, 'random')
  assert.equal(report.focusedPlayer, null)
  assert.equal(report.summary.totalMatches, 10)
  assert.equal(report.historicalComparison.enabled, false)
  assert.equal(report.historicalComparison.previousVersion, null)
  assert.equal(
    report.historicalComparison.currentVersion,
    report.metadata.balanceVersion,
  )
  assert.ok(report.players.length > 0)
  assert.equal(report.rankings.topGoals.length, report.players.length)
  assert.ok(Array.isArray(report.traits.traitUsage))
  assert.ok(Array.isArray(report.synergies.synergyUsage))
  assert.equal(typeof report.positionStatistics, 'object')
  assert.equal(typeof report.homeAwayDistribution, 'object')
  assert.equal(typeof report.teammateDistribution, 'object')
  assert.equal(typeof report.opponentDistribution, 'object')
  assert.equal(typeof report.rarityDistribution, 'object')
  assert.equal(typeof report.playerDistribution, 'object')
  assert.ok(report.balanceScore >= 0)
  assert.ok(report.balanceScore <= 100)
  assert.ok(Array.isArray(report.alerts))
  assert.equal(report.metadata.simulationMode, 'random')
})

test('batch report aggregates player and result totals consistently', () => {
  const report = runBatchMatchSimulation(12, {
    log: false,
    save: false,
    random: seededRandom(987654321),
  })
  const playerGoals = report.players.reduce(
    (total, player) => total + player.goals,
    0,
  )
  const playerAppearances = report.players.reduce(
    (total, player) => total + player.matches,
    0,
  )
  const rarityAppearances = Object.values(report.rarity).reduce(
    (total, rarity) => total + rarity.matches,
    0,
  )
  const positionGoals = Object.values(report.positionStatistics).reduce(
    (total, position) => total + position.goals,
    0,
  )
  const positionParticipations = Object.values(
    report.positionStatistics,
  ).reduce((total, position) => total + position.participations, 0)

  assert.equal(playerGoals, report.summary.totalGoals)
  assert.equal(
    report.summary.results.homeWins +
      report.summary.results.awayWins +
      report.summary.results.draws,
    report.simulationCount,
  )
  assert.equal(playerAppearances, rarityAppearances)
  assert.equal(positionGoals, report.summary.totalGoals)
  assert.equal(
    positionParticipations,
    report.players.reduce(
      (total, player) => total + player.participations,
      0,
    ),
  )
})

test('balanced report distribution counters match player appearances', () => {
  const report = runBatchMatchSimulation({
    matchCount: 24,
    simulationMode: 'balanced',
    log: false,
    save: false,
    random: seededRandom(20260626),
  })
  const playerByName = new Map(
    report.players.map((player) => [player.name, player]),
  )

  for (const [playerName, sideDistribution] of Object.entries(
    report.homeAwayDistribution,
  )) {
    const player = playerByName.get(playerName)

    assert.ok(player)
    assert.equal(
      sideDistribution.home + sideDistribution.away,
      player.matches,
    )
  }

  for (const [playerName, teammateDistribution] of Object.entries(
    report.teammateDistribution,
  )) {
    const player = playerByName.get(playerName)
    const teammateExposure = Object.values(teammateDistribution).reduce(
      (total, count) => total + count,
      0,
    )

    assert.ok(player)
    assert.equal(teammateExposure, player.matches * 4)
  }

  for (const [playerName, opponentDistribution] of Object.entries(
    report.opponentDistribution,
  )) {
    const player = playerByName.get(playerName)
    const opponentExposure = Object.values(opponentDistribution).reduce(
      (total, count) => total + count,
      0,
    )

    assert.ok(player)
    assert.equal(opponentExposure, player.matches * 5)
  }
})

test('balanced mode keeps player match counts close together', () => {
  const report = runBatchMatchSimulation({
    matchCount: 100,
    simulationMode: 'balanced',
    log: false,
    save: false,
    random: seededRandom(13579),
  })
  const allowedDifference = Math.max(
    3,
    Math.ceil(report.playerDistribution.averageMatchesPerPlayer * 0.05),
  )

  assert.equal(report.simulationMode, 'balanced')
  assert.ok(report.playerDistribution.difference <= allowedDifference)
})

test('focused mode includes the selected player in every match', () => {
  const report = runBatchMatchSimulation({
    matchCount: 20,
    simulationMode: 'focused',
    focusedPlayerName: 'Oliver Aiku',
    log: false,
    save: false,
    random: seededRandom(24680),
  })
  const focusedPlayer = report.players.find(
    (player) => player.name === 'Oliver Aiku',
  )

  assert.deepEqual(report.focusedPlayer, {
    id: focusedPlayer?.id,
    name: 'Oliver Aiku',
  })
  assert.equal(report.simulationMode, 'focused')
  assert.equal(focusedPlayer?.matches, report.simulationCount)
  assert.equal(
    report.playerDistribution.matchesPerPlayer['Oliver Aiku'],
    report.simulationCount,
  )
})
