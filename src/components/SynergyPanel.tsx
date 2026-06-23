import type { Player } from '../types/player'
import {
  getActiveSynergies,
  getSynergyEffectSummary,
} from '../utils/synergies'

interface SynergyPanelProps {
  team: Player[]
  title?: string
}

function SynergyPanel({
  team,
  title = 'Sinergias ativas',
}: SynergyPanelProps) {
  const synergies = getActiveSynergies(team)

  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
          {title}
        </h3>
        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-600">
          {synergies.length}
        </span>
      </div>

      {synergies.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-600">
          Nenhuma combinacao ativa.
        </p>
      ) : (
        <div className="mt-3 grid gap-2">
          {synergies.map((synergy) => (
            <article
              key={synergy.id}
              className="border border-cyan-300/15 bg-cyan-300/[0.04] p-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h4 className="text-sm font-black uppercase italic text-white">
                  {synergy.name}
                </h4>
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-200">
                  {getSynergyEffectSummary(synergy)}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                {synergy.description}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {synergy.requiredArchetypes.map((archetype) => (
                  <span
                    key={archetype}
                    className="border border-white/10 bg-white/[0.04] px-2 py-1 text-[9px] font-black uppercase tracking-wider text-zinc-300"
                  >
                    {archetype}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default SynergyPanel
