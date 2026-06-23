import { useEffect, useRef, useState } from 'react'
import type { Player, Rarity } from '../types/player'
import { drawWeightedPlayers } from '../utils/draft'
import PlayerImage from './PlayerImage'

interface RouletteProps {
  playerPool: Player[]
  finalOptions: Player[]
  onComplete: () => void
}

const PREVIEW_PANEL_COUNT = 9
const ROULETTE_DURATION = 2700

const rarityStyles: Record<Rarity, string> = {
  Common: 'border-zinc-500/60 text-zinc-300',
  Rare: 'border-blue-500/70 text-blue-300',
  Epic: 'border-violet-500/70 text-violet-300',
  Legendary: 'border-amber-400/70 text-amber-300',
  Egoist: 'border-rose-500/70 text-rose-300',
}

function createRoulettePanels(
  playerPool: Player[],
  finalOptions: Player[],
): Player[][] {
  const previewPanels = Array.from({ length: PREVIEW_PANEL_COUNT }, () =>
    drawWeightedPlayers(playerPool, finalOptions.length),
  )

  return [...previewPanels, finalOptions]
}

function Roulette({
  playerPool,
  finalOptions,
  onComplete,
}: RouletteProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [roulettePanels] = useState(() =>
    createRoulettePanels(playerPool, finalOptions),
  )

  useEffect(() => {
    const track = trackRef.current

    if (!track) {
      return
    }

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    const destination = (roulettePanels.length - 1) * 100
    const animation = track.animate(
      [
        { transform: 'translate3d(0, 0, 0)' },
        { transform: `translate3d(-${destination}%, 0, 0)` },
      ],
      {
        duration: prefersReducedMotion ? 350 : ROULETTE_DURATION,
        easing: 'cubic-bezier(0.08, 0.72, 0.12, 1)',
        fill: 'forwards',
      },
    )

    animation.onfinish = onComplete

    return () => {
      animation.onfinish = null
      animation.cancel()
    }
  }, [onComplete, roulettePanels.length])

  return (
    <section
      className="mx-auto mt-10 w-full max-w-6xl"
      aria-label="Roleta de jogadores em andamento"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="mb-5 flex items-center justify-center gap-3">
        <span className="h-2 w-2 animate-pulse rounded-full bg-blue-400 shadow-[0_0_14px_rgba(96,165,250,0.9)]" />
        <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-300">
          Analisando egoístas
        </p>
      </div>

      <div className="relative overflow-hidden border-y border-blue-500/30 bg-black/40 py-6 shadow-[0_0_70px_rgba(37,99,235,0.12)] sm:py-8">
        <div
          className="pointer-events-none absolute inset-y-0 left-1/2 z-20 w-px -translate-x-1/2 bg-blue-300 shadow-[0_0_18px_3px_rgba(96,165,250,0.75)]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-28 -translate-x-1/2 bg-blue-500/5 blur-xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[#05070b] to-transparent sm:w-40"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[#05070b] to-transparent sm:w-40"
          aria-hidden="true"
        />

        <div ref={trackRef} className="flex w-full will-change-transform">
          {roulettePanels.map((panel, panelIndex) => (
            <div
              key={panelIndex}
              className="grid w-full shrink-0 grid-cols-3 gap-2 px-4 sm:gap-4 sm:px-10"
            >
              {panel.map((player) => (
                <article
                  key={`${panelIndex}-${player.id}`}
                  className={`relative min-h-36 overflow-hidden border bg-gradient-to-br from-zinc-900 to-[#08152c] sm:min-h-48 ${rarityStyles[player.rarity]}`}
                >
                  <div className="absolute inset-0">
                    <PlayerImage
                      player={player}
                      eager
                      className="h-full w-full"
                      imageClassName="opacity-90"
                    />
                  </div>
                  <div
                    className="absolute left-1/2 top-1/3 h-20 w-20 -translate-x-1/2 rounded-full bg-current opacity-10 blur-2xl"
                    aria-hidden="true"
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/10"
                    aria-hidden="true"
                  />
                  <span className="absolute right-2 top-2 z-10 text-[8px] font-black uppercase tracking-wider drop-shadow-md sm:right-3 sm:top-3 sm:text-[10px]">
                    {player.rarity}
                  </span>
                  <div className="absolute inset-x-0 bottom-0 z-10 p-3 sm:p-5">
                    <p className="truncate text-xs font-black uppercase italic text-white drop-shadow-md sm:text-lg">
                      {player.name}
                    </p>
                    <p className="mt-1 truncate text-[9px] uppercase tracking-wider text-zinc-400 sm:text-xs">
                      {player.position}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          ))}
        </div>
      </div>

      <p className="mt-5 text-center text-xs uppercase tracking-[0.18em] text-zinc-600">
        Aguarde a revelação das opções
      </p>
    </section>
  )
}

export default Roulette
