import type { Player, Rarity } from '../types/player'
import { getDisplayArchetypeLabel } from '../utils/collectionPresentation'
import PlayerImage from './PlayerImage'
import SynergyPanel from './SynergyPanel'

interface TeamStatusPanelProps {
  team: Player[]
  maxTeamSize: number
  title?: string
}

const rarityMiniStyles: Record<Rarity, string> = {
  Common: 'border-zinc-500/30 text-zinc-300',
  Rare: 'border-blue-400/35 text-blue-300',
  Epic: 'border-violet-400/35 text-violet-300',
  Legendary: 'border-amber-300/40 text-amber-300',
  Egoist: 'border-rose-400/40 text-rose-300',
}

function getTeamArchetypes(team: Player[]): string[] {
  return [...new Set(team.flatMap((player) => player.archetypes ?? []))]
    .sort((firstArchetype, secondArchetype) =>
      firstArchetype.localeCompare(secondArchetype),
    )
    .slice(0, 8)
}

function TeamStatusPanel({
  team,
  maxTeamSize,
  title = 'Time atual',
}: TeamStatusPanelProps) {
  const teamArchetypes = getTeamArchetypes(team)
  const emptySlots = Array.from({
    length: Math.max(0, maxTeamSize - team.length),
  })

  return (
    <aside className="border border-white/10 bg-black/35 p-3.5 shadow-[0_14px_48px_rgba(2,6,23,0.24)]">
      <div>
        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-400">
          {title}
        </span>
        <h2 className="mt-1 text-lg font-black uppercase italic text-white">
          {team.length}/{maxTeamSize} egoistas
        </h2>
      </div>

      <div className="mt-3">
        <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
          Jogadores
        </p>
        <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          {team.map((player) => (
            <article
              key={player.id}
              className="grid min-h-12 grid-cols-[2.25rem_1fr] items-center gap-2 border border-blue-500/25 bg-blue-500/10 p-1.5"
            >
              <PlayerImage player={player} className="h-9 w-9" />
              <div className="min-w-0">
                <p className="truncate text-[11px] font-black uppercase italic text-white">
                  {player.name}
                </p>
                <div className="mt-0.5 flex min-w-0 flex-wrap gap-1">
                  <span
                    className={`inline-block border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider ${rarityMiniStyles[player.rarity]}`}
                  >
                    {player.rarity}
                  </span>
                  <span className="inline-block border border-white/10 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-zinc-500">
                    {player.position}
                  </span>
                </div>
              </div>
            </article>
          ))}
          {emptySlots.map((_, index) => (
            <div
              key={`empty-${index}`}
              className="flex h-12 items-center justify-center border border-white/5 bg-white/[0.025] text-[9px] font-black uppercase tracking-wider text-zinc-700"
            >
              Vaga
            </div>
          ))}
        </div>

        {teamArchetypes.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {teamArchetypes.map((archetype) => (
              <span
                key={archetype}
                className="border border-blue-400/25 bg-blue-400/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-blue-200"
              >
                {getDisplayArchetypeLabel(archetype)}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 border-t border-white/10 pt-4">
        <SynergyPanel team={team} />
      </div>
    </aside>
  )
}

export default TeamStatusPanel
