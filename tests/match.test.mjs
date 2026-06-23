import assert from 'node:assert/strict'
import test from 'node:test'
import {
  MATCH_CONFIG,
  calculateTeamMatchStrength,
  simulateMatch,
} from '../src/utils/match.ts'

function createPlayer(id, attributeValue, ego = attributeValue) {
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
  }
}

function sequenceRandom(values) {
  let index = 0
  return () => values[index++] ?? values.at(-1) ?? 0.5
}

function seededRandom(initialSeed) {
  let seed = initialSeed

  return () => {
    seed = (1664525 * seed + 1013904223) >>> 0
    return seed / 4294967296
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

test('the stronger team keeps the advantage with neutral randomness', () => {
  const strongerTeam = [createPlayer(1, 100, 90)]
  const weakerTeam = [createPlayer(2, 80, 90)]
  const random = sequenceRandom([0.5, 0.5, 0.99, 0.5])
  const result = simulateMatch(strongerTeam, weakerTeam, random)

  assert.equal(result.winner, 'player')
  assert.equal(result.upsetOccurred, false)
  assert.ok(
    result.playerStrength.finalStrength >
      result.rivalStrength.finalStrength,
  )
})

test('an underdog can win when the upset chance activates', () => {
  const weakerTeam = [createPlayer(1, 80, 90)]
  const strongerTeam = [createPlayer(2, 95, 90)]
  const random = sequenceRandom([0.5, 0.5, 0, 1, 0.5])
  const result = simulateMatch(weakerTeam, strongerTeam, random)

  assert.equal(result.upsetOccurred, true)
  assert.equal(result.winner, 'player')
  assert.ok(result.playerStrength.upsetBonus > 0)
})

test('the favorite wins most matches without reaching a 100% win rate', () => {
  const strongerTeam = [
    createPlayer(1, 90),
    createPlayer(2, 90),
    createPlayer(3, 90),
  ]
  const weakerTeam = [
    createPlayer(4, 80),
    createPlayer(5, 80),
    createPlayer(6, 80),
  ]
  const random = seededRandom(123456789)
  const simulations = 20_000
  let strongerWins = 0

  for (let simulation = 0; simulation < simulations; simulation += 1) {
    const result = simulateMatch(strongerTeam, weakerTeam, random)

    if (result.winner === 'player') {
      strongerWins += 1
    }
  }

  const strongerWinRate = strongerWins / simulations

  assert.ok(strongerWinRate > 0.7)
  assert.ok(strongerWinRate < 0.95)
})
