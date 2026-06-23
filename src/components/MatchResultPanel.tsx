import type { MatchResult } from '../types/match'

interface MatchResultPanelProps {
  result: MatchResult
}

function MatchResultPanel({ result }: MatchResultPanelProps) {
  return (
    <section className="border border-white/10 bg-black/30 p-6 sm:p-8">
      <div className="text-center">
        <span className="text-xs font-black uppercase tracking-[0.24em] text-blue-400">
          Resultado da partida
        </span>
        <div className="mt-4 flex items-center justify-center gap-5 sm:gap-8">
          <div>
            <p className="text-xs uppercase tracking-widest text-zinc-500">
              Seu time
            </p>
            <strong className="mt-1 block text-5xl font-black italic text-white">
              {result.score.player}
            </strong>
          </div>
          <span className="text-2xl font-black text-zinc-700">×</span>
          <div>
            <p className="text-xs uppercase tracking-widest text-zinc-500">
              Rival
            </p>
            <strong className="mt-1 block text-5xl font-black italic text-white">
              {result.score.rival}
            </strong>
          </div>
        </div>
        <p
          className={`mt-5 text-2xl font-black uppercase italic ${
            result.winner === 'player'
              ? 'text-emerald-400'
              : 'text-rose-400'
          }`}
        >
          {result.winner === 'player'
            ? 'Seu time venceu'
            : 'O rival venceu'}
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <article className="border border-blue-500/25 bg-blue-500/[0.07] p-5">
          <h3 className="text-sm font-black uppercase tracking-wider text-blue-300">
            Seu time
          </h3>
          <p className="mt-2 text-xs text-zinc-500">
            {result.playerTeam.map((player) => player.name).join(' • ')}
          </p>
          <dl className="mt-5 space-y-3">
            <div className="flex justify-between gap-4">
              <dt className="text-sm text-zinc-500">Poder base</dt>
              <dd className="font-bold text-white">
                {result.playerStrength.basePower}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-sm text-zinc-500">Força final</dt>
              <dd className="font-bold text-blue-300">
                {result.playerStrength.finalStrength.toFixed(1)}
              </dd>
            </div>
          </dl>
        </article>

        <article className="border border-rose-500/25 bg-rose-500/[0.06] p-5">
          <h3 className="text-sm font-black uppercase tracking-wider text-rose-300">
            Time rival
          </h3>
          <p className="mt-2 text-xs text-zinc-500">
            {result.rivalTeam.map((player) => player.name).join(' • ')}
          </p>
          <dl className="mt-5 space-y-3">
            <div className="flex justify-between gap-4">
              <dt className="text-sm text-zinc-500">Poder base</dt>
              <dd className="font-bold text-white">
                {result.rivalStrength.basePower}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-sm text-zinc-500">Força final</dt>
              <dd className="font-bold text-rose-300">
                {result.rivalStrength.finalStrength.toFixed(1)}
              </dd>
            </div>
          </dl>
        </article>
      </div>
    </section>
  )
}

export default MatchResultPanel
