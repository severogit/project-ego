import assert from 'node:assert/strict'
import test from 'node:test'
import { players } from '../src/data/players.ts'
import { drawWeightedPlayers } from '../src/utils/draft.ts'
import { generateKnockoutRival } from '../src/utils/knockout.ts'
import {
  WORLD_FIVE_PLAYER_NAMES,
  getWorldFiveChallengePlayerPool,
  getWorldFiveTeam,
  isWorldFivePlayer,
} from '../src/utils/worldFiveChallenge.ts'

test('official World Five roster is available from the full collection', () => {
  const worldFiveTeam = getWorldFiveTeam(players)

  assert.deepEqual(
    worldFiveTeam.map((player) => player.name),
    [...WORLD_FIVE_PLAYER_NAMES],
  )
})

test('World Five players are excluded from the regular challenge pool', () => {
  const challengePool = getWorldFiveChallengePlayerPool(players)

  assert.equal(challengePool.some(isWorldFivePlayer), false)

  for (const name of ['Noel Noa', 'Marc Snuffy', 'Chris Prince', 'Lavinho']) {
    assert.ok(
      challengePool.some((player) => player.name === name),
      `${name} should remain available in the regular pool`,
    )
  }
})

test('draft draws from the challenge pool cannot include World Five players', () => {
  const challengePool = getWorldFiveChallengePlayerPool(players)

  for (let sample = 0; sample < 200; sample += 1) {
    const drawnPlayers = drawWeightedPlayers(challengePool, 3)

    assert.equal(drawnPlayers.some(isWorldFivePlayer), false)
  }
})

test('common knockout rivals cannot include World Five players', () => {
  const challengePool = getWorldFiveChallengePlayerPool(players)
  const playerTeam = challengePool.slice(0, 5)
  const rival = generateKnockoutRival(
    challengePool,
    playerTeam,
    'knockout-final',
  )

  assert.equal(rival.team.some(isWorldFivePlayer), false)
})
