import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getActiveSynergies,
  getActiveUniqueSynergies,
  getNewSynergiesIfPlayerAdded,
  getTeamSynergyBonus,
  getSynergyEffectSummary,
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
