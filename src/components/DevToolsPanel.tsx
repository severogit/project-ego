import { useRef, useState } from 'react'
import { players } from '../data/players'
import type { GamePhase, KnockoutPhase } from '../types/game'
import {
  downloadBatchReportJson,
  runBatchMatchSimulationAsync,
  type BatchSimulationMode,
  type BatchReportSaveStatus,
} from '../utils/batchMatchSimulator'
import { DEV_MODE } from '../utils/devMode'

interface DevToolsPanelProps {
  phase: GamePhase
  teamSize: number
  isMatchRunning: boolean
  onForceVictory: () => void
  onForceDefeat: () => void
  onSkipToFullTeam: () => void
  onJumpToKnockout: (phase: KnockoutPhase) => void
  onGenerateStrongTeam: () => void
  onForceFlowNext: () => void
}

interface DevToolButtonProps {
  children: string
  disabled?: boolean
  onClick: () => void
}

const BATCH_MATCH_COUNTS = [100, 500, 1000, 5000] as const
const BATCH_SIMULATION_MODES: BatchSimulationMode[] = [
  'random',
  'balanced',
  'focused',
]

type BatchMatchCount = (typeof BATCH_MATCH_COUNTS)[number]

interface BatchSimulatorState {
  isRunning: boolean
  completed: number
  percentage: number
  elapsedMs: number
  totalMs: number | null
  reportJson: string | null
  saveStatus: BatchReportSaveStatus | null
  copyFeedback: boolean
  error: string | null
}

const initialBatchSimulatorState: BatchSimulatorState = {
  isRunning: false,
  completed: 0,
  percentage: 0,
  elapsedMs: 0,
  totalMs: null,
  reportJson: null,
  saveStatus: null,
  copyFeedback: false,
  error: null,
}

