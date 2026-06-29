import { useEffect, useMemo, useRef, useState } from 'react'
import Icon, { type IconName } from '../components/Icon'
import PlayerImage from '../components/PlayerImage'
import { players } from '../data/players'
import type { Player, Rarity } from '../types/player'
import {
  COLLECTION_RARITY_ORDER,
  getDisplayArchetypeLabel,
  getFlowPresentation,
  getPlayerIdentityDescription,
  getPlayerRelatedSynergies,
  sortPlayersForCollection,
  type FlowPresentation,
  type PlayerRelatedSynergies,
} from '../utils/collectionPresentation'
import {
  SYNERGY_DEFINITIONS,
  UNIQUE_SYNERGY_DEFINITIONS,
  type Synergy,
  type TeamSynergy,
  type UniqueSynergy,
} from '../utils/synergies'

type ModalType = 'traits' | 'synergies' | null

interface CollectionEntry {
  player: Player
}

interface TraitGroup {
  name: string
  description: string
  players: Player[]
}

const orderedPlayers = sortPlayersForCollection(players)

const rarityStyles: Record<
  Rarity,
  {
    badge: string
    card: string
    glow: string
    accent: string
    panel: string
  }
> = {
  Common: {
    badge:
      'border-zinc-300/55 text-zinc-100 shadow-[0_0_16px_rgba(212,212,216,0.12)]',
    card: 'border-zinc-400/35',
    glow: 'hover:shadow-[0_18px_42px_rgba(161,161,170,0.22)]',
    accent: 'bg-zinc-200',
    panel: 'border-zinc-300/30 bg-zinc-300/[0.055]',
  },
  Rare: {
    badge:
      'border-blue-300/70 text-blue-100 shadow-[0_0_18px_rgba(96,165,250,0.22)]',
    card: 'border-blue-300/40',
    glow: 'hover:shadow-[0_18px_44px_rgba(59,130,246,0.3)]',
    accent: 'bg-blue-200',
    panel: 'border-blue-300/30 bg-blue-300/[0.065]',
  },
  Epic: {
    badge:
      'border-violet-300/70 text-violet-100 shadow-[0_0_18px_rgba(167,139,250,0.22)]',
    card: 'border-violet-300/40',
    glow: 'hover:shadow-[0_18px_44px_rgba(139,92,246,0.3)]',
    accent: 'bg-violet-200',
    panel: 'border-violet-300/30 bg-violet-300/[0.065]',
  },
  Legendary: {
    badge:
      'border-amber-200/80 text-amber-100 shadow-[0_0_20px_rgba(251,191,36,0.26)]',
    card: 'border-amber-200/45',
    glow: 'hover:shadow-[0_18px_46px_rgba(251,191,36,0.28)]',
    accent: 'bg-amber-100',
    panel: 'border-amber-200/35 bg-amber-200/[0.07]',
  },
  Egoist: {
    badge:
      'border-rose-300/75 text-rose-100 shadow-[0_0_20px_rgba(244,63,94,0.28)]',
    card: 'border-rose-300/45',
    glow: 'hover:shadow-[0_18px_46px_rgba(244,63,94,0.3)]',
    accent: 'bg-rose-200',
    panel: 'border-rose-300/35 bg-rose-300/[0.07]',
  },
}

const flowTierStyles: Record<FlowPresentation['tier'], string> = {
  'Muito Baixa': 'text-zinc-300',
  Baixa: 'text-blue-200',
  Media: 'text-blue-100',
  Alta: 'text-amber-200',
  'Muito Alta': 'text-amber-100',
}

const flowSegmentStyles: Record<
  FlowPresentation['tier'],
  { filled: string; empty: string }
