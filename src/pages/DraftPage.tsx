import { useCallback, useRef, useState } from 'react'
import GameEndScreen from '../components/GameEndScreen'
import PlayerCard from '../components/PlayerCard'
import RecruitPhase from '../components/RecruitPhase'
import Roulette from '../components/Roulette'
import TeamSummary from '../components/TeamSummary'
import { players } from '../data/players'
import type { GamePhase } from '../types/game'
import type { MatchResult } from '../types/match'
import type { Player } from '../types/player'
import { drawWeightedPlayers } from '../utils/draft'
import {
  getPhaseAfterMatch,
  getPhaseAfterRecruit,
} from '../utils/gameFlow'
import { simulateMatch } from '../utils/match'

const INITIAL_TEAM_SIZE = 3
const OPTIONS_PER_ROUND = 3

function DraftPage() {
  const matchLockedRef = useRef(false)
  const [phase, setPhase] = useState<GamePhase>('draft')
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([])
  const [currentOptions, setCurrentOptions] = useState<Player[]>(() =>
    drawWeightedPlayers(players, OPTIONS_PER_ROUND),
  )
  const [isRolling, setIsRolling] = useState(true)
  const [currentRound, setCurrentRound] = useState(1)
  const [rivalTeam, setRivalTeam] = useState<Player[]>([])
  const [usedRivalPlayerIds, setUsedRivalPlayerIds] = useState<number[]>([])
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null)

  const selectedPlayerIds = selectedPlayers.map((player) => player.id)
  const availablePlayers = players.filter(
    (player) => !selectedPlayerIds.includes(player.id),
  )

  const handleRollComplete = useCallback(() => {
    setIsRolling(false)
  }, [])

  function handlePlayerSelect(player: Player) {
    if (
      phase !== 'draft' ||
      isRolling ||
      selectedPlayers.some((selectedPlayer) => selectedPlayer.id === player.id)
    ) {
      return
    }

    const updatedTeam = [...selectedPlayers, player]
    setSelectedPlayers(updatedTeam)

    if (updatedTeam.length < INITIAL_TEAM_SIZE) {
      setCurrentOptions(
        drawWeightedPlayers(
          players,
          OPTIONS_PER_ROUND,
          updatedTeam.map((selectedPlayer) => selectedPlayer.id),
        ),
      )
      setCurrentRound((round) => round + 1)
      setIsRolling(true)
      return
    }

    const firstRival = drawWeightedPlayers(
      players,
      INITIAL_TEAM_SIZE,
      updatedTeam.map((selectedPlayer) => selectedPlayer.id),
    )

    setRivalTeam(firstRival)
    setUsedRivalPlayerIds(firstRival.map((rivalPlayer) => rivalPlayer.id))
    setMatchResult(null)
    matchLockedRef.current = false
    setPhase('match-3v3')
  }

  function handleSimulateMatch() {
    if (
      matchLockedRef.current ||
      (phase !== 'match-3v3' && phase !== 'match-4v4')
    ) {
      return
    }

    matchLockedRef.current = true
    const result = simulateMatch(selectedPlayers, rivalTeam)

    setMatchResult(result)
    setPhase(getPhaseAfterMatch(phase, result.winner))
  }

  function handleRecruitPlayer(player: Player) {
    if (
      (phase !== 'recruit-after-3v3' &&
        phase !== 'recruit-after-4v4') ||
      !rivalTeam.some((rivalPlayer) => rivalPlayer.id === player.id) ||
      selectedPlayers.some(
        (selectedPlayer) => selectedPlayer.id === player.id,
      )
    ) {
      return
    }

    const updatedTeam = [...selectedPlayers, player]
    const nextPhase = getPhaseAfterRecruit(phase)

    setSelectedPlayers(updatedTeam)

    if (nextPhase === 'team-complete') {
      setRivalTeam([])
      setPhase(nextPhase)
      return
    }

    const nextRival = drawWeightedPlayers(
      players,
      updatedTeam.length,
      [
        ...updatedTeam.map((teamPlayer) => teamPlayer.id),
        ...usedRivalPlayerIds,
      ],
    )

    setRivalTeam(nextRival)
    setUsedRivalPlayerIds((currentIds) => [
      ...currentIds,
      ...nextRival.map((rivalPlayer) => rivalPlayer.id),
    ])
    setMatchResult(null)
    matchLockedRef.current = false
    setPhase(nextPhase)
  }

  function handleRestart() {
    matchLockedRef.current = false
    setPhase('draft')
    setSelectedPlayers([])
    setCurrentOptions(drawWeightedPlayers(players, OPTIONS_PER_ROUND))
    setCurrentRound(1)
    setIsRolling(true)
    setRivalTeam([])
    setUsedRivalPlayerIds([])
    setMatchResult(null)
  }

  function renderDraft() {
    return (
      <section className="relative z-10 mx-auto w-full max-w-6xl">
        <header className="text-center">
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-blue-400">
            Draft inicial
          </span>
          <h1 className="mt-3 text-4xl font-black uppercase italic tracking-tight sm:text-6xl">
            {isRolling ? 'A roleta está girando' : 'Escolha seu jogador'}
          </h1>
          <p className="mt-4 text-sm font-bold uppercase tracking-[0.18em] text-zinc-500">
            Escolha {currentRound} de {INITIAL_TEAM_SIZE}
          </p>
        </header>

        <div className="mt-8 flex min-h-16 flex-wrap items-center justify-center gap-3">
          {selectedPlayers.length > 0 ? (
            selectedPlayers.map((player, index) => (
              <div
                key={player.id}
                className="flex items-center gap-3 border border-blue-500/25 bg-blue-500/10 px-4 py-3"
              >
                <span className="flex h-7 w-7 items-center justify-center bg-blue-500 text-xs font-black text-white">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-bold text-white">{player.name}</p>
                  <p className="text-xs text-zinc-500">{player.position}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-zinc-600">Seu trio ainda está vazio.</p>
          )}
        </div>

        {isRolling ? (
          <Roulette
            key={currentRound}
            playerPool={availablePlayers}
            finalOptions={currentOptions}
            onComplete={handleRollComplete}
          />
        ) : (
          <>
            <div className="mt-9 grid gap-6 md:grid-cols-3">
              {currentOptions.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  onSelect={handlePlayerSelect}
                />
              ))}
            </div>

            <p className="mt-8 text-center text-xs uppercase tracking-[0.18em] text-zinc-600">
              Clique em um card para confirmar sua escolha
            </p>
          </>
        )}
      </section>
    )
  }

  function renderCurrentPhase() {
    if (phase === 'draft') {
      return renderDraft()
    }

    if (phase === 'match-3v3' || phase === 'match-4v4') {
      return (
        <TeamSummary
          team={selectedPlayers}
          rivalTeam={rivalTeam}
          phase={phase}
          onSimulate={handleSimulateMatch}
        />
      )
    }

    if (
      (phase === 'recruit-after-3v3' ||
        phase === 'recruit-after-4v4') &&
      matchResult
    ) {
      return (
        <RecruitPhase
          result={matchResult}
          nextTeamSize={phase === 'recruit-after-3v3' ? 4 : 5}
          onRecruit={handleRecruitPlayer}
        />
      )
    }

    if (phase === 'team-complete' || phase === 'game-over') {
      return (
        <GameEndScreen
          status={phase}
          team={selectedPlayers}
          result={matchResult}
          onRestart={handleRestart}
        />
      )
    }

    return null
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05070b] px-5 py-12 text-white sm:px-8 sm:py-16">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <div className="absolute left-1/2 top-1/3 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-blue-600/15 blur-[130px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.035)_1px,transparent_1px)] bg-[size:52px_52px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#05070b_70%)]" />
      </div>

      {renderCurrentPhase()}
    </main>
  )
}

export default DraftPage
