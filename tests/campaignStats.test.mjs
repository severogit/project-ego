import assert from 'node:assert/strict'
import test from 'node:test'
import { getCampaignStats } from '../src/utils/campaignStats.ts'

function createPlayer(id, name) {
  return {
    id,
    name,
    position: 'Forward',
    rarity: 'Common',
    attack: 80,
    speed: 80,
    vision: 80,
    dribble: 80,
    defense: 80,
    ego: 80,
    flowRate: 10,
  }
}

function createStats(player, side, overrides = {}) {
  return {
    player,
    side,
    goals: 0,
    assists: 0,
    shots: 0,
    defensiveActions: 0,
    flowActivations: 0,
    rating: 6,
    ...overrides,
  }
}

function createResult(stats, mvp = stats[0]) {
  return { stats, mvp }
}

test('campaign stats aggregate only player-side match data', () => {
  const alpha = createPlayer(1, 'Alpha')
  const beta = createPlayer(2, 'Beta')
  const rival = createPlayer(99, 'Rival')
  const firstMatchStats = [
    createStats(alpha, 'player', {
      goals: 1,
      assists: 2,
      shots: 2,
      defensiveActions: 3,
      flowActivations: 1,
      rating: 8,
    }),
    createStats(beta, 'player', {
      goals: 2,
      shots: 3,
      defensiveActions: 1,
      rating: 7,
    }),
    createStats(rival, 'rival', {
      goals: 8,
      assists: 8,
      defensiveActions: 8,
      flowActivations: 8,
      rating: 10,
    }),
  ]
  const secondMatchStats = [
    createStats(alpha, 'player', {
      assists: 1,
      shots: 1,
      defensiveActions: 2,
      flowActivations: 1,
      rating: 7,
    }),
    createStats(beta, 'player', {
      goals: 1,
      assists: 1,
      shots: 2,
      flowActivations: 2,
      rating: 8,
    }),
  ]

  const campaignStats = getCampaignStats([
    createResult(firstMatchStats, firstMatchStats[0]),
    createResult(secondMatchStats, secondMatchStats[1]),
  ])

  assert.deepEqual(campaignStats.totals, {
    goals: 4,
    assists: 4,
    defensiveActions: 6,
    flowActivations: 4,
  })
  assert.equal(campaignStats.players.length, 2)
  assert.equal(campaignStats.highlights.topScorer?.player.name, 'Beta')
  assert.equal(campaignStats.highlights.topAssistant?.player.name, 'Alpha')
  assert.equal(campaignStats.highlights.defensiveWall?.player.name, 'Alpha')
  assert.equal(campaignStats.highlights.mvp?.player.name, 'Alpha')
})

test('campaign MVP favors overall impact instead of goals alone', () => {
  const striker = createPlayer(1, 'Striker')
  const allRounder = createPlayer(2, 'All Rounder')
  const matchStats = [
    createStats(striker, 'player', {
      goals: 4,
      shots: 5,
      rating: 7,
    }),
    createStats(allRounder, 'player', {
      goals: 1,
      assists: 4,
      shots: 2,
      defensiveActions: 6,
      flowActivations: 2,
      rating: 9,
    }),
  ]

  const campaignStats = getCampaignStats([
    createResult(matchStats, matchStats[1]),
  ])

  assert.equal(campaignStats.highlights.topScorer?.player.name, 'Striker')
  assert.equal(campaignStats.highlights.mvp?.player.name, 'All Rounder')
  assert.equal(campaignStats.highlights.mvp?.mvpAwards, 1)
})

test('campaign stat ties use deterministic player ordering', () => {
  const alpha = createPlayer(10, 'Alpha')
  const bravo = createPlayer(11, 'Bravo')
  const rival = createPlayer(99, 'Rival')
  const matchStats = [
    createStats(bravo, 'player', {
      goals: 1,
      assists: 1,
      defensiveActions: 1,
      rating: 7,
    }),
    createStats(alpha, 'player', {
      goals: 1,
      assists: 1,
      defensiveActions: 1,
      rating: 7,
    }),
  ]

  const campaignStats = getCampaignStats([
    createResult(matchStats, createStats(rival, 'rival')),
  ])

  assert.equal(campaignStats.highlights.topScorer?.player.name, 'Alpha')
})
