import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getPhaseAfterMatch,
  getPhaseAfterRecruit,
} from '../src/utils/gameFlow.ts'

test('a 3v3 victory advances to recruitment', () => {
  assert.equal(
    getPhaseAfterMatch('match-3v3', 'player'),
    'recruit-after-3v3',
  )
})

test('a 4v4 victory advances to the final recruitment', () => {
  assert.equal(
    getPhaseAfterMatch('match-4v4', 'player'),
    'recruit-after-4v4',
  )
})

test('a 5v5 victory advances to the round of 16', () => {
  assert.equal(
    getPhaseAfterMatch('match-5v5', 'player'),
    'knockout-round-of-16',
  )
})

test('a loss in either match ends the project', () => {
  assert.equal(getPhaseAfterMatch('match-3v3', 'rival'), 'game-over')
  assert.equal(getPhaseAfterMatch('match-4v4', 'rival'), 'game-over')
  assert.equal(getPhaseAfterMatch('match-5v5', 'rival'), 'game-over')
})

test('recruitment advances through the full team build sequence', () => {
  assert.equal(getPhaseAfterRecruit('recruit-after-3v3'), 'match-4v4')
  assert.equal(getPhaseAfterRecruit('recruit-after-4v4'), 'match-5v5')
})

test('knockout victories advance through round of 16, quarter, semi and final', () => {
  assert.equal(
    getPhaseAfterMatch('knockout-round-of-16', 'player'),
    'knockout-quarter',
  )
  assert.equal(
    getPhaseAfterMatch('knockout-quarter', 'player'),
    'knockout-semi',
  )
  assert.equal(
    getPhaseAfterMatch('knockout-semi', 'player'),
    'knockout-final',
  )
  assert.equal(
    getPhaseAfterMatch('knockout-final', 'player'),
    'world-five-transition',
  )
  assert.equal(
    getPhaseAfterMatch('world-five', 'player'),
    'world-five-champion',
  )
})

test('a knockout loss ends the project', () => {
  assert.equal(
    getPhaseAfterMatch('knockout-round-of-16', 'rival'),
    'game-over',
  )
  assert.equal(getPhaseAfterMatch('knockout-quarter', 'rival'), 'game-over')
  assert.equal(getPhaseAfterMatch('knockout-semi', 'rival'), 'game-over')
  assert.equal(getPhaseAfterMatch('knockout-final', 'rival'), 'game-over')
  assert.equal(getPhaseAfterMatch('world-five', 'rival'), 'game-over')
})
