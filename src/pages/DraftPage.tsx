import { useCallback, useRef, useState } from 'react'
import ChampionScreen from '../components/ChampionScreen'
import DevToolsPanel from '../components/DevToolsPanel'
import GameEndScreen from '../components/GameEndScreen'
import LiveMatch from '../components/LiveMatch'
import PlayerCard from '../components/PlayerCard'
import RecruitPhase from '../components/RecruitPhase'
import Roulette from '../components/Roulette'
import TeamCompleteScreen from '../components/TeamCompleteScreen'
import TeamStatusPanel from '../components/TeamStatusPanel'
import TeamSummary from '../components/TeamSummary'
import { players } from '../data/players'
import type {
  CampaignVictory,
  GamePhase,
  KnockoutPhase,
  MatchPhase,
} from '../types/game'
import type {
  LiveMatchDevCommand,
  LiveMatchDevCommandType,
} from '../types/devTools'
import type { MatchResult } from '../types/match'
import type { Player } from '../types/player'
import {
  calculatePlayerPower,
  calculateTeamPower,
  drawWeightedPlayers,
} from '../utils/draft'
import {
  getPhaseAfterMatch,
  getPhaseAfterRecruit,
} from '../utils/gameFlow'
import { generateKnockoutRival } from '../utils/knockout'

const INITIAL_TEAM_SIZE = 3
const OPTIONS_PER_ROUND = 3
const FULL_TEAM_SIZE = 5

function isMatchPhase(phase: GamePhase): phase is MatchPhase {
  return (
    phase === 'match-3v3' ||
    phase === 'match-4v4' ||
    phase === 'knockout-quarter' ||
    phase === 'knockout-semi' ||
    phase === 'knockout-final'
  )
}

function getStrongestPlayers(
  amount: number,
  excludedIds: number[] = [],
): Player[] {
  const excludedPlayers = new Set(excludedIds)

  return [...players]
    .filter((player) => !excludedPlayers.has(player.id))
    .sort((firstPlayer, secondPlayer) => {
      const powerDifference =
        calculatePlayerPower(secondPlayer) -
        calculatePlayerPower(firstPlayer)

      return powerDifference || firstPlayer.id - secondPlayer.id
    })
    .slice(0, amount)
}

function completeDevTeam(currentTeam: Player[]): Player[] {
  const uniqueTeam = currentTeam.filter(
    (player, index, team) =>
      team.findIndex((teamPlayer) => teamPlayer.id === player.id) === index,
  )
  const lockedPlayers = uniqueTeam.slice(0, FULL_TEAM_SIZE)
  const fillPlayers = getStrongestPlayers(
    FULL_TEAM_SIZE - lockedPlayers.length,
    lockedPlayers.map((player) => player.id),
  )

  return [...lockedPlayers, ...fillPlayers]
}

function getCampaignBeforeDevPhase(
  phase: KnockoutPhase,
): CampaignVictory[] {
  if (phase === 'knockout-final') {
    return ['knockout-quarter', 'knockout-semi']
  }

  if (phase === 'knockout-semi') {
    return ['knockout-quarter']
  }

  return []
}

