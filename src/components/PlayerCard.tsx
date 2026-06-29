import { useState } from 'react'
import type { Player, Rarity } from '../types/player'
import { getDisplayArchetypeLabel } from '../utils/collectionPresentation'
import {
  getNewSynergiesIfPlayerAdded,
  type Synergy,
  type UniqueSynergy,
} from '../utils/synergies'
import PlayerImage from './PlayerImage'

interface PlayerCardProps {
  player: Player
  onSelect: (player: Player) => void
  comparisonTeam?: Player[]
}

const rarityStyles: Record<Rarity, string> = {
  Common: 'border-zinc-600 bg-zinc-500/10 text-zinc-300',
  Rare: 'border-blue-500 bg-blue-500/10 text-blue-300',
  Epic: 'border-violet-500 bg-violet-500/10 text-violet-300',
  Legendary: 'border-amber-400 bg-amber-400/10 text-amber-300',
  Egoist: 'border-rose-500 bg-rose-500/10 text-rose-300',
}

const rarityGlowStyles: Record<Rarity, string> = {
  Common: 'hover:shadow-[0_14px_38px_rgba(113,113,122,0.2)]',
  Rare: 'hover:shadow-[0_14px_42px_rgba(59,130,246,0.24)]',
  Epic: 'hover:shadow-[0_14px_42px_rgba(139,92,246,0.26)]',
  Legendary: 'hover:shadow-[0_14px_44px_rgba(251,191,36,0.24)]',
  Egoist: 'hover:shadow-[0_14px_44px_rgba(244,63,94,0.24)]',
}

const synergyPreviewStyles = {
  archetype: {
    card: 'border-sky-400/25 bg-sky-400/[0.06]',
    badge: 'border-sky-300/30 bg-sky-300/10 text-sky-200',
  },
  unique: {
    card: 'border-amber-300/35 bg-amber-300/[0.08]',
    badge: 'border-amber-200/40 bg-amber-200/10 text-amber-200',
  },
} as const

function getChoiceSynergyPreview(team: Player[] | undefined, player: Player) {
  if (!team) {
    return undefined
  }

  return getNewSynergiesIfPlayerAdded(team, player)
}

function PlayerCard({
  player,
  onSelect,
  comparisonTeam,
}: PlayerCardProps) {
  const [isConfirming, setIsConfirming] = useState(false)
  const synergyPreview = getChoiceSynergyPreview(comparisonTeam, player)

  function handleSelect() {
    if (isConfirming) {
      return
    }

    setIsConfirming(true)
    window.setTimeout(() => onSelect(player), 180)
  }

  return (
    <button
      type="button"
      onClick={handleSelect}
      disabled={isConfirming}
      className={`group relative flex h-full min-h-[21rem] w-full flex-col overflow-hidden border border-white/10 bg-white/[0.04] text-left shadow-lg transition-[box-shadow,border-color,background-color] duration-200 ease-out hover:border-blue-500/70 hover:bg-blue-500/[0.07] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-400 disabled:cursor-default ${rarityGlowStyles[player.rarity]} ${
        isConfirming
          ? 'border-white/50 bg-white/[0.08] shadow-[0_0_36px_rgba(255,255,255,0.2)]'
          : ''
      }`}
      aria-label={`Escolher ${player.name}`}
    >
      <span
        className={`pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.24),transparent_58%)] opacity-0 transition-opacity duration-200 ${
          isConfirming ? 'opacity-100' : ''
        }`}
        aria-hidden="true"
      />
      <div className="relative shrink-0 border-b border-white/10">
        <div className="flex h-40 w-full items-center justify-center bg-black sm:h-44">
          <PlayerImage player={player} className="h-40 w-full sm:h-44" />
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#080b12] to-transparent"
          aria-hidden="true"
        />
        <span
          className={`absolute right-3 top-3 z-10 border px-2 py-1 text-[9px] font-black uppercase tracking-wider ${rarityStyles[player.rarity]}`}
        >
          {player.rarity}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-3.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-400">
          {player.position}
        </p>
        <h2 className="mt-1.5 text-lg font-black uppercase italic text-white">
          {player.name}
        </h2>

        {(player.trait || player.archetypes?.length) && (
          <div className="mt-2.5 border border-white/10 bg-black/25 p-2.5">
            {player.trait && (
              <>
                <p className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                  {player.trait.name}
                </p>
                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-zinc-400">
                  {player.trait.description}
                </p>
              </>
            )}
            {player.archetypes && player.archetypes.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {player.archetypes.map((archetype) => (
                  <span
                    key={archetype}
                    className="border border-blue-400/25 bg-blue-400/10 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-blue-200"
                  >
                    {getDisplayArchetypeLabel(archetype)}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {synergyPreview && (
          <div className="mt-auto border border-cyan-300/15 bg-cyan-300/[0.04] p-2.5">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-cyan-300">
              Sinergias ativadas ao escolher
            </p>
            <SynergyPreviewList
              archetypeSynergies={synergyPreview.archetypeSynergies}
              uniqueSynergies={synergyPreview.uniqueSynergies}
            />
          </div>
        )}
      </div>
    </button>
  )
}

function SynergyPreviewList({
  archetypeSynergies,
  uniqueSynergies,
}: {
  archetypeSynergies: Synergy[]
  uniqueSynergies: UniqueSynergy[]
}) {
  const hasNewSynergies =
    archetypeSynergies.length > 0 || uniqueSynergies.length > 0

  if (!hasNewSynergies) {
    return (
      <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
        Nenhuma nova sinergia.
      </p>
    )
  }

  return (
    <div className="mt-2 grid gap-1.5">
      {archetypeSynergies.map((synergy) => (
        <SynergyPreviewItem
          key={synergy.id}
          synergy={synergy}
          typeLabel="Arquetipo"
          type="archetype"
        />
      ))}
      {uniqueSynergies.map((synergy) => (
        <SynergyPreviewItem
          key={synergy.id}
          synergy={synergy}
          typeLabel="Unica"
          type="unique"
        />
      ))}
    </div>
  )
}

function SynergyPreviewItem({
  synergy,
  typeLabel,
  type,
}: {
  synergy: Synergy | UniqueSynergy
  typeLabel: string
  type: keyof typeof synergyPreviewStyles
}) {
  const styles = synergyPreviewStyles[type]

  return (
    <article className={`border p-2 ${styles.card}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[11px] font-black uppercase italic text-white">
          {synergy.name}
        </h3>
        <span
          className={`border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider ${styles.badge}`}
        >
          {typeLabel}
        </span>
      </div>
      <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-zinc-400">
        {synergy.description}
      </p>
    </article>
  )
}

export default PlayerCard
