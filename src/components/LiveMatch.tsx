import { useEffect, useMemo, useRef, useState } from 'react'
import type { LiveMatchDevCommand } from '../types/devTools'
import type { MatchPhase } from '../types/game'
import type { LiveMatchState, MatchResult } from '../types/match'
import type { Player } from '../types/player'
import { MATCH_PHASE_LABELS } from '../utils/gameFlow'
import {
  advanceLiveMatch,
  createMatchResult,
  forceFlowActivation,
  forceMatchWinner,
  getNextEventDelay,
  initializeLiveMatch,
  MATCH_CONFIG,
  SIMULATION_SPEED_OPTIONS,
  type SimulationSpeed,
} from '../utils/match'
import MatchResultPanel from './MatchResultPanel'

interface LiveMatchProps {
  playerTeam: Player[]
  rivalTeam: Player[]
  phase: MatchPhase
  onComplete: (result: MatchResult) => void
  devCommand?: LiveMatchDevCommand
}

const eventSideStyles = {
  player:
    'border-emerald-300/50 bg-emerald-300/15 text-emerald-200 shadow-[inset_3px_0_0_rgba(110,231,183,0.9)]',
  rival:
    'border-red-400/50 bg-red-500/15 text-red-200 shadow-[inset_3px_0_0_rgba(248,113,113,0.9)]',
  goalPlayer:
    'relative overflow-hidden border-emerald-300/80 bg-emerald-400/[0.13] text-emerald-100 shadow-[inset_4px_0_0_rgba(52,211,153,0.95),0_0_28px_rgba(52,211,153,0.24)]',
  goalRival:
    'relative overflow-hidden border-rose-300/80 bg-rose-500/[0.13] text-rose-100 shadow-[inset_4px_0_0_rgba(251,113,133,0.95),0_0_28px_rgba(244,63,94,0.24)]',
  flowActivated:
    'border-amber-300/70 bg-amber-300/15 text-amber-100 shadow-[inset_3px_0_0_rgba(251,191,36,0.95),0_0_24px_rgba(251,191,36,0.22)]',
  flowEnded:
    'border-amber-500/30 bg-amber-500/[0.06] text-amber-200 shadow-[inset_3px_0_0_rgba(245,158,11,0.45)]',
}

const eventLabels = {
  goal: 'Gol',
  shot: 'Finalização',
  defense: 'Defesa',
  'flow-activated': 'FLOW ACTIVATED',
  'flow-ended': 'FLOW ENDED',
}

const FLOW_ICON = '\u{1F525}'
const GOAL_ICON = '\u26BD'

function getGoalIcons(goals: number): string {
  return '⚽'.repeat(goals)
}

function getEventStyle(eventType: string, side: 'player' | 'rival'): string {
  if (eventType === 'goal') {
    return side === 'player'
      ? eventSideStyles.goalPlayer
      : eventSideStyles.goalRival
  }

  if (eventType === 'flow-activated') {
    return eventSideStyles.flowActivated
  }

  if (eventType === 'flow-ended') {
    return eventSideStyles.flowEnded
  }

  return eventSideStyles[side]
}

