import assert from 'node:assert/strict'
import test from 'node:test'
import { players } from '../src/data/players.ts'
import { generateKnockoutRival } from '../src/utils/knockout.ts'

test('knockout rivals are new and increase in power each round', () => {
  const playerTeam = players.slice(0, 5)
  const roundOf16 = generateKnockoutRival(
    players,
    playerTeam,
    'knockout-round-of-16',
    0,
    [],
    () => 0.5,
  )
  const quarter = generateKnockoutRival(
    players,
    playerTeam,
    'knockout-quarter',
    roundOf16.power,
    [roundOf16.signature],
    () => 0.5,
  )
  const semi = generateKnockoutRival(
    players,
    playerTeam,
    'knockout-semi',
    quarter.power,
    [roundOf16.signature, quarter.signature],
    () => 0.5,
  )
  const final = generateKnockoutRival(
    players,
    playerTeam,
    'knockout-final',
    semi.power,
    [roundOf16.signature, quarter.signature, semi.signature],
    () => 0.5,
  )

  assert.ok(quarter.power > roundOf16.power)
  assert.ok(semi.power > quarter.power)
  assert.ok(final.power > semi.power)
  assert.equal(
    new Set([
      roundOf16.signature,
      quarter.signature,
      semi.signature,
      final.signature,
    ]).size,
    4,
  )
})

test('knockout rivals never contain a player from the user team', () => {
  const playerTeam = players.slice(0, 5)
  const playerTeamIds = new Set(playerTeam.map((player) => player.id))
  const rival = generateKnockoutRival(
    players,
    playerTeam,
    'knockout-final',
  )

  assert.equal(
    rival.team.some((player) => playerTeamIds.has(player.id)),
    false,
  )
})
