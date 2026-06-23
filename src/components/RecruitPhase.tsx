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
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-400">
          Vitória confirmada
        </span>
        <h1 className="mt-3 text-4xl font-black uppercase italic tracking-tight sm:text-6xl">
          Recrute um rival
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-zinc-400">
          Escolha um jogador derrotado para completar seu time de{' '}
          {nextTeamSize}.
        </p>
      </header>

      <div className="mt-9">
        <MatchResultPanel result={result} />
      </div>

      <div className="mt-8">
        <TeamStatusPanel
          team={result.playerTeam}
          maxTeamSize={nextTeamSize}
          title="Time antes do recrutamento"
        />
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
