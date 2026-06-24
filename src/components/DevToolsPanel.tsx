import type { GamePhase, KnockoutPhase } from '../types/game'
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
  if (!DEV_MODE) {
    return null
  }

  const canControlCurrentMatch = isMatchRunning

  return (
    <aside className="fixed bottom-3 right-3 z-50 w-64 border border-cyan-300/20 bg-black/85 p-3 text-white shadow-[0_0_30px_rgba(34,211,238,0.16)] backdrop-blur">
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
    </aside>
  )
}

export default DevToolsPanel
