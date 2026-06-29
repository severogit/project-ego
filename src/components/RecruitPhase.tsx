import type { MatchResult } from '../types/match'
import type { Player } from '../types/player'
import MatchResultPanel from './MatchResultPanel'
import PlayerCard from './PlayerCard'
import TeamStatusPanel from './TeamStatusPanel'

interface RecruitPhaseProps {
  result: MatchResult
  nextTeamSize: number
  onRecruit: (player: Player) => void
}

function RecruitPhase({
  result,
  nextTeamSize,
  onRecruit,
}: RecruitPhaseProps) {
  return (
    <section className="relative z-10 mx-auto w-full max-w-6xl">
      <header className="text-center">
        <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-400">
          Vitória confirmada
        </span>
        <h1 className="mt-2 text-3xl font-black uppercase italic tracking-tight sm:text-5xl">
          Recrute um rival
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-zinc-400">
          Escolha um jogador derrotado para completar seu time de{' '}
          {nextTeamSize}.
        </p>
      </header>

      <div className="mt-6">
        <MatchResultPanel result={result} />
      </div>

      <div className="mt-6">
        <TeamStatusPanel
          team={result.playerTeam}
          maxTeamSize={nextTeamSize}
          title="Time antes do recrutamento"
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {result.rivalTeam.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            onSelect={onRecruit}
            comparisonTeam={result.playerTeam}
          />
        ))}
      </div>
    </section>
  )
}

export default RecruitPhase
