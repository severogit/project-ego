import type { Player } from '../types/player'
import {
  getActiveSynergies,
  getActiveUniqueSynergies,
  getSynergyEffectSummary,
  type Synergy,
  type UniqueSynergy,
} from '../utils/synergies'

interface SynergyPanelProps {
  team: Player[]
  title?: string
}

function SynergyPanel({
  team,
  title = 'Sinergias ativas',
}: SynergyPanelProps) {
  const archetypeSynergies = getActiveSynergies(team)
  const uniqueSynergies = getActiveUniqueSynergies(team)
  const totalSynergies = archetypeSynergies.length + uniqueSynergies.length

  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
          {title}
        </h3>
        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-600">
          {totalSynergies}
        </span>
      </div>

      {totalSynergies === 0 ? (
        <p className="mt-3 text-sm text-zinc-600">
          Nenhuma combinacao ativa.
        </p>
      ) : (
        <div className="mt-3 grid gap-4">
          <SynergyGroup
            title="Sinergias de Arquetipo"
            synergies={archetypeSynergies}
            type="archetype"
          />
          <SynergyGroup
            title="Sinergias Unicas"
            synergies={uniqueSynergies}
            type="unique"
          />
        </div>
      )}
    </section>
  )
}

function SynergyGroup({
  title,
  synergies,
  type,
}: {
  title: string
  synergies: Array<Synergy | UniqueSynergy>
  type: 'archetype' | 'unique'
}) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
        {title}
      </p>
      {synergies.length === 0 ? (
        <p className="mt-2 text-xs text-zinc-700">Nenhuma ativa.</p>
      ) : (
        <div className="mt-2 grid gap-2">
          {synergies.map((synergy) => (
            <SynergyCard key={synergy.id} synergy={synergy} type={type} />
          ))}
        </div>
      )}
    </div>
  )
}

function SynergyCard({
  synergy,
  type,
}: {
  synergy: Synergy | UniqueSynergy
  type: 'archetype' | 'unique'
}) {
  const requirements =
    type === 'archetype'
      ? (synergy as Synergy).requiredArchetypes
      : (synergy as UniqueSynergy).requiredPlayerNames

  return (
    <article className="border border-cyan-300/15 bg-cyan-300/[0.04] p-3">
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
        {requirements.map((requirement) => (
          <span
            key={requirement}
            className="border border-white/10 bg-white/[0.04] px-2 py-1 text-[9px] font-black uppercase tracking-wider text-zinc-300"
          >
            {requirement}
          </span>
        ))}
      </div>
    </article>
  )
}

export default SynergyPanel