function formatElapsedTime(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}m ${String(seconds).padStart(2, '0')}s`
}

function getSaveStatusLabel(status: BatchReportSaveStatus | null): string {
  if (status === 'dev-server') {
    return 'batch-report.json salvo'
  }

  if (status === 'download') {
    return 'download iniciado'
  }

  if (status === 'failed') {
    return 'download indisponivel'
  }

  return 'relatorio pronto'
}

async function copyTextToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
    return
  } catch {
    const textarea = document.createElement('textarea')

    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    textarea.style.top = '0'
    document.body.appendChild(textarea)
    textarea.select()

    try {
      document.execCommand('copy')
    } finally {
      document.body.removeChild(textarea)
    }
  }
}

function DevToolButton({
  children,
  disabled = false,
  onClick,
}: DevToolButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="border border-white/10 bg-white/[0.05] px-2.5 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-zinc-300 transition hover:border-cyan-300/50 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-white/10 disabled:hover:text-zinc-300"
    >
      {children}
    </button>
  )
}

function DevToolsPanel({
  phase,
  teamSize,
  isMatchRunning,
  onForceVictory,
  onForceDefeat,
  onSkipToFullTeam,
  onJumpToKnockout,
  onGenerateStrongTeam,
  onForceFlowNext,
}: DevToolsPanelProps) {
  const batchRunIdRef = useRef(0)
  const [batchMatchCount, setBatchMatchCount] =
    useState<BatchMatchCount>(100)
  const [batchSimulationMode, setBatchSimulationMode] =
    useState<BatchSimulationMode>('random')
  const [focusedPlayerId, setFocusedPlayerId] = useState(players[0]?.id ?? 0)
  const [batchSimulator, setBatchSimulator] =
    useState<BatchSimulatorState>(initialBatchSimulatorState)

  if (!DEV_MODE) {
    return null
  }

  const canControlCurrentMatch = isMatchRunning

  async function handleRunBatchSimulation() {
    if (batchSimulator.isRunning) {
      return
    }

    const runId = batchRunIdRef.current + 1

    batchRunIdRef.current = runId
    setBatchSimulator({
      ...initialBatchSimulatorState,
      isRunning: true,
    })

    try {
      const run = await runBatchMatchSimulationAsync(
        {
          matchCount: batchMatchCount,
          simulationMode: batchSimulationMode,
          focusedPlayerId:
            batchSimulationMode === 'focused' ? focusedPlayerId : undefined,
        },
        {
          onProgress: (progress) => {
            if (batchRunIdRef.current !== runId) {
              return
            }

            setBatchSimulator((currentState) => ({
              ...currentState,
              completed: progress.completed,
              percentage: progress.percentage,
              elapsedMs: progress.elapsedMs,
            }))
          },
        },
      )

      if (batchRunIdRef.current !== runId) {
        return
      }

      setBatchSimulator((currentState) => ({
        ...currentState,
        isRunning: false,
        completed: batchMatchCount,
        percentage: 100,
        totalMs: run.report.metadata.executionTime.durationMs,
        reportJson: run.json,
        saveStatus: run.saveStatus,
      }))
    } catch (error) {
      if (batchRunIdRef.current !== runId) {
        return
      }

      setBatchSimulator((currentState) => ({
        ...currentState,
        isRunning: false,
        error:
          error instanceof Error
            ? error.message
            : 'Falha ao executar batch simulation.',
      }))
    }
  }

  function handleDownloadBatchReport() {
    if (!batchSimulator.reportJson) {
      return
    }

    downloadBatchReportJson(batchSimulator.reportJson)
  }

  async function handleCopyBatchReport() {
    if (!batchSimulator.reportJson) {
      return
    }

    await copyTextToClipboard(batchSimulator.reportJson)
    setBatchSimulator((currentState) => ({
      ...currentState,
      copyFeedback: true,
    }))
  }

  return (
    <aside className="fixed bottom-3 right-3 z-50 w-72 border border-cyan-300/20 bg-black/85 p-3 text-white shadow-[0_0_30px_rgba(34,211,238,0.16)] backdrop-blur">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200">
            DEV MODE
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-500">
            {phase} - {teamSize}/5
          </p>
        </div>
        <span className="border border-cyan-300/30 px-2 py-1 text-[10px] font-black uppercase text-cyan-100">
          local
        </span>
      </div>

      <div className="mt-3 grid gap-2">
        <DevToolButton
          disabled={!canControlCurrentMatch}
          onClick={onForceVictory}
        >
          Forcar vitoria
        </DevToolButton>
        <DevToolButton
          disabled={!canControlCurrentMatch}
          onClick={onForceDefeat}
        >
          Forcar derrota
        </DevToolButton>
        <DevToolButton
          disabled={!canControlCurrentMatch}
          onClick={onForceFlowNext}
        >
          Flow no proximo evento
        </DevToolButton>
        <DevToolButton onClick={onSkipToFullTeam}>
          Pular para time 5x5
        </DevToolButton>
        <DevToolButton onClick={onGenerateStrongTeam}>
          Gerar time forte
        </DevToolButton>
        <DevToolButton
          onClick={() => onJumpToKnockout('knockout-round-of-16')}
        >
          Pular para Oitavas
        </DevToolButton>
        <DevToolButton onClick={() => onJumpToKnockout('knockout-quarter')}>
          Pular para Quartas
        </DevToolButton>
        <DevToolButton onClick={() => onJumpToKnockout('knockout-semi')}>
          Pular para Semifinal
        </DevToolButton>
        <DevToolButton onClick={() => onJumpToKnockout('knockout-final')}>
          Pular para Final
        </DevToolButton>
      </div>

      <div className="mt-3 border-t border-white/10 pt-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">
            Batch Simulator
          </p>
          <span className="text-[10px] font-bold text-zinc-500">
            {batchSimulator.completed}/{batchMatchCount}
          </span>
        </div>

        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {BATCH_MATCH_COUNTS.map((matchCount) => (
            <button
              key={matchCount}
              type="button"
              disabled={batchSimulator.isRunning}
              onClick={() => setBatchMatchCount(matchCount)}
              className={`border px-2 py-1.5 text-[10px] font-black uppercase transition disabled:cursor-not-allowed disabled:opacity-35 ${
                batchMatchCount === matchCount
                  ? 'border-cyan-300/70 bg-cyan-300/15 text-cyan-100'
                  : 'border-white/10 bg-white/[0.04] text-zinc-400 hover:border-cyan-300/40 hover:text-cyan-100'
              }`}
            >
              {matchCount}
            </button>
          ))}
        </div>

        <div className="mt-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">
            Simulation Mode
          </p>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {BATCH_SIMULATION_MODES.map((mode) => (
              <label
                key={mode}
                className={`flex cursor-pointer items-center justify-center border px-2 py-1.5 text-[10px] font-black uppercase transition ${
                  batchSimulationMode === mode
                    ? 'border-cyan-300/70 bg-cyan-300/15 text-cyan-100'
                    : 'border-white/10 bg-white/[0.04] text-zinc-400 hover:border-cyan-300/40 hover:text-cyan-100'
                } ${
                  batchSimulator.isRunning
                    ? 'cursor-not-allowed opacity-35'
                    : ''
                }`}
              >
                <input
                  type="radio"
                  name="batch-simulation-mode"
                  value={mode}
                  checked={batchSimulationMode === mode}
                  disabled={batchSimulator.isRunning}
                  onChange={() => setBatchSimulationMode(mode)}
                  className="sr-only"
                />
                {mode}
              </label>
            ))}
          </div>
        </div>

        {batchSimulationMode === 'focused' && (
          <select
            value={focusedPlayerId}
            disabled={batchSimulator.isRunning}
            onChange={(event) => setFocusedPlayerId(Number(event.target.value))}
            className="mt-2 w-full border border-white/10 bg-black px-2.5 py-2 text-[11px] font-bold uppercase tracking-wider text-zinc-300 outline-none transition hover:border-cyan-300/50 focus:border-cyan-300/70 disabled:cursor-not-allowed disabled:opacity-35"
          >
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name}
              </option>
            ))}
          </select>
        )}

        <button
          type="button"
          disabled={batchSimulator.isRunning}
          onClick={handleRunBatchSimulation}
          className="mt-2 w-full border border-cyan-300/35 bg-cyan-300/10 px-2.5 py-2 text-left text-[11px] font-black uppercase tracking-wider text-cyan-100 transition hover:border-cyan-200 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-cyan-300/35"
        >
          ▶ Run Batch Simulation
        </button>

        {(batchSimulator.isRunning || batchSimulator.completed > 0) && (
          <div className="mt-2">
            <div className="h-1.5 overflow-hidden bg-white/10">
              <div
                className="h-full bg-cyan-300 transition-[width]"
                style={{ width: `${batchSimulator.percentage}%` }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              <span>{batchSimulator.percentage.toFixed(0)}%</span>
              <span>{formatElapsedTime(batchSimulator.elapsedMs)}</span>
            </div>
          </div>
        )}

        {batchSimulator.totalMs !== null && (
          <div className="mt-2 grid gap-2">
            <p className="text-[10px] uppercase tracking-wider text-zinc-400">
              Tempo total: {formatElapsedTime(batchSimulator.totalMs)} -{' '}
              {getSaveStatusLabel(batchSimulator.saveStatus)}
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={handleCopyBatchReport}
                className="border border-white/10 bg-white/[0.05] px-2.5 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-zinc-300 transition hover:border-cyan-300/50 hover:text-cyan-100"
              >
                {batchSimulator.copyFeedback ? 'JSON copiado' : 'Copiar JSON'}
              </button>
              <button
                type="button"
                onClick={handleDownloadBatchReport}
                className="border border-white/10 bg-white/[0.05] px-2.5 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-zinc-300 transition hover:border-cyan-300/50 hover:text-cyan-100"
              >
                Download
              </button>
            </div>
          </div>
        )}

        {batchSimulator.error && (
          <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-red-300">
            {batchSimulator.error}
          </p>
        )}
      </div>
    </aside>
  )
}

export default DevToolsPanel
