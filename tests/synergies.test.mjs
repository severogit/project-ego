import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getActiveSynergies,
  getSynergyEffectSummary,
  getTeamSynergyMultiplier,
} from '../src/utils/synergies.ts'

function createPlayer(id, archetypes = []) {
  return {
    id,
    name: `Player ${id}`,
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
