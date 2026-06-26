import { useEffect, useMemo, useRef, useState } from 'react'
import PlayerImage from '../components/PlayerImage'
import { players } from '../data/players'
import type { Player, Rarity } from '../types/player'
import {
  calculatePlayerPower,
  playerAttributes,
  type PlayerAttribute,
} from '../utils/draft'
import {
  SYNERGY_DEFINITIONS,
  UNIQUE_SYNERGY_DEFINITIONS,
  getSynergyEffectSummary,
  type Synergy,
  type TeamSynergy,
  type UniqueSynergy,
} from '../utils/synergies'

type CollectionTab = 'overview' | 'trait-flow' | 'synergies'
type ModalType = 'traits' | 'synergies' | null
type SortKey =
  | 'name'
  | 'power'
  | 'attack'
  | 'defense'
  | 'speed'
  | 'vision'
  | 'ego'

interface CollectionEntry {
  player: Player
}

interface DisplaySynergy {
  synergy: TeamSynergy
  type: 'Arquetipo' | 'Unica'
  requirementLabel: string
  requirements: string[]
}

interface TraitGroup {
  name: string
  description: string
  players: Player[]
}

interface FlowInfo {
  name: string
  description: string
}

const rarityOptions: Rarity[] = [
  'Common',
  'Rare',
  'Epic',
  'Legendary',
  'Egoist',
]

const sortOptions: Array<{ value: SortKey; label: string }> = [
  { value: 'name', label: 'Nome' },
  { value: 'power', label: 'Poder' },
  { value: 'attack', label: 'Ataque' },
  { value: 'defense', label: 'Defesa' },
  { value: 'speed', label: 'Velocidade' },
  { value: 'vision', label: 'Visao' },
  { value: 'ego', label: 'Ego' },
]

const attributeLabels: Record<PlayerAttribute, string> = {
  attack: 'Attack',
  speed: 'Speed',
  vision: 'Vision',
  dribble: 'Dribble',
  defense: 'Defense',
  ego: 'Ego',
}

const rarityStyles: Record<
  Rarity,
  {
    badge: string
    card: string
    glow: string
    accent: string
    text: string
    power: string
  }
> = {
  Common: {
    badge: 'border-zinc-300/55 text-zinc-100 shadow-[0_0_16px_rgba(212,212,216,0.12)]',
    card: 'border-zinc-400/35',
    glow: 'hover:shadow-[0_18px_42px_rgba(161,161,170,0.24)]',
    accent: 'bg-zinc-200',
    text: 'text-zinc-100',
    power: 'text-zinc-50 drop-shadow-[0_0_10px_rgba(212,212,216,0.28)]',
  },
  Rare: {
    badge: 'border-blue-300/70 text-blue-100 shadow-[0_0_18px_rgba(96,165,250,0.22)]',
    card: 'border-blue-300/40',
    glow: 'hover:shadow-[0_18px_44px_rgba(59,130,246,0.34)]',
    accent: 'bg-blue-200',
    text: 'text-blue-100',
    power: 'text-blue-50 drop-shadow-[0_0_12px_rgba(96,165,250,0.38)]',
  },
  Epic: {
    badge: 'border-violet-300/70 text-violet-100 shadow-[0_0_18px_rgba(167,139,250,0.22)]',
    card: 'border-violet-300/40',
    glow: 'hover:shadow-[0_18px_44px_rgba(139,92,246,0.34)]',
    accent: 'bg-violet-200',
    text: 'text-violet-100',
    power: 'text-violet-50 drop-shadow-[0_0_12px_rgba(167,139,250,0.38)]',
  },
  Legendary: {
    badge: 'border-amber-200/80 text-amber-100 shadow-[0_0_20px_rgba(251,191,36,0.26)]',
    card: 'border-amber-200/45',
    glow: 'hover:shadow-[0_18px_46px_rgba(251,191,36,0.32)]',
    accent: 'bg-amber-100',
    text: 'text-amber-100',
    power: 'text-amber-50 drop-shadow-[0_0_13px_rgba(251,191,36,0.42)]',
  },
  Egoist: {
    badge: 'border-rose-300/75 text-rose-100 shadow-[0_0_20px_rgba(244,63,94,0.28)]',
    card: 'border-rose-300/45',
    glow: 'hover:shadow-[0_18px_46px_rgba(244,63,94,0.34)]',
    accent: 'bg-rose-200',
    text: 'text-rose-100',
    power: 'text-rose-50 drop-shadow-[0_0_13px_rgba(244,63,94,0.42)]',
  },
}

function getSortValue(player: Player, sortKey: SortKey): number | string {
  if (sortKey === 'name') {
    return player.name
  }

  if (sortKey === 'power') {
    return calculatePlayerPower(player)
  }

  return player[sortKey]
}