> = {
  'Muito Baixa': {
    filled: 'border-zinc-300/55 bg-zinc-200/65',
    empty: 'border-zinc-500/25 bg-white/[0.035]',
  },
  Baixa: {
    filled:
      'border-blue-300/60 bg-blue-300/65 shadow-[0_0_14px_rgba(96,165,250,0.18)]',
    empty: 'border-blue-300/15 bg-blue-300/[0.045]',
  },
  Media: {
    filled:
      'border-blue-200/70 bg-blue-300/80 shadow-[0_0_16px_rgba(96,165,250,0.24)]',
    empty: 'border-blue-300/18 bg-blue-300/[0.05]',
  },
  Alta: {
    filled:
      'border-amber-200/70 bg-amber-300/80 shadow-[0_0_16px_rgba(251,191,36,0.24)]',
    empty: 'border-amber-200/18 bg-amber-300/[0.045]',
  },
  'Muito Alta': {
    filled:
      'border-amber-100/80 bg-amber-200 shadow-[0_0_18px_rgba(251,191,36,0.34)]',
    empty: 'border-amber-200/20 bg-amber-300/[0.055]',
  },
}

const flowSegmentCount = 5

const traitIconRules: Array<{ keywords: string[]; icon: IconName }> = [
  {
    keywords: ['king'],
    icon: 'crown',
  },
  {
    keywords: ['vision', 'read', 'tactician'],
    icon: 'eye',
  },
  {
    keywords: ['predator', 'hunter', 'mark'],
    icon: 'crosshair',
  },
  {
    keywords: ['pass', 'passer', 'hotline', 'support', 'link'],
    icon: 'route',
  },
  {
    keywords: ['wall', 'guardian', 'defender', 'survival', 'reflex', 'balance'],
    icon: 'shield',
  },
  {
    keywords: ['dribble', 'touch', 'chameleon', 'control', 'technique', 'creator'],
    icon: 'sparkles',
  },
  {
    keywords: ['speed', 'runner', 'acceleration', 'off-ball', 'panther'],
    icon: 'wind',
  },
  {
    keywords: ['shot', 'striker', 'impact', 'ace', 'sniper'],
    icon: 'target',
  },
  {
    keywords: ['destroyer', 'duelist', 'physique', 'physical', 'body', 'domination', 'power'],
    icon: 'zap',
  },
]

function getTraitIconName(traitName?: string): IconName {
  const normalizedTraitName = traitName?.toLowerCase() ?? ''
  const matchingRule = traitIconRules.find((rule) =>
    rule.keywords.some((keyword) => normalizedTraitName.includes(keyword)),
  )

  return matchingRule?.icon ?? 'sparkles'
}

function getTraitGroups(playerList: Player[]): TraitGroup[] {
  const groups = new Map<string, TraitGroup>()

  playerList.forEach((player) => {
    if (!player.trait) {
      return
    }

    const currentGroup = groups.get(player.trait.name)

    if (currentGroup) {
      currentGroup.players.push(player)
      return
    }

    groups.set(player.trait.name, {
      name: player.trait.name,
      description: player.trait.description,
      players: [player],
    })
  })

  return [...groups.values()].sort((firstGroup, secondGroup) =>
    firstGroup.name.localeCompare(secondGroup.name),
  )
}

function getSynergyRequirements(synergy: TeamSynergy): {
  label: string
  requirements: string[]
} {
  if ('requiredPlayerNames' in synergy) {
    return {
      label: 'Jogadores',
      requirements: synergy.requiredPlayerNames,
    }
  }

  return {
    label: 'Arquetipos',
    requirements: synergy.requiredArchetypes.map(getDisplayArchetypeLabel),
  }
}

function getCollectionNameStyle(name: string): React.CSSProperties {
  const longestWordLength = Math.max(
    ...name.split(' ').map((namePart) => namePart.length),
  )
  const compactSize = name.length > 18 || longestWordLength > 10
  const denseSize = name.length > 24 || longestWordLength > 13

  return {
    fontSize: denseSize ? '0.7rem' : compactSize ? '0.78rem' : '0.875rem',
    lineHeight: denseSize ? '0.92rem' : '1rem',
    overflowWrap: 'anywhere',
  }
}

function getDetailNameStyle(name: string): React.CSSProperties {
  const longestWordLength = Math.max(
    ...name.split(' ').map((namePart) => namePart.length),
  )
  const compactSize = name.length > 18 || longestWordLength > 11

  return {
    fontSize: compactSize ? '1.35rem' : '1.5rem',
    lineHeight: compactSize ? '1.45rem' : '1.5rem',
    overflowWrap: 'anywhere',
  }
}

