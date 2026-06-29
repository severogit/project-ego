import { Link } from 'react-router-dom'
import type { MatchResult } from '../types/match'
import type { Player } from '../types/player'
import {
  getCampaignStats,
  type CampaignPlayerSummary,
} from '../utils/campaignStats'
import Icon from './Icon'
import PlayerImage from './PlayerImage'

interface WorldFiveChampionScreenProps {
  team: Player[]
  campaignResults: MatchResult[]
  onRestart: () => void
}

const championParticles = [
  { left: '8%', top: '16%', delay: '0s' },
  { left: '18%', top: '48%', delay: '0.4s' },
  { left: '30%', top: '22%', delay: '0.8s' },
  { left: '44%', top: '12%', delay: '1.1s' },
  { left: '58%', top: '36%', delay: '0.2s' },
  { left: '68%', top: '18%', delay: '0.6s' },
  { left: '78%', top: '50%', delay: '1s' },
  { left: '90%', top: '24%', delay: '0.5s' },
]

function formatInteger(value: number): string {
  return value.toLocaleString('pt-BR')
}

function getHighlightName(summary?: CampaignPlayerSummary): string {
  return summary?.player.name ?? 'Sem dados'
}

function getHighlightDetail(
  summary: CampaignPlayerSummary | undefined,
  value: string,
): string {
  return summary ? value : 'Sem estatisticas registradas'
}

interface StatItemProps {
  label: string
  value: number
  tag: string
}

function StatItem({ label, value, tag }: StatItemProps) {
  return (
    <div className="flex items-center justify-between gap-4 border border-white/10 bg-white/[0.035] px-4 py-3">
      <div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">
          {tag}
        </span>
        <p className="mt-1 text-sm font-bold uppercase tracking-[0.08em] text-zinc-300">
          {label}
        </p>
      </div>
      <strong className="text-3xl font-black italic text-white">
        {formatInteger(value)}
      </strong>
    </div>
  )
}

interface HighlightItemProps {
  tag: string
  title: string
  summary?: CampaignPlayerSummary
  detail: string
}

function HighlightItem({ tag, title, summary, detail }: HighlightItemProps) {
  return (
    <div className="border-l border-blue-300/40 bg-blue-400/[0.04] px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-200">
          {tag}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
          {title}
        </span>
      </div>
      <p className="mt-2 truncate text-lg font-black uppercase italic text-white">
        {getHighlightName(summary)}
      </p>
      <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-blue-200/80">
        {detail}
      </p>
    </div>
  )
}

