import assert from 'node:assert/strict'
import test from 'node:test'
import { players } from '../src/data/players.ts'
import {
  RARITY_WEIGHTS,
  drawWeightedPlayers,
} from '../src/utils/draft.ts'

test('weighted draws approximate the configured rarity distribution', () => {
  const sampleSize = 100_000
  const counts = Object.fromEntries(
    Object.keys(RARITY_WEIGHTS).map((rarity) => [rarity, 0]),
  )

  for (let sample = 0; sample < sampleSize; sample += 1) {
    const [player] = drawWeightedPlayers(players, 1)
    counts[player.rarity] += 1
  }

  for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
    const observedPercentage = (counts[rarity] / sampleSize) * 100

    assert.ok(
      Math.abs(observedPercentage - weight) < 1,
      `${rarity}: expected about ${weight}%, received ${observedPercentage.toFixed(2)}%`,
    )
  }
})

test('weighted draws do not return duplicate or excluded players', () => {
  const excludedIds = players.slice(0, 4).map((player) => player.id)

  for (let sample = 0; sample < 1_000; sample += 1) {
    const result = drawWeightedPlayers(players, 3, excludedIds)
    const resultIds = result.map((player) => player.id)

    assert.equal(new Set(resultIds).size, result.length)
    assert.equal(
      resultIds.some((playerId) => excludedIds.includes(playerId)),
      false,
    )
  }
})