function getFlowInfo(player: Player): FlowInfo {
  const primaryIdentity = player.trait?.name ?? player.archetypes?.[0] ?? 'Ego'
  const role = player.archetypes?.[0] ?? player.position

  return {
    name: `${primaryIdentity} Flow`,
    description: `${player.name} eleva ${role.toLowerCase()} ao maximo quando entra em ritmo. Chance base de Flow: ${player.flowRate}%.`,
  }
}

function getPlayerSynergies(player: Player): DisplaySynergy[] {
  const archetypes = new Set(player.archetypes ?? [])
  const archetypeSynergies = SYNERGY_DEFINITIONS.filter((synergy) =>
    synergy.requiredArchetypes.some((archetype) => archetypes.has(archetype)),
  ).map((synergy) => ({
    synergy,
    type: 'Arquetipo' as const,
    requirementLabel: 'Arquetipos',
    requirements: synergy.requiredArchetypes,
  }))

  const uniqueSynergies = UNIQUE_SYNERGY_DEFINITIONS.filter((synergy) =>
    synergy.requiredPlayerIds.includes(player.id),
  ).map((synergy) => ({
    synergy,
    type: 'Unica' as const,
    requirementLabel: 'Parceiros',
    requirements: synergy.requiredPlayerNames,
  }))

  return [...archetypeSynergies, ...uniqueSynergies]
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
    requirements: synergy.requiredArchetypes,
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
  const [sortKey, setSortKey] = useState<SortKey>('power')
  const [selectedPlayer, setSelectedPlayer] = useState<Player>(players[0])
  const [panelPlayer, setPanelPlayer] = useState<Player>(players[0])
  const [isPanelVisible, setIsPanelVisible] = useState(true)
  const [activeTab, setActiveTab] = useState<CollectionTab>('overview')
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const panelTransitionRef = useRef<number | undefined>(undefined)

  const collectionEntries = useMemo<CollectionEntry[]>(
    () =>
      players.map((player) => ({
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

    return collectionEntries
      .filter(({ player }) => {
        const matchesSearch = player.name
          .toLowerCase()
          .includes(normalizedSearch)
        const matchesRarity =
          rarityFilter === 'all' || player.rarity === rarityFilter
        const matchesPosition =
          positionFilter === 'all' || player.position === positionFilter

        return (
          matchesSearch &&
          matchesRarity &&
          matchesPosition
        )
      })
      .sort((firstEntry, secondEntry) => {
        const firstValue = getSortValue(firstEntry.player, sortKey)
        const secondValue = getSortValue(secondEntry.player, sortKey)

        if (typeof firstValue === 'string') {
          return firstValue.localeCompare(String(secondValue))
        }

        return (
          Number(secondValue) - firstValue ||
          firstEntry.player.name.localeCompare(secondEntry.player.name)
        )
      })
  }, [
    collectionEntries,
    positionFilter,
    rarityFilter,
    search,
    sortKey,
  ])

  const selectedSynergies = useMemo(
    () => getPlayerSynergies(panelPlayer),
    [panelPlayer],
  )
  const selectedFlow = useMemo(
    () => getFlowInfo(panelPlayer),
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

      <div className="relative z-10 mx-auto grid w-full max-w-[96rem] gap-4 xl:grid-cols-[17rem_minmax(0,1fr)_23rem]">
        <CollectionFilters
          search={search}
          onSearchChange={setSearch}
          rarityFilter={rarityFilter}
          onRarityFilterChange={setRarityFilter}
          positionFilter={positionFilter}
          onPositionFilterChange={setPositionFilter}
          sortKey={sortKey}
          onSortKeyChange={setSortKey}
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
            <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-3 sm:grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))]">
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
          activeTab={activeTab}
          onTabChange={setActiveTab}
          flow={selectedFlow}
          synergies={selectedSynergies}
        />
      </div>

      {activeModal === 'traits' && (
        <CollectionModal title="Traits" onClose={() => setActiveModal(null)}>
          <div className="grid gap-3 md:grid-cols-2">
            {traitGroups.map((trait) => (
              <article
                key={trait.name}
                className="border border-white/10 bg-black/25 p-4"
              >
                <h3 className="text-sm font-black uppercase italic text-white">
                  {trait.name}
                </h3>
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
            ))}
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
            Database
          </span>
          <h1 className="mt-2 text-3xl font-black uppercase italic tracking-tight text-white sm:text-4xl">
            Colecao
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
  sortKey,
  onSortKeyChange,
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
  sortKey: SortKey
  onSortKeyChange: (value: SortKey) => void
  positions: string[]
  onOpenTraits: () => void
  onOpenSynergies: () => void
}) {
  return (
    <aside className="border border-white/10 bg-[#07101d]/90 p-4 shadow-[0_20px_70px_rgba(0,0,0,0.28)] backdrop-blur xl:sticky xl:top-5 xl:self-start">
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
            {rarityOptions.map((rarity) => (
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

        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
            Ordenar
          </span>
          <select
            value={sortKey}
            onChange={(event) => onSortKeyChange(event.target.value as SortKey)}
            className="mt-2 w-full border border-white/10 bg-black/35 px-3 py-2.5 text-sm font-bold text-white outline-none transition focus:border-blue-400/70"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onOpenTraits}
          className="border border-blue-300/25 bg-blue-300/10 px-3 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-blue-100 transition hover:border-blue-200/60 hover:bg-blue-300/15 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-400"
        >
          Traits
        </button>
        <button
          type="button"
          onClick={onOpenSynergies}
          className="border border-cyan-300/25 bg-cyan-300/10 px-3 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-cyan-100 transition hover:border-cyan-200/60 hover:bg-cyan-300/15 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400"
        >
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
      className={`group relative flex h-[14.75rem] w-full flex-col overflow-hidden border bg-white/[0.045] text-left shadow-lg transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out will-change-transform hover:-translate-y-1.5 hover:scale-[1.02] hover:bg-blue-500/[0.07] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-400 ${styles.card} ${styles.glow} ${
        selected
          ? 'z-10 scale-[1.02] border-2 border-blue-300/95 bg-blue-500/[0.12] shadow-[0_0_0_1px_rgba(147,197,253,0.42),0_18px_48px_rgba(37,99,235,0.36)]'
          : ''
      }`}
    >
      <div className="relative h-32 shrink-0 border-b border-white/10 bg-black">
        <PlayerImage
          player={player}
          className="h-full w-full"
          imageClassName="transition duration-200 group-hover:scale-[1.03]"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(0,0,0,0.34),rgba(0,0,0,0.08)_34%,transparent_58%),linear-gradient(0deg,rgba(5,7,11,0.18),transparent_45%)]"
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#05070b] to-transparent" />
        <span
          className={`absolute right-2 top-2 border bg-black/62 px-2 py-1 text-[8px] font-black uppercase tracking-wider backdrop-blur-md [text-shadow:0_1px_4px_rgba(0,0,0,0.95)] ${styles.badge}`}
        >
          {player.rarity}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-2.5">
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-blue-300/80">
          {player.position}
        </p>
        <h3
          className="mt-1 line-clamp-2 font-black uppercase italic text-white"
          style={getCollectionNameStyle(player.name)}
        >
          {player.name}
        </h3>
        <div className="mt-auto flex items-end justify-between gap-2 border-t border-white/10 pt-2.5">
          <span className="text-[8px] font-bold uppercase tracking-[0.18em] text-zinc-500">
            Poder
          </span>
          <strong className={`font-mono text-xl font-black leading-none ${styles.power}`}>
            {calculatePlayerPower(player)}
          </strong>
        </div>
      </div>
    </button>
  )
}

function PlayerDetailPanel({
  player,
  isVisible,
  activeTab,
  onTabChange,
  flow,
  synergies,
}: {
  player: Player
  isVisible: boolean
  activeTab: CollectionTab
  onTabChange: (tab: CollectionTab) => void
  flow: FlowInfo
  synergies: DisplaySynergy[]
}) {
  const styles = rarityStyles[player.rarity]
  const [displayedTab, setDisplayedTab] =
    useState<CollectionTab>(activeTab)
  const [isTabVisible, setIsTabVisible] = useState(true)
  const tabTransitionRef = useRef<number | undefined>(undefined)

  useEffect(
    () => () => {
      if (tabTransitionRef.current) {
        window.clearTimeout(tabTransitionRef.current)
      }
    },
    [],
  )

  function handleTabChange(tab: CollectionTab) {
    if (tab === activeTab) {
      return
    }

    if (tabTransitionRef.current) {
      window.clearTimeout(tabTransitionRef.current)
    }

    onTabChange(tab)
    setIsTabVisible(false)

    tabTransitionRef.current = window.setTimeout(() => {
      setDisplayedTab(tab)
      setIsTabVisible(true)
    }, 80)
  }

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
        </div>

        <div className="p-4">
          <h2
            className="font-black uppercase italic text-white"
            style={getDetailNameStyle(player.name)}
          >
            {player.name}
          </h2>

          <div className="mt-3 flex items-center justify-between gap-3 border-y border-white/10 py-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className={`border px-2 py-1 text-[9px] font-black uppercase tracking-wider ${styles.badge}`}>
                {player.rarity}
              </span>
              <span className="border border-white/10 bg-white/[0.04] px-2 py-1 text-[9px] font-black uppercase tracking-wider text-zinc-300">
                {player.position}
              </span>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                Poder
              </p>
              <strong className={`font-mono text-4xl font-black leading-none ${styles.power}`}>
                {calculatePlayerPower(player)}
              </strong>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 border border-white/10 bg-black/25 p-1">
            <TabButton
              active={activeTab === 'overview'}
              label="Visao Geral"
              onClick={() => handleTabChange('overview')}
            />
            <TabButton
              active={activeTab === 'trait-flow'}
              label="Trait & Flow"
              onClick={() => handleTabChange('trait-flow')}
            />
            <TabButton
              active={activeTab === 'synergies'}
              label="Sinergias"
              onClick={() => handleTabChange('synergies')}
            />
          </div>

          <div
            className={`mt-4 transition-[opacity,transform] duration-150 ease-out ${
              isTabVisible
                ? 'translate-x-0 opacity-100'
                : 'translate-x-1 opacity-0'
            }`}
          >
            {displayedTab === 'overview' && <OverviewTab player={player} />}
            {displayedTab === 'trait-flow' && (
              <TraitFlowTab player={player} flow={flow} />
            )}
            {displayedTab === 'synergies' && (
              <SynergiesTab synergies={synergies} />
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-10 px-2 py-2 text-[10px] font-black uppercase tracking-[0.1em] transition-[background-color,color,box-shadow,transform] duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 ${
        active
          ? 'bg-blue-500 text-white shadow-[0_0_18px_rgba(59,130,246,0.26)]'
          : 'text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-200 hover:translate-y-[-1px]'
      }`}
    >
      {label}
    </button>
  )
}

function OverviewTab({ player }: { player: Player }) {
  return (
    <div className="grid gap-3">
      {player.archetypes && player.archetypes.length > 0 && (
        <div className="border border-white/10 bg-white/[0.035] p-3">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-600">
            Tags
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {player.archetypes.map((archetype) => (
              <span
                key={archetype}
                className="border border-blue-400/25 bg-blue-400/10 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-blue-200"
              >
                {archetype}
              </span>
            ))}
          </div>
        </div>
      )}

      <dl className="grid gap-2">
        {playerAttributes.map((attribute) => (
          <div
            key={attribute}
            className="border border-white/10 bg-white/[0.035] p-3"
          >
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                {attributeLabels[attribute]}
              </dt>
              <dd className="font-mono text-lg font-black text-white">
                {player[attribute]}
              </dd>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden bg-black/55">
              <span
                className="block h-full bg-blue-300"
                style={{ width: `${player[attribute]}%` }}
              />
            </div>
          </div>
        ))}
      </dl>
    </div>
  )
}

function TraitFlowTab({
  player,
  flow,
}: {
  player: Player
  flow: FlowInfo
}) {
  return (
    <div className="grid gap-3">
      <section className="border border-blue-300/20 bg-blue-300/[0.06] p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-200">
          Trait
        </p>
        <h3 className="mt-2 text-lg font-black uppercase italic text-white">
          {player.trait?.name ?? 'Sem trait'}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          {player.trait?.description ?? 'Nenhuma trait cadastrada.'}
        </p>
      </section>

      <section className="border border-cyan-300/20 bg-cyan-300/[0.06] p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">
          Flow
        </p>
        <h3 className="mt-2 text-lg font-black uppercase italic text-white">
          {flow.name}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          {flow.description}
        </p>
      </section>
    </div>
  )
}

function SynergiesTab({ synergies }: { synergies: DisplaySynergy[] }) {
  if (synergies.length === 0) {
    return (
      <p className="border border-white/10 bg-white/[0.035] p-4 text-sm text-zinc-500">
        Nenhuma sinergia.
      </p>
    )
  }

  return (
    <div className="grid gap-3">
      {synergies.map((displaySynergy) => (
        <SynergyInfoCard
          key={displaySynergy.synergy.id}
          displaySynergy={displaySynergy}
        />
      ))}
    </div>
  )
}

function SynergyInfoCard({
  displaySynergy,
}: {
  displaySynergy: DisplaySynergy
}) {
  const { synergy, type, requirementLabel, requirements } = displaySynergy

  return (
    <article className="border border-cyan-300/20 bg-cyan-300/[0.055] p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-sm font-black uppercase italic text-white">
          {synergy.name}
        </h3>
        <span className="border border-cyan-200/30 bg-cyan-200/10 px-2 py-1 text-[8px] font-black uppercase tracking-wider text-cyan-100">
          {type}
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-zinc-400">
        {synergy.description}
      </p>
      <p className="mt-2 text-[10px] font-black uppercase tracking-[0.15em] text-cyan-200">
        {getSynergyEffectSummary(synergy)}
      </p>
      <div className="mt-3">
        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-600">
          {requirementLabel}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {requirements.map((requirement) => (
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
      <p className="mt-2 text-[10px] font-black uppercase tracking-[0.15em] text-cyan-200">
        {getSynergyEffectSummary(synergy)}
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
