import type { CampaignVictory } from '../types/game'
import type { Player } from '../types/player'
import { calculateTeamPower } from '../utils/draft'
import PlayerImage from './PlayerImage'

interface ChampionScreenProps {
  team: Player[]
  campaign: CampaignVictory[]
  onRestart: () => void
}

const campaignLabels: Record<CampaignVictory, string> = {
  'match-3v3': 'Vitória 3x3',
  'match-4v4': 'Vitória 4x4',
  'knockout-quarter': 'Vitória Quartas',
  'knockout-semi': 'Vitória Semifinal',
  'knockout-final': 'Vitória Final',
}

function ChampionScreen({
  team,
  campaign,
  onRestart,
}: ChampionScreenProps) {
  return (
    <section className="relative z-10 mx-auto w-full max-w-5xl">
      <header className="text-center">
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-amber-300">
          Campanha perfeita
        </span>
        <h1 className="mt-3 text-4xl font-black uppercase italic tracking-tight text-amber-100 sm:text-6xl">
          Campeão do Project Ego
        </h1>
        <p className="mt-4 text-zinc-400">
          Seu time sobreviveu a todas as fases do projeto.
        </p>
      </header>

      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {team.map((player) => (
          <article
            key={player.id}
            className="overflow-hidden border border-amber-400/30 bg-amber-400/[0.06]"
          >
            <PlayerImage player={player} className="h-36 sm:h-44" />
            <div className="p-3">
              <h2 className="truncate text-sm font-black uppercase italic">
                {player.name}
              </h2>
              <p className="mt-1 truncate text-xs text-zinc-500">
                {player.position}
              </p>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-7 grid gap-5 md:grid-cols-2">
        <article className="flex flex-col items-center justify-center border border-amber-400/30 bg-amber-400/10 p-7 text-center">
          <span className="text-xs font-black uppercase tracking-[0.22em] text-amber-300">
            Poder do time campeão
          </span>
          <strong className="mt-3 text-6xl font-black italic text-white">
            {calculateTeamPower(team)}
          </strong>
        </article>

        <article className="border border-white/10 bg-white/[0.04] p-7">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-300">
            Campanha
          </h2>
          <ol className="mt-5 space-y-3">
            {campaign.map((victory, index) => (
              <li
                key={victory}
                className="flex items-center gap-3 text-sm text-zinc-300"
              >
                <span className="flex h-6 w-6 items-center justify-center bg-emerald-500/15 text-xs font-black text-emerald-400">
                  {index + 1}
                </span>
                {campaignLabels[victory]}
              </li>
            ))}
          </ol>
        </article>
      </div>

      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={onRestart}
          className="bg-amber-500 px-8 py-4 text-sm font-black uppercase tracking-[0.14em] text-black transition hover:bg-amber-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300"
        >
          Jogar novamente
        </button>
      </div>
    </section>
  )
}

export default ChampionScreen