function DraftPage() {
  const matchLockedRef = useRef(false)
  const recruitLockedRef = useRef(false)
  const devCommandIdRef = useRef(0)
  const [phase, setPhase] = useState<GamePhase>('draft')
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([])
  const [currentOptions, setCurrentOptions] = useState<Player[]>(() =>
    drawWeightedPlayers(players, OPTIONS_PER_ROUND),
  )
  const [isRolling, setIsRolling] = useState(true)
  const [currentRound, setCurrentRound] = useState(1)
  const [rivalTeam, setRivalTeam] = useState<Player[]>([])
  const [usedRivalPlayerIds, setUsedRivalPlayerIds] = useState<number[]>([])
  const [knockoutRivalSignatures, setKnockoutRivalSignatures] = useState<
    string[]
  >([])
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null)
  const [isMatchRunning, setIsMatchRunning] = useState(false)
  const [eliminatedAt, setEliminatedAt] = useState<MatchPhase | null>(null)
  const [campaign, setCampaign] = useState<CampaignVictory[]>([])
  const [liveMatchDevCommand, setLiveMatchDevCommand] =
    useState<LiveMatchDevCommand>()

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

  function handleStartMatch() {
    if (matchLockedRef.current || !isMatchPhase(phase)) {
      return
    }

    matchLockedRef.current = true
    setIsMatchRunning(true)
  }

  function handleMatchComplete(result: MatchResult) {
    if (!isMatchPhase(phase) || !isMatchRunning) {
      return
    }

    setIsMatchRunning(false)
    setMatchResult(result)

    if (result.winner === 'rival') {
      setEliminatedAt(phase)
      setPhase('game-over')
      return
    }

    setCampaign((currentCampaign) => [...currentCampaign, phase])
    const nextPhase = getPhaseAfterMatch(phase, result.winner)

    if (
      nextPhase === 'knockout-semi' ||
      nextPhase === 'knockout-final'
    ) {
      const nextRival = generateKnockoutRival(
        players,
        selectedPlayers,
        nextPhase,
        calculateTeamPower(rivalTeam),
        knockoutRivalSignatures,
      )

      setRivalTeam(nextRival.team)
      setKnockoutRivalSignatures((currentSignatures) => [
        ...currentSignatures,
        nextRival.signature,
      ])
      setMatchResult(null)
      setIsMatchRunning(false)
      matchLockedRef.current = false
      setPhase(nextPhase)
      return
    }

    if (
      nextPhase === 'recruit-after-3v3' ||
      nextPhase === 'recruit-after-4v4'
    ) {
      recruitLockedRef.current = false
    }

    setPhase(nextPhase)
  }

  function handleRecruitPlayer(player: Player) {
    if (
      recruitLockedRef.current ||
      (phase !== 'recruit-after-3v3' &&
        phase !== 'recruit-after-4v4') ||
      !rivalTeam.some((rivalPlayer) => rivalPlayer.id === player.id) ||
      selectedPlayers.some(
        (selectedPlayer) => selectedPlayer.id === player.id,
      )
    ) {
      return
    }

    recruitLockedRef.current = true
    const updatedTeam = [...selectedPlayers, player]
    const nextPhase = getPhaseAfterRecruit(phase)

    setSelectedPlayers(updatedTeam)

    if (nextPhase === 'team-complete') {
      setRivalTeam([])
      setMatchResult(null)
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
    setIsMatchRunning(false)
    matchLockedRef.current = false
    setPhase(nextPhase)
  }

  function handleEnterKnockout() {
    if (phase !== 'team-complete') {
      return
    }

    const quarterRival = generateKnockoutRival(
      players,
      selectedPlayers,
      'knockout-quarter',
    )

    setRivalTeam(quarterRival.team)
    setKnockoutRivalSignatures([quarterRival.signature])
    setMatchResult(null)
    setIsMatchRunning(false)
    matchLockedRef.current = false
    setPhase('knockout-quarter')
  }

  function handleRestart() {
    matchLockedRef.current = false
    recruitLockedRef.current = false
    setPhase('draft')
    setSelectedPlayers([])
    setCurrentOptions(drawWeightedPlayers(players, OPTIONS_PER_ROUND))
    setCurrentRound(1)
    setIsRolling(true)
    setRivalTeam([])
    setUsedRivalPlayerIds([])
    setKnockoutRivalSignatures([])
    setMatchResult(null)
    setIsMatchRunning(false)
    setEliminatedAt(null)
    setCampaign([])
    setLiveMatchDevCommand(undefined)
  }

  function resetDevFlowState() {
    matchLockedRef.current = false
    recruitLockedRef.current = false
    setMatchResult(null)
    setIsMatchRunning(false)
    setEliminatedAt(null)
    setLiveMatchDevCommand(undefined)
  }

  function handleDevLiveMatchCommand(type: LiveMatchDevCommandType) {
    if (!isMatchPhase(phase) || !isMatchRunning) {
      return
    }

    devCommandIdRef.current += 1
    setLiveMatchDevCommand({
      id: devCommandIdRef.current,
      type,
    })
  }

  function handleDevSkipToFullTeam() {
    const devTeam = completeDevTeam(selectedPlayers)

    resetDevFlowState()
    setSelectedPlayers(devTeam)
    setCurrentRound(INITIAL_TEAM_SIZE)
    setIsRolling(false)
    setRivalTeam([])
    setUsedRivalPlayerIds([])
    setKnockoutRivalSignatures([])
    setCampaign([])
    setPhase('team-complete')
  }

  function handleDevGenerateStrongTeam() {
    const devTeam = getStrongestPlayers(FULL_TEAM_SIZE)

    resetDevFlowState()
    setSelectedPlayers(devTeam)
    setCurrentRound(INITIAL_TEAM_SIZE)
    setIsRolling(false)
    setRivalTeam([])
    setUsedRivalPlayerIds([])
    setKnockoutRivalSignatures([])
    setCampaign([])
    setPhase('team-complete')
  }

  function handleDevJumpToKnockout(nextPhase: KnockoutPhase) {
    const devTeam = completeDevTeam(selectedPlayers)
    const nextRival = generateKnockoutRival(players, devTeam, nextPhase)

    resetDevFlowState()
    setSelectedPlayers(devTeam)
    setCurrentRound(INITIAL_TEAM_SIZE)
    setIsRolling(false)
    setRivalTeam(nextRival.team)
    setUsedRivalPlayerIds(nextRival.team.map((player) => player.id))
    setKnockoutRivalSignatures([nextRival.signature])
    setCampaign(getCampaignBeforeDevPhase(nextPhase))
    setPhase(nextPhase)
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

        <div className="mt-8">
          <TeamStatusPanel
            team={selectedPlayers}
            maxTeamSize={INITIAL_TEAM_SIZE}
            title="Seu draft"
          />
        </div>

        <div className="mt-5 flex min-h-16 flex-wrap items-center justify-center gap-3">
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
                  comparisonTeam={selectedPlayers}
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

    if (isMatchPhase(phase)) {
      if (isMatchRunning) {
        return (
          <LiveMatch
            key={phase}
            playerTeam={selectedPlayers}
            rivalTeam={rivalTeam}
            phase={phase}
            onComplete={handleMatchComplete}
            devCommand={liveMatchDevCommand}
          />
        )
      }

      return (
        <TeamSummary
          team={selectedPlayers}
          rivalTeam={rivalTeam}
          phase={phase}
          onStartMatch={handleStartMatch}
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

    if (phase === 'team-complete') {
      return (
        <TeamCompleteScreen
          team={selectedPlayers}
          onEnterKnockout={handleEnterKnockout}
        />
      )
    }

    if (phase === 'champion') {
      return (
        <ChampionScreen
          team={selectedPlayers}
          campaign={campaign}
          onRestart={handleRestart}
        />
      )
    }

    if (phase === 'game-over' && eliminatedAt) {
      return (
        <GameEndScreen
          team={selectedPlayers}
          result={matchResult}
          eliminatedAt={eliminatedAt}
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
      <DevToolsPanel
        phase={phase}
        teamSize={selectedPlayers.length}
        isMatchRunning={isMatchPhase(phase) && isMatchRunning}
        onForceVictory={() =>
          handleDevLiveMatchCommand('force-player-win')
        }
        onForceDefeat={() => handleDevLiveMatchCommand('force-rival-win')}
        onSkipToFullTeam={handleDevSkipToFullTeam}
        onJumpToKnockout={handleDevJumpToKnockout}
        onGenerateStrongTeam={handleDevGenerateStrongTeam}
        onForceFlowNext={() =>
          handleDevLiveMatchCommand('force-flow-next')
        }
      />
    </main>
  )
}

export default DraftPage
