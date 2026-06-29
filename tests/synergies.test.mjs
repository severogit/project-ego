import assert from 'node:assert/strict'
import test from 'node:test'
import { players } from '../src/data/players.ts'
import {
  SYNERGY_DEFINITIONS,
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

test('defensive archetype synergies activate with defense-focused effects', () => {
  const team = [
    createPlayer(1, ['Defender', 'Reactive', 'Goalkeeper']),
    createPlayer(2, ['Leader', 'Power', 'Sprinter']),
    createPlayer(3, ['Visionary']),
    createPlayer(4, ['Finisher']),
    createPlayer(5, ['Playmaker']),
  ]
  const synergies = getActiveSynergies(team)
  const synergyIds = synergies.map((synergy) => synergy.id)

  assert.ok(synergyIds.includes('iron-wall'))
  assert.ok(synergyIds.includes('last-line'))
  assert.ok(synergyIds.includes('counter-press'))
  assert.ok(synergyIds.includes('lockdown'))
  assert.ok(synergyIds.includes('physical-fortress'))
  assert.ok(synergyIds.includes('press-machine'))
  assert.ok(synergyIds.includes('complete-team'))
  assert.equal(getTeamSynergyBonus(team, 'flowChanceBonus'), 0.13)
  assert.equal(
    getSynergyImpactMessage(team, 'defense', 3, { force: true }),
    'Defensive Command fortaleceu a marcacao.',
  )
})

test('defensive archetype synergies use distinct style requirements', () => {
  const defensiveRequirements = Object.fromEntries(
    SYNERGY_DEFINITIONS.filter((synergy) =>
      [
        'defensive-command',
        'iron-wall',
        'last-line',
        'counter-press',
        'lockdown',
        'physical-fortress',
        'press-machine',
        'complete-team',
      ].includes(synergy.id),
    ).map((synergy) => [synergy.id, synergy.requiredArchetypes]),
  )

  assert.deepEqual(defensiveRequirements, {
    'defensive-command': ['Leader', 'Goalkeeper'],
    'iron-wall': ['Defender', 'Reactive'],
    'last-line': ['Goalkeeper', 'Visionary'],
    'counter-press': ['Leader', 'Power'],
    lockdown: ['Visionary', 'Reactive'],
    'physical-fortress': ['Power', 'Goalkeeper'],
    'press-machine': ['Leader', 'Sprinter'],
    'complete-team': ['Finisher', 'Playmaker', 'Defender'],
  })
})

test('a compact defensive core no longer activates every defensive style', () => {
  const team = [
    createPlayer(1, ['Defender', 'Reactive', 'Goalkeeper']),
    createPlayer(2, ['Defender', 'Leader']),
    createPlayer(3, ['Defender', 'Power']),
  ]
  const synergyIds = getActiveSynergies(team).map((synergy) => synergy.id)

  assert.deepEqual(synergyIds, [
    'defensive-command',
    'iron-wall',
    'counter-press',
    'physical-fortress',
  ])
  assert.equal(synergyIds.includes('last-line'), false)
  assert.equal(synergyIds.includes('lockdown'), false)
  assert.equal(synergyIds.includes('press-machine'), false)
})

test('new defensive synergies do not add offensive bonuses except Complete Team', () => {
  const defenseOnlySynergyIds = [
    'iron-wall',
    'last-line',
    'counter-press',
    'lockdown',
    'physical-fortress',
    'press-machine',
  ]

  for (const synergyId of defenseOnlySynergyIds) {
    const synergy = SYNERGY_DEFINITIONS.find(
      (candidate) => candidate.id === synergyId,
    )

    assert.ok(synergy, `${synergyId} should exist`)
    assert.equal(synergy.effects.goalConversionBonus, undefined)
    assert.equal(synergy.effects.offensiveParticipationBonus, undefined)
    assert.equal(synergy.effects.finisherSelectionBonus, undefined)
  }
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
  assert.equal(getTeamSynergyMultiplier(team, 'goalConversionBonus'), 1.21)
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

test('World Five unique synergies activate from the official roster', () => {
  const team = getRosterPlayersByName([
    'Adam Blake',
    'Dada Silva',
    'Julian Loki',
    'Leonardo Luna',
    'Pablo Cavasoz',
  ])
  const synergies = getActiveUniqueSynergies(team)
  const synergyIds = synergies.map((synergy) => synergy.id)

  assert.ok(synergyIds.includes('world-five'))
  assert.ok(synergyIds.includes('global-elite'))
  assert.ok(synergyIds.includes('speed-and-technique'))
  assert.ok(synergyIds.includes('physical-pressure'))
  assert.ok(getTeamSynergyBonus(team, 'flowChanceBonus') >= 0.18)
  assert.equal(
    getSynergyImpactMessage(team, 'flow', 1, { force: true }),
    'World Five elevou a pressao do confronto final.',
  )
})

test('Global Elite activates with at least three World Five members', () => {
  const team = getRosterPlayersByName([
    'Adam Blake',
    'Julian Loki',
    'Pablo Cavasoz',
  ])
  const synergies = getActiveUniqueSynergies(team)

  assert.ok(synergies.some((synergy) => synergy.id === 'global-elite'))
  assert.equal(
    synergies.some((synergy) => synergy.id === 'world-five'),
    false,
  )
})
