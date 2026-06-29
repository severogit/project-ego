import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getDisplayArchetypeLabel,
  getFlowPresentation,
  getPlayerIdentityDescription,
  getPlayerRelatedSynergies,
  sortPlayersForCollection,
} from '../src/utils/collectionPresentation.ts'

function createPlayer(overrides = {}) {
  return {
    id: 900,
    name: 'Test Player',
    position: 'Forward',
    rarity: 'Common',
    attack: 80,
    speed: 80,
    vision: 80,
    dribble: 80,
    defense: 80,
    ego: 80,
    flowRate: 10,
    archetypes: [],
    ...overrides,
  }
}

test('collection sorting prioritizes rarity and then name', () => {
  const sortedPlayers = sortPlayersForCollection([
    createPlayer({ id: 1, name: 'Zulu', rarity: 'Rare' }),
    createPlayer({ id: 2, name: 'Bravo', rarity: 'Egoist' }),
    createPlayer({ id: 3, name: 'Alpha', rarity: 'Egoist' }),
    createPlayer({ id: 4, name: 'Charlie', rarity: 'Legendary' }),
    createPlayer({ id: 5, name: 'Echo', rarity: 'Common' }),
  ])

  assert.deepEqual(
    sortedPlayers.map((player) => player.name),
    ['Alpha', 'Bravo', 'Charlie', 'Zulu', 'Echo'],
  )
})

test('flow presentation converts internal rate into player-friendly tiers', () => {
  assert.deepEqual(getFlowPresentation(9), {
    tier: 'Muito Baixa',
    activationLevel: 1,
    description: 'Ativa Flow raramente, mesmo em partidas intensas.',
  })
  assert.equal(getFlowPresentation(14).tier, 'Media')
  assert.equal(getFlowPresentation(16).activationLevel, 4)
  assert.equal(getFlowPresentation(18).tier, 'Muito Alta')
})

test('collection synergies are grouped by archetype and unique relation', () => {
  const player = createPlayer({
    id: 1,
    name: 'Isagi Yoichi',
    archetypes: ['Visionary', 'Playmaker'],
  })
  const relatedSynergies = getPlayerRelatedSynergies(player)

  assert.ok(
    relatedSynergies.archetypeSynergies.some(
      (synergy) => synergy.id === 'killer-pass',
    ),
  )
  assert.ok(
    relatedSynergies.uniqueSynergies.some(
      (synergy) => synergy.id === 'meta-link',
    ),
  )
})

test('identity text and archetype labels avoid raw attribute framing', () => {
  const player = createPlayer({
    position: 'Midfielder',
    trait: {
      name: 'Meta Vision',
      description: 'Reads the game.',
    },
    archetypes: ['Visionary', 'Playmaker', 'Power'],
  })

  assert.equal(getDisplayArchetypeLabel('Power'), 'Fisico')
  assert.match(
    getPlayerIdentityDescription(player),
    /Especialista em leitura de jogo/,
  )
})
