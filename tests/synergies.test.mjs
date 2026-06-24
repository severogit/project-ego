import assert from 'node:assert/strict'
import test from 'node:test'
import { players } from '../src/data/players.ts'
import {
  getActiveSynergies,
  getActiveUniqueSynergies,
  getNewSynergiesIfPlayerAdded,
  getTeamSynergyBonus,
  getSynergyEffectSummary,
  getSynergyImpactMessage,
  getTeamSynergyMultiplier,
} from '../src/utils/synergies.ts'

function createPlayer(id, archetypes = [], name = `Player ${id}`) {
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
    archetypes,
  }
}

function getRosterPlayersByName(names) {
  return names.map((name) => {
    const player = players.find((candidate) => candidate.name === name)

    assert.ok(player, `${name} should exist in the roster`)

    return player
  })
}

test('active synergies are detected from team archetypes without duplicates', () => {
  const team = [
    createPlayer(1, ['Playmaker', 'Visionary']),
    createPlayer(2, ['Finisher']),
    createPlayer(3, ['Finisher']),
  ]
  const synergies = getActiveSynergies(team)

  assert.deepEqual(
    synergies.map((synergy) => synergy.id),
    ['killer-pass', 'direct-path'],
  )
})

test('Creative Chaos activates from Dribbler plus Creator archetypes', () => {
  const team = getRosterPlayersByName(['Bachira Meguru', 'Lavinho'])
  const synergies = getActiveSynergies(team)

  assert.ok(
    synergies.some((synergy) => synergy.id === 'creative-chaos'),
  )
  assert.equal(getTeamSynergyBonus(team, 'assistChanceBonus'), 0.08)
  assert.equal(
    getSynergyImpactMessage(team, 'assist', 1, { force: true }),
    'Creative Chaos abriu espacos inesperados.',
  )
})

test('synergy multipliers expose configured bonuses', () => {
  const team = [
    createPlayer(1, ['Playmaker']),
    createPlayer(2, ['Finisher']),
  ]
  const [killerPass] = getActiveSynergies(team)

  assert.equal(getTeamSynergyMultiplier(team, 'goalConversionBonus'), 1.1)
  assert.equal(getSynergyEffectSummary(killerPass), '+ conversao 10%')
})

test('unique synergies are detected from specific player pairs', () => {
  const team = [
    createPlayer(5, ['Finisher'], 'Nagi Seishiro'),
    createPlayer(6, [], 'Mikage Reo'),
  ]
  const synergies = getActiveUniqueSynergies(team)

  assert.deepEqual(
    synergies.map((synergy) => synergy.id),
    ['perfect-duo'],
  )
  assert.equal(getTeamSynergyMultiplier(team, 'goalConversionBonus'), 1.15)
})

test('preview returns only synergies newly activated by a candidate', () => {
  const currentTeam = [createPlayer(5, ['Finisher'], 'Nagi Seishiro')]
  const candidate = createPlayer(6, ['Playmaker'], 'Mikage Reo')
  const preview = getNewSynergiesIfPlayerAdded(currentTeam, candidate)

  assert.deepEqual(
    preview.archetypeSynergies.map((synergy) => synergy.id),
    ['killer-pass'],
  )
  assert.deepEqual(
    preview.uniqueSynergies.map((synergy) => synergy.id),
    ['perfect-duo'],
  )
})

test('unique synergy effects are included in team bonuses', () => {
  const team = [
    createPlayer(9, ['Finisher'], 'Shidou Ryusei'),
    createPlayer(18, ['Playmaker'], 'Itoshi Sae'),
  ]

  assert.equal(getTeamSynergyMultiplier(team, 'goalConversionBonus'), 1.3)
  assert.equal(getTeamSynergyBonus(team, 'assistChanceBonus'), 0.15)
})

test('new unique synergies activate with real roster IDs', () => {
  const uniqueSynergyChecks = [
    {
      names: ['Isagi Yoichi', 'Ikki Niko'],
      synergyId: 'vision-rivals',
      bonusKey: 'flowChanceBonus',
      expectedBonus: 0.08,
      role: 'defense',
      phrase: 'Vision Rivals antecipou a jogada.',
    },
    {
      names: ['Julian Loki', 'Charles Chevalier'],
      synergyId: 'pxg-connection',
      bonusKey: 'assistChanceBonus',
      expectedBonus: 0.15,
      role: 'assist',
      phrase: 'PXG Connection encontrou um passe impossivel.',
    },
    {
      names: ['Don Lorenzo', 'Marc Snuffy'],
      synergyId: 'ubers-system',
      bonusKey: 'defensiveActionBonus',
      expectedBonus: 0.15,
      role: 'defense',
      phrase: 'Ubers System fortaleceu a organizacao defensiva.',
    },
    {
      names: ['Noel Noa', 'Michael Kaiser'],
      synergyId: 'master-and-successor',
      bonusKey: 'goalConversionBonus',
      expectedBonus: 0.12,
      role: 'goal',
      phrase: 'Master and Successor elevou a eficiencia da finalizacao.',
    },
  ]

  for (const check of uniqueSynergyChecks) {
    const team = getRosterPlayersByName(check.names)
    const uniqueSynergies = getActiveUniqueSynergies(team)

    assert.ok(
      uniqueSynergies.some((synergy) => synergy.id === check.synergyId),
      `${check.synergyId} should be active`,
    )
    assert.ok(
      getTeamSynergyBonus(team, check.bonusKey) >= check.expectedBonus,
    )
    assert.equal(
      getSynergyImpactMessage(team, check.role, 1, { force: true }),
      check.phrase,
    )
  }
})

test('Ego Trigger keeps its Flow bonus after balance update', () => {
  const team = getRosterPlayersByName(['Isagi Yoichi', 'Barou Shoei'])
  const synergies = getActiveSynergies(team)

  assert.ok(synergies.some((synergy) => synergy.id === 'ego-trigger'))
  assert.equal(getTeamSynergyBonus(team, 'flowChanceBonus'), 0.1)
})
