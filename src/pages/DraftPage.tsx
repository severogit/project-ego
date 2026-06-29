import { useCallback, useRef, useState } from 'react'
import DevToolsPanel from '../components/DevToolsPanel'
import GameEndScreen from '../components/GameEndScreen'
import LiveMatch from '../components/LiveMatch'
import PlayerCard from '../components/PlayerCard'
import RecruitPhase from '../components/RecruitPhase'
import Roulette from '../components/Roulette'
import TeamCompleteScreen from '../components/TeamCompleteScreen'
import TeamStatusPanel from '../components/TeamStatusPanel'
import TeamSummary from '../components/TeamSummary'
import WorldFiveChampionScreen from '../components/WorldFiveChampionScreen'
import WorldFiveTransitionScreen from '../components/WorldFiveTransitionScreen'
import { players } from '../data/players'
import type {
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
import {
  getWorldFiveChallengePlayerPool,
  getWorldFiveTeam,
} from '../utils/worldFiveChallenge'

const INITIAL_TEAM_SIZE = 3
const OPTIONS_PER_ROUND = 3
const FULL_TEAM_SIZE = 5
const campaignPlayerPool = getWorldFiveChallengePlayerPool(players)

function isMatchPhase(phase: GamePhase): phase is MatchPhase {
  return (
    phase === 'match-3v3' ||
    phase === 'match-4v4' ||
    phase === 'match-5v5' ||
    phase === 'knockout-round-of-16' ||
    phase === 'knockout-quarter' ||
    phase === 'knockout-semi' ||
    phase === 'knockout-final' ||
    phase === 'world-five'
  )
}

function isKnockoutPhase(phase: GamePhase): phase is KnockoutPhase {
  return (
    phase === 'knockout-round-of-16' ||
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

  return [...campaignPlayerPool]
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

function DraftPage() {
  const matchLockedRef = useRef(false)
  const recruitLockedRef = useRef(false)
  const devCommandIdRef = useRef(0)
  const [phase, setPhase] = useState<GamePhase>('draft')
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([])
  const [currentOptions, setCurrentOptions] = useState<Player[]>(() =>
    drawWeightedPlayers(campaignPlayerPool, OPTIONS_PER_ROUND),
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
  const [campaignResults, setCampaignResults] = useState<MatchResult[]>([])
  const [liveMatchDevCommand, setLiveMatchDevCommand] =
    useState<LiveMatchDevCommand>()

  const selectedPlayerIds = selectedPlayers.map((player) => player.id)
  const availablePlayers = campaignPlayerPool.filter(
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
          campaignPlayerPool,
          OPTIONS_PER_ROUND,
          updatedTeam.map((selectedPlayer) => selectedPlayer.id),
        ),
      )
      setCurrentRound((round) => round + 1)
      setIsRolling(true)
      return
    }

    const firstRival = drawWeightedPlayers(
      campaignPlayerPool,
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

    const nextCampaignResults = [...campaignResults, result]
    setCampaignResults(nextCampaignResults)
    const nextPhase = getPhaseAfterMatch(phase, result.winner)

    if (isKnockoutPhase(nextPhase)) {
      const shouldContinueKnockoutProgression = isKnockoutPhase(phase)
      const nextRival = generateKnockoutRival(
        campaignPlayerPool,
        selectedPlayers,
        nextPhase,
        shouldContinueKnockoutProgression
          ? calculateTeamPower(rivalTeam)
          : 0,
        shouldContinueKnockoutProgression ? knockoutRivalSignatures : [],
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

    if (nextPhase === 'world-five-transition') {
      setRivalTeam([])
      setMatchResult(null)
      matchLockedRef.current = false
      setPhase(nextPhase)
      return
    }

    if (nextPhase === 'world-five-champion') {
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

    const nextRival = drawWeightedPlayers(
      campaignPlayerPool,
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

    const roundOf16Rival = generateKnockoutRival(
      campaignPlayerPool,
      selectedPlayers,
      'knockout-round-of-16',
    )

    setRivalTeam(roundOf16Rival.team)
    setKnockoutRivalSignatures([roundOf16Rival.signature])
    setMatchResult(null)
    setIsMatchRunning(false)
    matchLockedRef.current = false
    setPhase('knockout-round-of-16')
  }

  function handleChallengeWorldFive() {
    if (phase !== 'world-five-transition') {
      return
    }

    setRivalTeam(getWorldFiveTeam(players))
    setMatchResult(null)
    setIsMatchRunning(false)
    matchLockedRef.current = false
    setPhase('world-five')
  }

  function handleRestart() {
    matchLockedRef.current = false
    recruitLockedRef.current = false
    setPhase('draft')
    setSelectedPlayers([])
    setCurrentOptions(
      drawWeightedPlayers(campaignPlayerPool, OPTIONS_PER_ROUND),
    )
    setCurrentRound(1)
    setIsRolling(true)
    setRivalTeam([])
    setUsedRivalPlayerIds([])
    setKnockoutRivalSignatures([])
    setMatchResult(null)
    setIsMatchRunning(false)
    setEliminatedAt(null)
    setCampaignResults([])
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
    setCampaignResults([])
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
    setCampaignResults([])
    setPhase('team-complete')
  }

  function handleDevJumpToKnockout(nextPhase: KnockoutPhase) {
    const devTeam = completeDevTeam(selectedPlayers)
    const nextRival = generateKnockoutRival(
      campaignPlayerPool,
      devTeam,
      nextPhase,
    )

    resetDevFlowState()
    setSelectedPlayers(devTeam)
    setCurrentRound(INITIAL_TEAM_SIZE)
    setIsRolling(false)
    setRivalTeam(nextRival.team)
    setUsedRivalPlayerIds(nextRival.team.map((player) => player.id))
    setKnockoutRivalSignatures([nextRival.signature])
    setCampaignResults([])
    setPhase(nextPhase)
  }

  function renderDraft() {
    return (
      <section className="relative z-10 mx-auto w-full max-w-6xl">
        <header className="text-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-blue-400">
            Draft inicial
          </span>
          <h1 className="mt-2 text-3xl font-black uppercase italic tracking-tight sm:text-5xl">
            {isRolling ? 'A roleta está girando' : 'Escolha seu jogador'}
          </h1>
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
            Escolha {currentRound} de {INITIAL_TEAM_SIZE}
          </p>
          <div
            className="mt-2 flex items-center justify-center gap-1.5"
            aria-label={`Progresso do draft: escolha ${currentRound} de ${INITIAL_TEAM_SIZE}`}
          >
            {Array.from({ length: INITIAL_TEAM_SIZE }).map((_, index) => (
              <span
                key={index}
                className={`h-2 w-2 rounded-full border transition duration-200 ${
                  index < currentRound
                    ? 'border-blue-300 bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.55)]'
                    : 'border-zinc-600 bg-zinc-800'
                }`}
              />
            ))}
          </div>
        </header>

        <div className="mt-4">
          <TeamStatusPanel
            team={selectedPlayers}
            maxTeamSize={INITIAL_TEAM_SIZE}
            title="Seu draft"
          />
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
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {currentOptions.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  onSelect={handlePlayerSelect}
                  comparisonTeam={selectedPlayers}
                />
              ))}
            </div>

            <p className="mt-5 text-center text-[10px] uppercase tracking-[0.16em] text-zinc-600">
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
      const nextTeamSize =
        phase === 'recruit-after-3v3' ? 4 : FULL_TEAM_SIZE

      return (
        <RecruitPhase
          result={matchResult}
          nextTeamSize={nextTeamSize}
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

    if (phase === 'world-five-transition') {
      return (
        <WorldFiveTransitionScreen
          team={selectedPlayers}
          onChallengeWorldFive={handleChallengeWorldFive}
        />
      )
    }

    if (phase === 'world-five-champion') {
      return (
        <WorldFiveChampionScreen
          team={selectedPlayers}
          campaignResults={campaignResults}
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
    <main className="relative min-h-screen overflow-hidden bg-[#05070b] px-4 pb-7 pt-24 text-white sm:px-6 sm:pb-9">
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