function CollectionPage() {
  const [search, setSearch] = useState('')
  const [rarityFilter, setRarityFilter] = useState<Rarity | 'all'>('all')
  const [positionFilter, setPositionFilter] = useState('all')
  const [selectedPlayer, setSelectedPlayer] = useState<Player>(
    orderedPlayers[0],
  )
  const [panelPlayer, setPanelPlayer] = useState<Player>(orderedPlayers[0])
  const [isPanelVisible, setIsPanelVisible] = useState(true)
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const panelTransitionRef = useRef<number | undefined>(undefined)

  const collectionEntries = useMemo<CollectionEntry[]>(
    () =>
      orderedPlayers.map((player) => ({
        player,
      })),
    [],
  )

  const positions = useMemo(
    () => [...new Set(players.map((player) => player.position))].sort(),
    [],
  )

  const traitGroups = useMemo(() => getTraitGroups(players), [])

  const filteredEntries = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return collectionEntries.filter(({ player }) => {
      const matchesSearch = player.name
        .toLowerCase()
        .includes(normalizedSearch)
      const matchesRarity =
        rarityFilter === 'all' || player.rarity === rarityFilter
      const matchesPosition =
        positionFilter === 'all' || player.position === positionFilter

      return matchesSearch && matchesRarity && matchesPosition
    })
  }, [collectionEntries, positionFilter, rarityFilter, search])

  const selectedSynergies = useMemo(
    () => getPlayerRelatedSynergies(panelPlayer),
    [panelPlayer],
  )
  const selectedFlow = useMemo(
    () => getFlowPresentation(panelPlayer.flowRate),
    [panelPlayer],
  )

  useEffect(() => {
    if (!activeModal) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setActiveModal(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeModal])

  useEffect(
    () => () => {
      if (panelTransitionRef.current) {
        window.clearTimeout(panelTransitionRef.current)
      }
    },
    [],
  )

  function handleSelectPlayer(player: Player) {
    if (player.id === selectedPlayer.id) {
      return
    }

    if (panelTransitionRef.current) {
      window.clearTimeout(panelTransitionRef.current)
    }

    setSelectedPlayer(player)
    setIsPanelVisible(false)

    panelTransitionRef.current = window.setTimeout(() => {
      setPanelPlayer(player)
      setIsPanelVisible(true)
    }, 90)
  }

  return (
    <main className="min-h-screen bg-[#05070b] px-4 pb-5 pt-24 text-white sm:px-6 lg:px-7">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(59,130,246,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.035)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(180deg,rgba(14,30,58,0.72),rgba(5,7,11,0.18)_34%,rgba(5,7,11,0.92))]" />

      <div className="relative z-10 mx-auto grid w-full max-w-[96rem] gap-4 xl:grid-cols-[17rem_minmax(0,1fr)_24rem]">
        <CollectionFilters
          search={search}
          onSearchChange={setSearch}
          rarityFilter={rarityFilter}
          onRarityFilterChange={setRarityFilter}
          positionFilter={positionFilter}
          onPositionFilterChange={setPositionFilter}
          positions={positions}
          onOpenTraits={() => setActiveModal('traits')}
          onOpenSynergies={() => setActiveModal('synergies')}
        />

        <section className="min-w-0">
          <CollectionHeader
            total={players.length}
            visible={filteredEntries.length}
          />

          {filteredEntries.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))]">
              {filteredEntries.map((entry) => (
                <CollectionPlayerCard
                  key={entry.player.id}
                  entry={entry}
                  selected={entry.player.id === selectedPlayer.id}
                  onSelect={handleSelectPlayer}
                />
              ))}
            </div>
          ) : (
            <div className="mt-4 border border-white/10 bg-white/[0.035] p-8 text-center">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-zinc-300">
                Nenhum jogador encontrado.
              </p>
            </div>
          )}
        </section>

        <PlayerDetailPanel
          player={panelPlayer}
          isVisible={isPanelVisible}
          flow={selectedFlow}
          synergies={selectedSynergies}
        />
      </div>

      {activeModal === 'traits' && (
        <CollectionModal title="Traits" onClose={() => setActiveModal(null)}>
          <div className="grid gap-3 md:grid-cols-2">
            {traitGroups.map((trait) => {
              const traitIcon = getTraitIconName(trait.name)

              return (
                <article
                  key={trait.name}
                  className="border border-white/10 bg-black/25 p-4"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center border border-blue-300/25 bg-blue-300/10 text-blue-100"
                      aria-hidden="true"
                    >
                      <Icon name={traitIcon} className="h-5 w-5" />
                    </span>
                    <h3 className="min-w-0 text-sm font-black uppercase italic text-white">
                      {trait.name}
                    </h3>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                    {trait.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {trait.players.map((player) => (
                      <span
                        key={player.id}
                        className="border border-blue-300/25 bg-blue-300/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-100"
                      >
                        {player.name}
                      </span>
                    ))}
                  </div>
                </article>
              )
            })}
          </div>
        </CollectionModal>
      )}

      {activeModal === 'synergies' && (
        <CollectionModal
          title="Sinergias"
          onClose={() => setActiveModal(null)}
        >
          <div className="grid gap-3 md:grid-cols-2">
            {[...SYNERGY_DEFINITIONS, ...UNIQUE_SYNERGY_DEFINITIONS].map(
              (synergy) => (
                <GlobalSynergyCard key={synergy.id} synergy={synergy} />
              ),
            )}
          </div>
        </CollectionModal>
      )}
    </main>
  )
}

