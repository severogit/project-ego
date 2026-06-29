import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import test from 'node:test'
import { players } from '../src/data/players.ts'
import {
  RARITY_WEIGHTS,
  calculateChoiceImpact,
  drawWeightedPlayers,
} from '../src/utils/draft.ts'
import { TRAIT_DEFINITIONS } from '../src/utils/traits.ts'

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

test('choice impact reports positive contribution for displayed attributes', () => {
  const selectedTeam = players.slice(0, 2)
  const selectablePlayers = players.slice(2)
  const displayedAttributes = ['attack', 'vision', 'defense']

  for (const player of selectablePlayers) {
    const impact = calculateChoiceImpact(
      selectedTeam,
      player,
      displayedAttributes,
    )

    assert.equal(impact.length, displayedAttributes.length)
    assert.deepEqual(
      impact.map(({ attribute }) => attribute),
      displayedAttributes,
    )
    assert.ok(
      impact.every(({ value }) => value > 0),
      `${player.name} should add at least one point to every displayed attribute`,
    )
  }
})

test('every player trait has a functional trait definition', () => {
  const playersWithTrait = players.filter((player) => player.trait)

  assert.ok(playersWithTrait.length > 0)

  for (const player of playersWithTrait) {
    assert.ok(
      TRAIT_DEFINITIONS[player.trait.name],
      `${player.name} trait ${player.trait.name} should be registered`,
    )
  }
})

test('updated players expose their configured traits and archetypes', () => {
  const expectedPlayers = [
    {
      id: 3,
      trait: 'Red Panther',
      archetypes: ['Sprinter', 'Finisher'],
    },
    {
      id: 4,
      trait: 'Hero Shot',
      archetypes: ['Finisher', 'Power'],
    },
    {
      id: 6,
      trait: 'Chameleon',
      archetypes: ['Creator', 'Support', 'Technician'],
    },
    {
      id: 10,
      trait: 'Aerial King',
      archetypes: ['Defender', 'Finisher'],
    },
    {
      id: 11,
      trait: 'Monster Physique',
      archetypes: ['Defender', 'Power'],
    },
    {
      id: 12,
      trait: 'Ball Hunter',
      archetypes: ['Visionary', 'Leader'],
    },
    {
      id: 13,
      trait: 'Shadow Runner',
      archetypes: ['Sprinter', 'Finisher'],
    },
    {
      id: 14,
      trait: 'Street Dribbler',
      archetypes: ['Dribbler', 'Finisher'],
    },
    {
      id: 16,
      trait: 'Planet Hotline',
      archetypes: ['Support', 'Playmaker', 'Sprinter'],
    },
    {
      id: 17,
      trait: 'Wild Reflexes',
      archetypes: ['Defender', 'Reactive', 'Goalkeeper'],
    },
    {
      id: 22,
      trait: 'Hidden Vision',
      archetypes: ['Visionary', 'Defender'],
    },
    {
      id: 23,
      trait: 'Acceleration Burst',
      archetypes: ['Sprinter', 'Finisher'],
    },
    {
      id: 24,
      trait: 'Duelist',
      archetypes: ['Defender', 'Power'],
    },
    {
      id: 25,
      trait: 'Ace Pride',
      archetypes: ['Finisher', 'Leader'],
    },
    {
      id: 26,
      trait: 'Zombie Dribble',
      archetypes: ['Defender', 'Leader', 'Dribbler'],
    },
    {
      id: 27,
      trait: 'Creative Imp',
      archetypes: ['Playmaker', 'Genius'],
    },
    {
      id: 28,
      trait: 'Perfect Striker',
      archetypes: ['Finisher', 'Genius', 'Star'],
    },
    {
      id: 29,
      trait: 'Samba Dribble',
      archetypes: ['Dribbler', 'Genius', 'Creator'],
    },
    {
      id: 30,
      trait: 'Master Tactician',
      archetypes: ['Playmaker', 'Leader', 'Genius'],
    },
    {
      id: 31,
      trait: 'Godspeed',
      archetypes: ['Sprinter', 'Finisher', 'Star'],
    },
    {
      id: 32,
      trait: 'Perfect Physique',
      archetypes: ['Power', 'Finisher', 'Star'],
    },
    {
      id: 43,
      trait: 'Power Striker',
      archetypes: ['Finisher', 'Striker', 'Power', 'Egoist'],
    },
    {
      id: 44,
      trait: 'Physical Domination',
      archetypes: ['Power', 'Duelist', 'Defender', 'Pressure'],
    },
    {
      id: 45,
      trait: 'Elegant Control',
      archetypes: ['Playmaker', 'Dribbler', 'Technician', 'Support'],
    },
    {
      id: 46,
      trait: 'Agile Creator',
      archetypes: [
        'Speedster',
        'Sprinter',
        'Dribbler',
        'Playmaker',
        'Support',
      ],
    },
  ]

  for (const expectedPlayer of expectedPlayers) {
    const player = players.find(
      (candidate) => candidate.id === expectedPlayer.id,
    )

    assert.equal(player?.trait?.name, expectedPlayer.trait)
    assert.deepEqual(player?.archetypes, expectedPlayer.archetypes)
  }
})

test('player image paths resolve to public assets', () => {
  for (const player of players) {
    assert.ok(player.image, `${player.name} should have an image path`)
    assert.ok(
      existsSync(new URL(`../public${player.image}`, import.meta.url)),
      `${player.name} image path should exist: ${player.image}`,
    )
  }
})
