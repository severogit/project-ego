import type { Player } from '../types/player'
import {
  getActiveSynergies,
  getActiveUniqueSynergies,
  type Synergy,
  type UniqueSynergy,
} from '../utils/synergies'
import Icon from './Icon'

interface SynergyPanelProps {
  team: Player[]
  title?: string
}

const synergyTypeStyles = {
  archetype: {
    label: 'Arquetipo',
    groupTitle: 'Sinergias de Arquetipo',
    accent: 'text-sky-300',
    card: 'border-sky-400/25 bg-sky-400/[0.06]',
    badge: 'border-sky-300/30 bg-sky-300/10 text-sky-200',
    requirement: 'border-sky-300/20 bg-sky-300/[0.08] text-sky-100',
  },
  unique: {
    label: 'Unica',
    groupTitle: 'Sinergias Unicas',
    accent: 'text-amber-300',
    card: 'border-amber-300/35 bg-amber-300/[0.08]',
    badge: 'border-amber-200/40 bg-amber-200/10 text-amber-200',
    requirement: 'border-amber-200/25 bg-amber-200/[0.08] text-amber-100',
  },
} as const

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
        <h3
          className={`flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.18em] ${
            totalSynergies > 0 ? 'text-blue-300' : 'text-zinc-500'
          }`}
        >
          {totalSynergies > 0 && (
            <Icon name="network" className="h-3.5 w-3.5 text-blue-300" />
          )}
          {title}
        </h3>
        <span
          className={`text-[10px] font-black uppercase tracking-wider ${
            totalSynergies > 0 ? 'text-blue-300' : 'text-zinc-600'
          }`}
        >
          {totalSynergies}
        </span>
      </div>

      {totalSynergies === 0 ? (
        <p className="mt-2 text-xs text-zinc-600">
          Nenhuma sinergia ativa.
        </p>
      ) : (
        <div className="mt-3 grid gap-3">
          <SynergyGroup
            synergies={archetypeSynergies}
            type="archetype"
          />
          <SynergyGroup
            synergies={uniqueSynergies}
            type="unique"
          />
        </div>
      )}
    </section>
  )
}

function SynergyGroup({
  synergies,
  type,
}: {
  synergies: Array<Synergy | UniqueSynergy>
  type: 'archetype' | 'unique'
}) {
  const styles = synergyTypeStyles[type]

  return (
    <div>
      <p
        className={`text-[9px] font-black uppercase tracking-[0.16em] ${styles.accent}`}
      >
        {styles.groupTitle}
      </p>
      {synergies.length === 0 ? (
        <p className="mt-1.5 text-[11px] text-zinc-700">Nenhuma ativa.</p>
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
  const styles = synergyTypeStyles[type]

  return (
    <article className={`border p-2.5 ${styles.card}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h4 className="flex items-center gap-1.5 text-xs font-black uppercase italic text-white">
          <Icon name="network" className="h-3 w-3 shrink-0 text-blue-300" />
          {synergy.name}
        </h4>
        <span
          className={`border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider ${styles.badge}`}
        >
          {styles.label}
        </span>
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">
        {synergy.description}
      </p>
      <div className="mt-2 flex flex-wrap gap-1">
        {requirements.map((requirement) => (
          <span
            key={requirement}
            className={`border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider ${styles.requirement}`}
          >
            {requirement}
          </span>
        ))}
      </div>
    </article>
  )
}

export default SynergyPanel
