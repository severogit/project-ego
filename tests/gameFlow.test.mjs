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

test('a loss in either match ends the project', () => {
  assert.equal(getPhaseAfterMatch('match-3v3', 'rival'), 'game-over')
  assert.equal(getPhaseAfterMatch('match-4v4', 'rival'), 'game-over')
})

test('recruitment advances once and stops after the five-player team', () => {
  assert.equal(getPhaseAfterRecruit('recruit-after-3v3'), 'match-4v4')
  assert.equal(getPhaseAfterRecruit('recruit-after-4v4'), 'team-complete')
})