function LiveMatch({
  playerTeam,
  rivalTeam,
  phase,
  onComplete,
  devCommand,
}: LiveMatchProps) {
  const continueLockedRef = useRef(false)
  const forceFlowNextRef = useRef(false)
  const timelineScrollRef = useRef<HTMLDivElement>(null)
  const [simulationSpeed, setSimulationSpeed] =
    useState<SimulationSpeed>(1)
  const [matchState, setMatchState] = useState<LiveMatchState>(() =>
    initializeLiveMatch(playerTeam, rivalTeam),
  )

  const result = useMemo(
    () => (matchState.isFinished ? createMatchResult(matchState) : null),
    [matchState],
  )

  useEffect(() => {
    if (matchState.isFinished) {
      return
    }

    const timer = window.setTimeout(() => {
      setMatchState((currentState) => {
        if (forceFlowNextRef.current) {
          forceFlowNextRef.current = false

          const flowState = forceFlowActivation(currentState)

          if (flowState !== currentState) {
            return flowState
          }
        }

        return advanceLiveMatch(currentState)
      })
    }, getNextEventDelay(simulationSpeed))

    return () => {
      window.clearTimeout(timer)
    }
  }, [matchState.events.length, matchState.isFinished, simulationSpeed])

  useEffect(() => {
    if (!devCommand) {
      return
    }

    if (devCommand.type === 'force-player-win') {
      forceFlowNextRef.current = false
      const timer = window.setTimeout(() => {
        setMatchState((currentState) =>
          forceMatchWinner(currentState, 'player'),
        )
      }, 0)

      return () => {
        window.clearTimeout(timer)
      }
    }

    if (devCommand.type === 'force-rival-win') {
      forceFlowNextRef.current = false
      const timer = window.setTimeout(() => {
        setMatchState((currentState) =>
          forceMatchWinner(currentState, 'rival'),
        )
      }, 0)

      return () => {
        window.clearTimeout(timer)
      }
    }

    forceFlowNextRef.current = true
    return undefined
  }, [devCommand])

  useEffect(() => {
    const timeline = timelineScrollRef.current

    if (!timeline) {
      return
    }

    timeline.scrollTo({
      top: timeline.scrollHeight,
      behavior: 'smooth',
    })
  }, [matchState.events.length])

  function handleContinue() {
    if (!result || continueLockedRef.current) {
      return
    }

    continueLockedRef.current = true
    onComplete(result)
  }

  function getPlayerStats(side: 'player' | 'rival', playerId: number) {
    return matchState.stats.find(
      (playerStats) =>
        playerStats.side === side && playerStats.player.id === playerId,
    )
  }

  function isPlayerInFlow(side: 'player' | 'rival', playerId: number): boolean {
    return matchState.activeFlows.some(
      (flow) => flow.side === side && flow.playerId === playerId,
    )
  }

  return (
    <section className="relative z-10 mx-auto w-full max-w-6xl">
      <header className="text-center">
        <span className="text-xs font-black uppercase tracking-[0.3em] text-blue-400">
          Partida em tempo real
        </span>
        <h1 className="mt-3 text-4xl font-black uppercase italic tracking-tight sm:text-6xl">
          {MATCH_PHASE_LABELS[phase]}
        </h1>
        <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
          Primeiro time a marcar {MATCH_CONFIG.targetGoals} gols
        </p>
      </header>

      <div className="mx-auto mt-8 flex max-w-2xl items-center justify-center gap-7 border-y border-white/10 bg-black/30 px-5 py-6 sm:gap-14">
        <div className="min-w-0 text-center">
          <p className="truncate text-xs font-black uppercase tracking-widest text-blue-300">
            Seu time
          </p>
          <strong className="mt-2 block text-6xl font-black italic text-white sm:text-7xl">
            {matchState.score.player}
          </strong>
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-2xl font-black text-zinc-700">×</span>
          {!matchState.isFinished && (
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.9)]" />
          )}
        </div>
        <div className="min-w-0 text-center">
          <p className="truncate text-xs font-black uppercase tracking-widest text-rose-300">
            Rival
          </p>
          <strong className="mt-2 block text-6xl font-black italic text-white sm:text-7xl">
            {matchState.score.rival}
          </strong>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <span className="mr-1 text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">
          Velocidade
        </span>
        {SIMULATION_SPEED_OPTIONS.map((speed) => {
          const isActive = simulationSpeed === speed

          return (
            <button
              key={speed}
              type="button"
              onClick={() => setSimulationSpeed(speed)}
              className={`min-w-12 border px-3 py-2 text-xs font-black uppercase tracking-wider transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-400 ${
                isActive
                  ? 'border-blue-300 bg-blue-500 text-white shadow-[0_0_18px_rgba(59,130,246,0.35)]'
                  : 'border-white/10 bg-white/[0.04] text-zinc-500 hover:border-blue-400/50 hover:text-blue-200'
              }`}
              aria-pressed={isActive}
            >
              {speed}x
            </button>
          )
        })}
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <article className="flex h-[30rem] flex-col border border-white/10 bg-white/[0.03] p-5 lg:h-[32rem]">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-300">
              Times
            </h2>
            <span className="text-xs text-zinc-600">
              Evento {matchState.events.length}
            </span>
          </div>

          <div className="match-scrollbar mt-5 min-h-0 flex-1 space-y-5 overflow-y-auto pr-2">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-blue-300">
                Seu time
              </p>
              <ul className="mt-2 space-y-2">
                {playerTeam.map((player) => {
                  const playerStats = getPlayerStats('player', player.id)
                  const goals = playerStats?.goals ?? 0
                  const inFlow = isPlayerInFlow('player', player.id)

                  return (
                    <li
                      key={player.id}
                      className={`flex items-center justify-between gap-3 border-b pb-2 text-sm transition ${
                        inFlow
                          ? 'border-amber-300/30 bg-amber-300/[0.06] px-2 py-2 shadow-[0_0_18px_rgba(251,191,36,0.16)]'
                          : 'border-white/5'
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-1.5">
                        {inFlow && (
                          <span
                            className="shrink-0 animate-pulse text-sm drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]"
                            aria-hidden="true"
                          >
                            {FLOW_ICON}
                          </span>
                        )}
                        <span
                          className={`truncate ${
                            inFlow
                              ? 'font-bold text-amber-100 drop-shadow-[0_0_8px_rgba(251,191,36,0.75)]'
                              : 'text-zinc-300'
                          }`}
                        >
                          {player.name}
                        </span>
                        {goals > 0 && (
                          <span
                            className="shrink-0 text-xs tracking-wider text-amber-200"
                            aria-label={`${goals} gol${
                              goals === 1 ? '' : 's'
                            }`}
                          >
                            {getGoalIcons(goals)}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-xs text-zinc-600">
                        {player.position}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-wider text-rose-300">
                Rival
              </p>
              <ul className="mt-2 space-y-2">
                {rivalTeam.map((player) => {
                  const playerStats = getPlayerStats('rival', player.id)
                  const goals = playerStats?.goals ?? 0
                  const inFlow = isPlayerInFlow('rival', player.id)

                  return (
                    <li
                      key={player.id}
                      className={`flex items-center justify-between gap-3 border-b pb-2 text-sm transition ${
                        inFlow
                          ? 'border-amber-300/30 bg-amber-300/[0.06] px-2 py-2 shadow-[0_0_18px_rgba(251,191,36,0.16)]'
                          : 'border-white/5'
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-1.5">
                        {inFlow && (
                          <span
                            className="shrink-0 animate-pulse text-sm drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]"
                            aria-hidden="true"
                          >
                            {FLOW_ICON}
                          </span>
                        )}
                        <span
                          className={`truncate ${
                            inFlow
                              ? 'font-bold text-amber-100 drop-shadow-[0_0_8px_rgba(251,191,36,0.75)]'
                              : 'text-zinc-300'
                          }`}
                        >
                          {player.name}
                        </span>
                        {goals > 0 && (
                          <span
                            className="shrink-0 text-xs tracking-wider text-amber-200"
                            aria-label={`${goals} gol${
                              goals === 1 ? '' : 's'
                            }`}
                          >
                            {getGoalIcons(goals)}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-xs text-zinc-600">
                        {player.position}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </article>

        <article className="flex h-[30rem] flex-col border border-white/10 bg-black/30 p-5 lg:h-[32rem]">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-300">
              Timeline
            </h2>
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                matchState.isFinished ? 'text-amber-300' : 'text-emerald-400'
              }`}
            >
              {matchState.isFinished ? 'Encerrada' : 'Ao vivo'}
            </span>
          </div>

          <div
            ref={timelineScrollRef}
            className="match-scrollbar mt-5 min-h-0 flex-1 space-y-3 overflow-y-auto pr-2"
            aria-live="polite"
          >
            {matchState.events.length === 0 && (
              <p className="py-12 text-center text-sm text-zinc-600">
                Aguardando o primeiro lance...
              </p>
            )}

            {matchState.events.map((event) => (
              <div
                key={event.id}
                className={`border p-3 ${getEventStyle(event.type, event.side)}`}
              >
                {event.type === 'goal' && (
                  <div
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_42%)]"
                    aria-hidden="true"
                  />
                )}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {event.type === 'goal'
                        ? `${GOAL_ICON} GOL`
                        : event.type === 'flow-activated'
                        ? `${FLOW_ICON} ${eventLabels[event.type]}`
                        : eventLabels[event.type]}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">
                      {event.side === 'player' ? 'Seu time' : 'Rival'}
                    </span>
                  </div>
                  <span className="text-xs font-black text-white">
                    {event.scoreAfter.player} × {event.scoreAfter.rival}
                  </span>
                </div>
                {event.type === 'goal' ? (
                  <div className="relative mt-3">
                    <p className="text-2xl font-black uppercase italic tracking-wide text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.24)]">
                      GOL DE {event.playerName.toUpperCase()}
                    </p>
                    {event.assistPlayerName && (
                      <p className="mt-1 text-xs font-bold uppercase tracking-wider opacity-80">
                        Assistencia de {event.assistPlayerName}
                      </p>
                    )}
                    {event.traitImpactDescription && (
                      <p className="mt-2 border-l-2 border-white/40 pl-2 text-xs font-bold uppercase tracking-wider text-white/90">
                        {event.traitImpactDescription}
                      </p>
                    )}
                    {event.synergyImpactDescription && (
                      <p className="mt-2 border-l-2 border-cyan-200/50 pl-2 text-xs font-bold uppercase tracking-wider text-cyan-100">
                        {event.synergyImpactDescription}
                      </p>
                    )}
                    <p className="mt-2 text-sm leading-relaxed opacity-85">
                      {event.description}
                    </p>
                  </div>
                ) : event.type === 'flow-activated' ||
                event.type === 'flow-ended' ? (
                  <>
                    <p
                      className={`mt-3 text-xl font-black uppercase italic tracking-wide ${
                        event.type === 'flow-activated'
                          ? 'text-amber-100'
                          : 'text-amber-300/80'
                      }`}
                    >
                      {event.playerName.toUpperCase()}
                    </p>
                    {event.traitImpactDescription && (
                      <p className="mt-2 text-xs font-bold uppercase tracking-wider text-amber-100/80">
                        {event.traitImpactDescription}
                      </p>
                    )}
                    {event.synergyImpactDescription && (
                      <p className="mt-2 text-xs font-bold uppercase tracking-wider text-cyan-200">
                        {event.synergyImpactDescription}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                      {event.description}
                    </p>
                    {event.traitImpactDescription && (
                      <p className="mt-2 text-xs font-bold uppercase tracking-wider text-amber-200">
                        {event.traitImpactDescription}
                      </p>
                    )}
                    {event.synergyImpactDescription && (
                      <p className="mt-2 text-xs font-bold uppercase tracking-wider text-cyan-200">
                        {event.synergyImpactDescription}
                      </p>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </article>
      </div>

      {result && (
        <>
          <div className="mt-8">
            <MatchResultPanel result={result} />
          </div>
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={handleContinue}
              className="bg-blue-600 px-8 py-4 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-400"
            >
              Continuar
            </button>
          </div>
        </>
      )}
    </section>
  )
}

export default LiveMatch