function CollectionHeader({
  total,
  visible,
}: {
  total: number
  visible: number
}) {
  return (
    <header className="border border-white/10 bg-white/[0.035] p-4 shadow-[0_20px_70px_rgba(0,0,0,0.25)]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-300">
            Collection
          </span>
          <h1 className="mt-2 text-3xl font-black uppercase italic tracking-tight text-white sm:text-4xl">
            Catalogo de Personagens
          </h1>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-right">
          <div>
            <dt className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-600">
              Visiveis
            </dt>
            <dd className="font-mono text-xl font-black text-blue-200">
              {visible}
            </dd>
          </div>
          <div>
            <dt className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-600">
              Total
            </dt>
            <dd className="font-mono text-xl font-black text-zinc-200">
              {total}
            </dd>
          </div>
        </dl>
      </div>
    </header>
  )
}

function CollectionFilters({
  search,
  onSearchChange,
  rarityFilter,
  onRarityFilterChange,
  positionFilter,
  onPositionFilterChange,
  positions,
  onOpenTraits,
  onOpenSynergies,
}: {
  search: string
  onSearchChange: (value: string) => void
  rarityFilter: Rarity | 'all'
  onRarityFilterChange: (value: Rarity | 'all') => void
  positionFilter: string
  onPositionFilterChange: (value: string) => void
  positions: string[]
  onOpenTraits: () => void
  onOpenSynergies: () => void
}) {
  return (
    <aside className="min-w-0 border border-white/10 bg-[#07101d]/90 p-4 shadow-[0_20px_70px_rgba(0,0,0,0.28)] backdrop-blur xl:sticky xl:top-5 xl:self-start">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">
          Filtros
        </h2>
        <span className="h-px flex-1 bg-blue-300/20" />
      </div>

      <label className="mt-4 block">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
          Pesquisa
        </span>
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar jogador"
          className="mt-2 w-full border border-white/10 bg-black/35 px-3 py-2.5 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-700 focus:border-blue-400/70 focus:bg-blue-500/[0.06]"
        />
      </label>

      <div className="mt-5 grid gap-3">
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
            Raridade
          </span>
          <select
            value={rarityFilter}
            onChange={(event) =>
              onRarityFilterChange(event.target.value as Rarity | 'all')
            }
            className="mt-2 w-full border border-white/10 bg-black/35 px-3 py-2.5 text-sm font-bold text-white outline-none transition focus:border-blue-400/70"
          >
            <option value="all">Todas</option>
            {COLLECTION_RARITY_ORDER.map((rarity) => (
              <option key={rarity} value={rarity}>
                {rarity}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
            Posicao
          </span>
          <select
            value={positionFilter}
            onChange={(event) => onPositionFilterChange(event.target.value)}
            className="mt-2 w-full border border-white/10 bg-black/35 px-3 py-2.5 text-sm font-bold text-white outline-none transition focus:border-blue-400/70"
          >
            <option value="all">Todas</option>
            {positions.map((position) => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </select>
        </label>

        <div className="border border-white/10 bg-black/25 p-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
            Ordem
          </span>
          <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-zinc-200">
            Raridade + nome
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={onOpenTraits}
          className="inline-flex min-w-0 items-center justify-center gap-1.5 border border-blue-300/25 bg-blue-300/10 px-2 py-2.5 text-[10px] font-black uppercase tracking-[0.1em] text-blue-100 transition hover:border-blue-200/60 hover:bg-blue-300/15 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-400 sm:gap-2 sm:px-3 sm:text-xs sm:tracking-[0.14em]"
        >
          <Icon name="sparkles" className="h-3.5 w-3.5" />
          Traits
        </button>
        <button
          type="button"
          onClick={onOpenSynergies}
          className="inline-flex min-w-0 items-center justify-center gap-1.5 border border-cyan-300/25 bg-cyan-300/10 px-2 py-2.5 text-[10px] font-black uppercase tracking-[0.1em] text-cyan-100 transition hover:border-cyan-200/60 hover:bg-cyan-300/15 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400 sm:gap-2 sm:px-3 sm:text-xs sm:tracking-[0.14em]"
        >
          <Icon name="network" className="h-3.5 w-3.5" />
          Sinergias
        </button>
      </div>
    </aside>
  )
}

function CollectionPlayerCard({
  entry,
  selected,
  onSelect,
}: {
  entry: CollectionEntry
  selected: boolean
  onSelect: (player: Player) => void
}) {
  const { player } = entry
  const styles = rarityStyles[player.rarity]

  return (
    <button
      type="button"
      onClick={() => onSelect(player)}
      aria-pressed={selected}
      className={`group relative flex h-[13.5rem] w-full flex-col overflow-hidden border bg-white/[0.045] text-left shadow-lg transition-[box-shadow,border-color,background-color] duration-200 ease-out hover:bg-blue-500/[0.07] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-400 ${styles.card} ${styles.glow} ${
        selected
          ? 'z-10 border-2 border-blue-300/95 bg-blue-500/[0.12] shadow-[0_0_0_1px_rgba(147,197,253,0.42),0_18px_48px_rgba(37,99,235,0.36)]'
          : ''
      }`}
    >
      <div className="relative h-32 shrink-0 border-b border-white/10 bg-black">
        <PlayerImage
          player={player}
          className="h-full w-full"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(0,0,0,0.34),rgba(0,0,0,0.08)_34%,transparent_58%),linear-gradient(0deg,rgba(5,7,11,0.18),transparent_45%)]"
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#05070b] to-transparent" />
        <span
          className={`absolute right-2 top-2 border bg-black/62 px-2 py-1 text-[8px] font-black uppercase tracking-wider [text-shadow:0_1px_4px_rgba(0,0,0,0.95)] ${styles.badge}`}
        >
          {player.rarity}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-2.5">
        <h3
          className="line-clamp-2 font-black uppercase italic text-white"
          style={getCollectionNameStyle(player.name)}
        >
          {player.name}
        </h3>
        <p className="mt-auto border-t border-white/10 pt-2 text-[9px] font-bold uppercase tracking-[0.16em] text-blue-300/80">
          {player.position}
        </p>
      </div>
    </button>
  )
}

function PlayerDetailPanel({
  player,
  isVisible,
  flow,
  synergies,
}: {
  player: Player
  isVisible: boolean
  flow: FlowPresentation
  synergies: PlayerRelatedSynergies
}) {
  const styles = rarityStyles[player.rarity]

  return (
    <aside className="min-w-0 border border-white/10 bg-[#07101d]/92 shadow-[0_20px_70px_rgba(0,0,0,0.32)] backdrop-blur xl:sticky xl:top-5 xl:max-h-[calc(100vh-2.5rem)] xl:overflow-y-auto xl:self-start match-scrollbar">
      <div
        className={`transition-[opacity,transform] duration-150 ease-out ${
          isVisible ? 'translate-x-0 opacity-100' : 'translate-x-1 opacity-0'
        }`}
      >
        <div className="relative border-b border-white/10 bg-black">
          <PlayerImage
            player={player}
            eager
            className="h-64 w-full sm:h-72 xl:h-60"
          />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#07101d] to-transparent" />
          <div
            className={`absolute inset-x-0 bottom-0 h-1 ${styles.accent}`}
          />
        </div>

        <div className="grid gap-4 p-4">
          <div>
            <h2
              className="font-black uppercase italic text-white"
              style={getDetailNameStyle(player.name)}
            >
              {player.name}
            </h2>

            <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2">
              <span
                className={`border px-2 py-1 text-[9px] font-black uppercase tracking-wider ${styles.badge}`}
              >
                {player.rarity}
              </span>
              <span className="border border-white/10 bg-white/[0.04] px-2 py-1 text-[9px] font-black uppercase tracking-wider text-zinc-300">
                {player.position}
              </span>
            </div>
          </div>

          <TraitIdentitySection player={player} styles={styles} />
          <FlowSection flow={flow} />
          <ArchetypeSection player={player} />
          <SynergySections synergies={synergies} />
        </div>
      </div>
    </aside>
  )
}

function TraitIdentitySection({
  player,
  styles,
}: {
  player: Player
  styles: (typeof rarityStyles)[Rarity]
}) {
  const traitIcon = getTraitIconName(player.trait?.name)

  return (
    <section
      className={`relative overflow-hidden border p-4 shadow-[0_0_30px_rgba(59,130,246,0.1)] ${styles.panel}`}
    >
      <span
        className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center border bg-black/20 ${styles.badge}`}
        aria-hidden="true"
      >
        <Icon name={traitIcon} className="h-5 w-5" />
      </span>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200">
        Trait
      </p>
      <h3 className="mt-2 pr-14 text-xl font-black uppercase italic text-white">
        {player.trait?.name ?? 'Sem trait'}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-300">
        {player.trait?.description ?? 'Nenhuma trait cadastrada.'}
      </p>
      <div className="mt-4 border-t border-white/10 pt-3">
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500">
          Identidade
        </p>
        <p className="mt-1 text-sm leading-relaxed text-zinc-200">
          {getPlayerIdentityDescription(player)}
        </p>
      </div>
    </section>
  )
}

function FlowSection({ flow }: { flow: FlowPresentation }) {
  const segmentStyles = flowSegmentStyles[flow.tier]

  return (
    <section className="border border-blue-300/20 bg-blue-300/[0.055] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-200">
            Flow
          </p>
          <h3 className="mt-2 text-sm font-black uppercase tracking-[0.14em] text-white">
            Chance de ativacao
          </h3>
        </div>
        <Icon
          name="zap"
          className={`h-5 w-5 shrink-0 ${flowTierStyles[flow.tier]}`}
        />
      </div>
      <div className="mt-4">
        <div
          className="grid grid-cols-5 gap-1.5"
          aria-label={`Nivel de Flow ${flow.activationLevel} de ${flowSegmentCount}`}
        >
          {Array.from({ length: flowSegmentCount }, (_, index) => {
            const isFilled = index < flow.activationLevel

            return (
              <span
                key={index}
                className={`h-2.5 border transition-colors ${
                  isFilled ? segmentStyles.filled : segmentStyles.empty
                }`}
              />
            )
          })}
        </div>
        <strong
          className={`mt-3 block text-sm font-black uppercase tracking-[0.16em] ${flowTierStyles[flow.tier]}`}
        >
          {flow.tier}
        </strong>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">
        {flow.description}
      </p>
    </section>
  )
}

function ArchetypeSection({ player }: { player: Player }) {
  if (!player.archetypes || player.archetypes.length === 0) {
    return null
  }

  return (
    <section className="border border-blue-300/20 bg-blue-300/[0.045] p-4">
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200">
        Arquetipos
      </h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {player.archetypes.map((archetype) => (
          <span
            key={archetype}
            className="border border-blue-300/25 bg-blue-300/10 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.13em] text-blue-100 transition duration-200 hover:border-blue-200/60 hover:bg-blue-300/15"
          >
            {getDisplayArchetypeLabel(archetype)}
          </span>
        ))}
      </div>
    </section>
  )
}

function SynergySections({
  synergies,
}: {
  synergies: PlayerRelatedSynergies
}) {
  const hasArchetypeSynergies = synergies.archetypeSynergies.length > 0
  const hasUniqueSynergies = synergies.uniqueSynergies.length > 0

  if (!hasArchetypeSynergies && !hasUniqueSynergies) {
    return null
  }

  return (
    <section className="grid gap-3">
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">
        Sinergias
      </h3>

      {hasArchetypeSynergies && (
        <SynergyGroup
          title="Sinergias de Arquetipo"
          synergies={synergies.archetypeSynergies}
        />
      )}

      {hasUniqueSynergies && (
        <SynergyGroup
          title="Sinergias Unicas"
          synergies={synergies.uniqueSynergies}
        />
      )}
    </section>
  )
}

function SynergyGroup({
  title,
  synergies,
}: {
  title: string
  synergies: TeamSynergy[]
}) {
  return (
    <div className="grid gap-2">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500">
        {title}
      </p>
      {synergies.map((synergy) => (
        <SynergyInfoCard key={synergy.id} synergy={synergy} />
      ))}
    </div>
  )
}

function SynergyInfoCard({ synergy }: { synergy: TeamSynergy }) {
  const requirements = getSynergyRequirements(synergy)

  return (
    <article className="border border-cyan-300/20 bg-cyan-300/[0.055] p-3 transition duration-200 hover:border-cyan-200/45">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h4 className="text-sm font-black uppercase italic text-white">
          {synergy.name}
        </h4>
        <span className="border border-cyan-200/30 bg-cyan-200/10 px-2 py-1 text-[8px] font-black uppercase tracking-wider text-cyan-100">
          {'requiredPlayerIds' in synergy ? 'Unica' : 'Arquetipo'}
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-zinc-400">
        {synergy.description}
      </p>
      <div className="mt-3">
        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-600">
          {requirements.label}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {requirements.requirements.map((requirement) => (
            <span
              key={requirement}
              className="border border-white/10 bg-black/25 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-zinc-300"
            >
              {requirement}
            </span>
          ))}
        </div>
      </div>
    </article>
  )
}

function GlobalSynergyCard({ synergy }: { synergy: Synergy | UniqueSynergy }) {
  const requirements = getSynergyRequirements(synergy)

  return (
    <article className="border border-white/10 bg-black/25 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-sm font-black uppercase italic text-white">
          {synergy.name}
        </h3>
        <span className="border border-cyan-200/30 bg-cyan-200/10 px-2 py-1 text-[8px] font-black uppercase tracking-wider text-cyan-100">
          {'requiredPlayerIds' in synergy ? 'Unica' : 'Arquetipo'}
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-zinc-400">
        {synergy.description}
      </p>
      <div className="mt-3">
        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-600">
          {requirements.label}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {requirements.requirements.map((requirement) => (
            <span
              key={requirement}
              className="border border-white/10 bg-white/[0.04] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-zinc-300"
            >
              {requirement}
            </span>
          ))}
        </div>
      </div>
    </article>
  )
}

function CollectionModal({
  title,
  children,
  onClose,
}: {
  title: string
  children: React.ReactNode
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <section
        className="flex max-h-[86vh] w-full max-w-5xl flex-col border border-blue-300/25 bg-[#07101d] shadow-[0_28px_90px_rgba(0,0,0,0.55)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-4 border-b border-white/10 p-4">
          <h2 className="text-xl font-black uppercase italic text-white">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-300 transition hover:border-blue-300/50 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-400"
          >
            Fechar
          </button>
        </header>
        <div className="overflow-y-auto p-4 match-scrollbar">{children}</div>
      </section>
    </div>
  )
}

export default CollectionPage