function WorldFiveChampionScreen({
  team,
  campaignResults,
  onRestart,
}: WorldFiveChampionScreenProps) {
  const campaignStats = getCampaignStats(campaignResults)
  const { totals, highlights } = campaignStats
  const mvpDetail = getHighlightDetail(
    highlights.mvp,
    'Maior impacto geral',
  )
  const topScorerDetail = getHighlightDetail(
    highlights.topScorer,
    `${formatInteger(highlights.topScorer?.goals ?? 0)} gols`,
  )
  const topAssistantDetail = getHighlightDetail(
    highlights.topAssistant,
    `${formatInteger(highlights.topAssistant?.assists ?? 0)} assistencias`,
  )
  const defensiveWallDetail = getHighlightDetail(
    highlights.defensiveWall,
    `${formatInteger(highlights.defensiveWall?.defensiveActions ?? 0)} acoes defensivas`,
  )

  return (
    <section className="relative z-10 mx-auto w-full max-w-6xl overflow-hidden pb-4">
      <div
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute left-1/2 top-0 h-72 w-[34rem] -translate-x-1/2 bg-blue-500/20 blur-[100px]" />
        <div className="absolute left-1/2 top-24 h-64 w-[24rem] -translate-x-1/2 bg-amber-300/10 blur-[120px]" />
        <div className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_center,rgba(96,165,250,0.14),transparent_62%)]" />
        {championParticles.map((particle) => (
          <span
            key={`${particle.left}-${particle.top}`}
            className="absolute h-1 w-1 animate-pulse bg-blue-200/60 shadow-[0_0_14px_rgba(147,197,253,0.85)]"
            style={{
              left: particle.left,
              top: particle.top,
              animationDelay: particle.delay,
            }}
          />
        ))}
      </div>

      <header className="mx-auto max-w-3xl pt-2 text-center">
        <div className="inline-flex items-center gap-3 border border-amber-200/30 bg-amber-300/[0.08] px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-amber-100 shadow-[0_0_26px_rgba(251,191,36,0.12)]">
          <Icon name="trophy" className="h-4 w-4 text-amber-100" />
          Campeao consagrado
        </div>
        <p className="mt-5 text-xs font-black uppercase tracking-[0.32em] text-blue-300">
          World Five derrotado
        </p>
        <h1 className="mt-3 text-4xl font-black uppercase italic tracking-tight text-blue-50 drop-shadow-[0_0_22px_rgba(96,165,250,0.55)] sm:text-6xl">
          Campeao do World 5 Challenge
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm font-semibold uppercase tracking-[0.14em] text-zinc-300 sm:text-base">
          Seu ego provou seu valor. Voce conquistou o topo.
        </p>
      </header>

      <section className="mt-9">
        <div className="text-center">
          <h2 className="text-sm font-black uppercase tracking-[0.28em] text-blue-200">
            Time campeao
          </h2>
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">
            O elenco responsavel pela conquista
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {team.map((player) => (
            <article
              key={player.id}
              className="overflow-hidden border border-blue-200/30 bg-blue-400/[0.07] shadow-[0_0_28px_rgba(59,130,246,0.12)] ring-1 ring-amber-200/10"
            >
              <PlayerImage player={player} className="h-36 sm:h-44" />
              <div className="border-t border-white/10 p-3">
                <h3 className="truncate text-sm font-black uppercase italic text-white">
                  {player.name}
                </h3>
                <p className="mt-1 truncate text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">
                  {player.position}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <article className="border border-white/10 bg-white/[0.045] p-5">
          <h2 className="text-sm font-black uppercase tracking-[0.22em] text-zinc-200">
            Resumo da campanha
          </h2>
          <div className="mt-4 grid gap-3">
            <StatItem label="Gols marcados" tag="Gol" value={totals.goals} />
            <StatItem
              label="Assistencias"
              tag="Ast"
              value={totals.assists}
            />
            <StatItem
              label="Acoes defensivas"
              tag="Def"
              value={totals.defensiveActions}
            />
            <StatItem
              label="Flows ativados"
              tag="Flow"
              value={totals.flowActivations}
            />
          </div>
        </article>

        <article className="border border-white/10 bg-white/[0.045] p-5">
          <h2 className="text-sm font-black uppercase tracking-[0.22em] text-zinc-200">
            Destaques
          </h2>
          <div className="mt-4 grid gap-3">
            <HighlightItem
              tag="MVP"
              title="Maior impacto"
              summary={highlights.mvp}
              detail={mvpDetail}
            />
            <HighlightItem
              tag="Gol"
              title="Artilheiro"
              summary={highlights.topScorer}
              detail={topScorerDetail}
            />
            <HighlightItem
              tag="Ast"
              title="Lider em assistencias"
              summary={highlights.topAssistant}
              detail={topAssistantDetail}
            />
            <HighlightItem
              tag="Def"
              title="Muralha"
              summary={highlights.defensiveWall}
              detail={defensiveWallDetail}
            />
          </div>
        </article>
      </div>

      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex w-full items-center justify-center gap-3 bg-blue-600 px-5 py-4 text-xs font-black uppercase tracking-[0.1em] text-white shadow-[0_0_24px_rgba(37,99,235,0.28)] transition hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-400 sm:w-auto sm:px-8 sm:text-sm sm:tracking-[0.14em]"
        >
          <span
            className="h-0 w-0 border-y-[5px] border-l-[8px] border-y-transparent border-l-white"
            aria-hidden="true"
          />
          Nova Campanha
        </button>
        <Link
          to="/game-modes"
          className="inline-flex w-full items-center justify-center border border-white/15 bg-white/[0.04] px-5 py-4 text-xs font-black uppercase tracking-[0.1em] text-zinc-200 transition hover:border-blue-300/50 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-400 sm:w-auto sm:px-8 sm:text-sm sm:tracking-[0.14em]"
        >
          Voltar aos Modos de Jogo
        </Link>
      </div>
    </section>
  )
}

export default WorldFiveChampionScreen
