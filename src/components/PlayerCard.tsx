import type { Player, Rarity } from '../types/player'
import {
  calculateChoiceImpact,
  calculatePlayerPower,
  playerAttributes,
  type PlayerAttribute,
} from '../utils/draft'
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

const attributeLabels: Record<PlayerAttribute, string> = {
  attack: 'Ataque',
  speed: 'Velocidade',
  vision: 'Visao',
  dribble: 'Drible',
  defense: 'Defesa',
  ego: 'Ego',
}

const impactAttributes: PlayerAttribute[] = ['attack', 'vision', 'defense']

function getChoiceImpact(team: Player[] | undefined, player: Player) {
  if (!team || team.length === 0) {
    return []
  }

  return calculateChoiceImpact(team, player, impactAttributes).map(
    (impact) => ({
      ...impact,
      label: attributeLabels[impact.attribute],
    }),
  )
}

function formatImpact(value: number): string {
  return value > 0 ? `+${value}` : `${value}`
}

function getImpactTone(value: number): string {
  if (value > 0) {
    return 'text-emerald-300'
  }

  return 'text-zinc-500'
}

function PlayerCard({
  player,
  onSelect,
  comparisonTeam,
}: PlayerCardProps) {
  const choiceImpact = getChoiceImpact(comparisonTeam, player)

  return (
    <button
      type="button"
      onClick={() => onSelect(player)}
      className="group flex h-full w-full flex-col overflow-hidden border border-white/10 bg-white/[0.04] text-left shadow-xl transition duration-300 hover:-translate-y-2 hover:border-blue-500/70 hover:bg-blue-500/[0.07] hover:shadow-[0_18px_60px_rgba(37,99,235,0.18)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-400"
      aria-label={`Escolher ${player.name}`}
    >
      <div className="relative border-b border-white/10">
        <div className="flex h-64 w-full items-center justify-center bg-black">
          <PlayerImage
            player={player}
            className="h-64 w-full transition duration-300 group-hover:scale-[1.02]"
          />
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#080b12] to-transparent"
          aria-hidden="true"
        />
        <span
          className={`absolute right-4 top-4 z-10 border px-2 py-1 text-[10px] font-black uppercase tracking-widest backdrop-blur-sm ${rarityStyles[player.rarity]}`}
        >
          {player.rarity}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-400">
          {player.position}
        </p>
        <h2 className="mt-2 text-2xl font-black uppercase italic tracking-tight text-white">
          {player.name}
        </h2>

        {(player.trait || player.archetypes?.length) && (
          <div className="mt-4 border border-white/10 bg-black/25 p-3">
            {player.trait && (
              <>
                <p className="text-xs font-black uppercase tracking-wider text-amber-300">
                  {player.trait.name}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                  {player.trait.description}
                </p>
              </>
            )}
            {player.archetypes && player.archetypes.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {player.archetypes.map((archetype) => (
                  <span
                    key={archetype}
                    className="border border-blue-400/25 bg-blue-400/10 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-blue-200"
                  >
                    {archetype}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-3">
          {playerAttributes.map((attribute) => (
            <div
              key={attribute}
              className="flex items-center justify-between gap-3 border-b border-white/5 pb-2"
            >
              <dt className="text-xs text-zinc-500">
                {attributeLabels[attribute]}
              </dt>
              <dd className="text-sm font-bold text-zinc-200">
                {player[attribute]}
              </dd>
            </div>
          ))}
        </dl>

        {choiceImpact.length > 0 && (
          <div className="mt-5 border border-emerald-400/15 bg-emerald-400/[0.04] p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">
              Contribuicao ao time
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {choiceImpact.map((impact) => (
                <div key={impact.attribute}>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                    {impact.label}
                  </p>
                  <p
                    className={`mt-1 text-sm font-black ${getImpactTone(
                      impact.value,
                    )}`}
                  >
                    {formatImpact(impact.value)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
            Poder
          </span>
          <strong className="text-xl text-blue-300">
            {calculatePlayerPower(player)}
          </strong>
        </div>
      </div>
    </button>
  )
}

export default PlayerCard
