import type { Player } from '../types/player'
import {
  calculateAttributeAverages,
  calculateTeamPower,
  playerAttributes,
  type PlayerAttribute,
} from '../utils/draft'
import SynergyPanel from './SynergyPanel'

interface TeamStatusPanelProps {
  team: Player[]
  maxTeamSize: number
  title?: string
}

const attributeLabels: Record<PlayerAttribute, string> = {
  attack: 'Ataque',
  speed: 'Veloc.',
  vision: 'Visao',
  dribble: 'Drible',
  defense: 'Defesa',
  ego: 'Ego',
}

function getTeamProfile(
  averages: Record<PlayerAttribute, number>,
): Array<{ label: string; tone: string }> {
  const profile: Array<{ label: string; tone: string }> = []
  const creationAverage = (averages.vision + averages.dribble) / 2

  if (averages.attack >= 88) {
    profile.push({
      label: 'Ataque forte',
      tone: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
    })
  } else if (averages.attack > 0 && averages.attack < 80) {
    profile.push({
      label: 'Ataque baixo',
      tone: 'border-rose-400/30 bg-rose-400/10 text-rose-300',
    })
  }

  if (averages.defense >= 85) {
    profile.push({
      label: 'Defesa solida',
      tone: 'border-blue-400/30 bg-blue-400/10 text-blue-300',
    })
  } else if (averages.defense > 0 && averages.defense < 75) {
    profile.push({
      label: 'Defesa fraca',
      tone: 'border-rose-400/30 bg-rose-400/10 text-rose-300',
    })
  }

  if (averages.vision >= 88) {
    profile.push({
      label: 'Alta visao',
      tone: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300',
    })
  }

  if (averages.speed >= 90) {
    profile.push({
      label: 'Velocidade alta',
      tone: 'border-sky-400/30 bg-sky-400/10 text-sky-300',
    })
  }

  if (averages.ego >= 90) {
    profile.push({
      label: 'Muito ego',
      tone: 'border-amber-300/30 bg-amber-300/10 text-amber-300',
    })
  }

  if (creationAverage > 0 && creationAverage < 80) {
    profile.push({
      label: 'Pouca criacao',
      tone: 'border-orange-400/30 bg-orange-400/10 text-orange-300',
    })
  }

  return profile.length > 0
    ? profile.slice(0, 4)
    : [
        {
          label: teamIsEmpty(averages) ? 'Time vazio' : 'Time equilibrado',
          tone: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-300',
        },
      ]
}

function teamIsEmpty(averages: Record<PlayerAttribute, number>): boolean {
  return playerAttributes.every((attribute) => averages[attribute] === 0)
}

function TeamStatusPanel({
  team,
  maxTeamSize,
  title = 'Time atual',
}: TeamStatusPanelProps) {
  const averages = calculateAttributeAverages(team)
  const profile = getTeamProfile(averages)

  return (
    <aside className="border border-white/10 bg-black/35 p-5 shadow-[0_18px_70px_rgba(2,6,23,0.28)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-400">
            {title}
          </span>
          <h2 className="mt-2 text-xl font-black uppercase italic text-white">
            {team.length}/{maxTeamSize} egoistas
          </h2>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
            Poder
          </span>
          <strong className="block text-3xl font-black italic text-blue-300">
            {calculateTeamPower(team)}
          </strong>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-zinc-500">
            Jogadores
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {team.length > 0 ? (
              team.map((player) => (
                <span
                  key={player.id}
                  className="border border-blue-500/25 bg-blue-500/10 px-3 py-2 text-xs font-bold text-zinc-200"
                >
                  {player.name}
                </span>
              ))
            ) : (
              <span className="text-sm text-zinc-600">
                Nenhum jogador escolhido.
              </span>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {profile.map((item) => (
              <span
                key={item.label}
                className={`border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${item.tone}`}
              >
                {item.label}
              </span>
            ))}
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {playerAttributes.map((attribute) => (
            <div
              key={attribute}
              className="border border-white/5 bg-white/[0.03] px-3 py-2"
            >
              <dt className="text-[10px] uppercase tracking-wider text-zinc-500">
                {attributeLabels[attribute]}
              </dt>
              <dd className="mt-1 text-lg font-black text-white">
                {averages[attribute].toFixed(1)}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-5 border-t border-white/10 pt-5">
        <SynergyPanel team={team} />
      </div>
    </aside>
  )
}

export default TeamStatusPanel
