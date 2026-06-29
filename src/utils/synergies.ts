import type { Player } from '../types/player'

export interface Synergy {
  id: string
  name: string
  requiredArchetypes: string[]
  description: string
  effects: {
    goalConversionBonus?: number
    offensiveParticipationBonus?: number
    finisherSelectionBonus?: number
    assistChanceBonus?: number
    defensiveActionBonus?: number
    flowChanceBonus?: number
  }
}

export interface UniqueSynergy {
  id: string
  name: string
  requiredPlayerIds: number[]
  requiredPlayerNames: string[]
  minimumRequiredPlayerCount?: number
  description: string
  effects: Synergy['effects']
}

export type SynergyEffectKey = keyof Synergy['effects']
export type SynergyImpactRole =
  | 'goal'
  | 'finisher'
  | 'assist'
  | 'defense'
  | 'flow'

type SynergyEffectTotals = Record<SynergyEffectKey, number>
export type TeamSynergy = Synergy | UniqueSynergy

export interface NewSynergyPreview {
  archetypeSynergies: Synergy[]
  uniqueSynergies: UniqueSynergy[]
}

export const SYNERGY_DEFINITIONS: Synergy[] = [
  {
    id: 'killer-pass',
    name: 'Killer Pass',
    requiredArchetypes: ['Playmaker', 'Finisher'],
    description: 'Criadores melhoram a eficiencia dos finalizadores.',
    effects: {
      goalConversionBonus: 0.1,
    },
  },
  {
    id: 'direct-path',
    name: 'Direct Path',
    requiredArchetypes: ['Visionary', 'Finisher'],
    description: 'Jogadores visionarios encontram o caminho ate o gol.',
    effects: {
      finisherSelectionBonus: 0.1,
    },
  },
  {
    id: 'speed-break',
    name: 'Speed Break',
    requiredArchetypes: ['Dribbler', 'Sprinter'],
    description: 'Velocidade e drible quebram linhas defensivas.',
    effects: {
      offensiveParticipationBonus: 0.12,
    },
  },
  {
    id: 'defensive-command',
    name: 'Defensive Command',
    requiredArchetypes: ['Leader', 'Goalkeeper'],
    description: 'Goleiros e lideres organizam melhor a marcacao.',
    effects: {
      defensiveActionBonus: 0.15,
    },
  },
  {
    id: 'iron-wall',
    name: 'Iron Wall',
    requiredArchetypes: ['Defender', 'Reactive'],
    description: 'Uma dupla solida dificulta qualquer avanco adversario.',
    effects: {
      defensiveActionBonus: 0.18,
    },
  },
  {
    id: 'last-line',
    name: 'Last Line',
    requiredArchetypes: ['Goalkeeper', 'Visionary'],
    description: 'A ultima linha defensiva le e organiza o jogo.',
    effects: {
      defensiveActionBonus: 0.2,
    },
  },
  {
    id: 'counter-press',
    name: 'Counter Press',
    requiredArchetypes: ['Leader', 'Power'],
    description: 'Pressao fisica organizada recupera rapidamente a posse.',
    effects: {
      defensiveActionBonus: 0.15,
      flowChanceBonus: 0.05,
    },
  },
  {
    id: 'lockdown',
    name: 'Lockdown',
    requiredArchetypes: ['Visionary', 'Reactive'],
    description: 'Leitura de jogo transforma antecipacao em roubadas de bola.',
    effects: {
      defensiveActionBonus: 0.12,
    },
  },
  {
    id: 'physical-fortress',
    name: 'Physical Fortress',
    requiredArchetypes: ['Power', 'Goalkeeper'],
    description: 'Superioridade fisica protege a ultima linha.',
    effects: {
      defensiveActionBonus: 0.18,
    },
  },
  {
    id: 'press-machine',
    name: 'Press Machine',
    requiredArchetypes: ['Leader', 'Sprinter'],
    description: 'Pressao coordenada forca erros constantes.',
    effects: {
      defensiveActionBonus: 0.15,
      flowChanceBonus: 0.08,
    },
  },
  {
    id: 'complete-team',
    name: 'Complete Team',
    requiredArchetypes: ['Finisher', 'Playmaker', 'Defender'],
    description: 'Uma equipe equilibrada funciona em todas as fases do jogo.',
    effects: {
      goalConversionBonus: 0.05,
      assistChanceBonus: 0.05,
      defensiveActionBonus: 0.08,
    },
  },
  {
    id: 'ego-trigger',
    name: 'Ego Trigger',
    requiredArchetypes: ['Playmaker', 'Egoist'],
    description: 'Criadores alimentam o ego dos finalizadores.',
    effects: {
      flowChanceBonus: 0.1,
    },
  },
  {
    id: 'unstoppable-talent',
    name: 'Unstoppable Talent',
    requiredArchetypes: ['Genius', 'Finisher'],
    description: 'Talento bruto aumenta o perigo ofensivo.',
    effects: {
      goalConversionBonus: 0.08,
    },
  },
  {
    id: 'creative-chaos',
    name: 'Creative Chaos',
    requiredArchetypes: ['Dribbler', 'Creator'],
    description: 'Drible e criatividade tornam o ataque imprevisivel.',
    effects: {
      offensiveParticipationBonus: 0.1,
      assistChanceBonus: 0.08,
    },
  },
]

export const UNIQUE_SYNERGY_DEFINITIONS: UniqueSynergy[] = [
  {
    id: 'perfect-duo',
    name: 'Perfect Duo',
    // TODO: Migrar sinergias unicas para playerSlug no futuro.
    // Atualmente o sistema utiliza IDs fixos.
    requiredPlayerIds: [5, 6],
    requiredPlayerNames: ['Nagi Seishiro', 'Mikage Reo'],
    description: 'Reo entende perfeitamente o talento de Nagi.',
    effects: {
      goalConversionBonus: 0.21,
    },
  },
  {
    id: 'chemical-reaction',
    name: 'Chemical Reaction',
    requiredPlayerIds: [9, 18],
    requiredPlayerNames: ['Shidou Ryusei', 'Itoshi Sae'],
    description: 'Sae encontra Shidou nas jogadas mais impossiveis.',
    effects: {
      goalConversionBonus: 0.2,
      assistChanceBonus: 0.15,
    },
  },
  {
    id: 'kaiser-system',
    name: 'Kaiser System',
    requiredPlayerIds: [19, 20],
    requiredPlayerNames: ['Michael Kaiser', 'Alexis Ness'],
    description: 'Ness vive para criar o cenario perfeito para Kaiser.',
    effects: {
      finisherSelectionBonus: 0.18,
      assistChanceBonus: 0.15,
    },
  },
  {
    id: 'itoshi-bloodline',
    name: 'Itoshi Bloodline',
    requiredPlayerIds: [8, 18],
    requiredPlayerNames: ['Rin Itoshi', 'Itoshi Sae'],
    description: 'Talento absurdo correndo no mesmo sangue.',
    effects: {
      offensiveParticipationBonus: 0.14,
      flowChanceBonus: 0.14,
    },
  },
  {
    id: 'meta-link',
    name: 'Meta Link',
    requiredPlayerIds: [1, 15],
    requiredPlayerNames: ['Isagi Yoichi', 'Hiori Yo'],
    description: 'Visao e passe se conectam em alta velocidade.',
    effects: {
      assistChanceBonus: 0.15,
      offensiveParticipationBonus: 0.1,
    },
  },
  {
    id: 'vision-rivals',
    name: 'Vision Rivals',
    requiredPlayerIds: [1, 22],
    requiredPlayerNames: ['Isagi Yoichi', 'Ikki Niko'],
    description:
      'Dois leitores de jogo capazes de antecipar qualquer movimento.',
    effects: {
      flowChanceBonus: 0.08,
      defensiveActionBonus: 0.08,
    },
  },
  {
    id: 'pxg-connection',
    name: 'PXG Connection',
    requiredPlayerIds: [31, 27],
    requiredPlayerNames: ['Julian Loki', 'Charles Chevalier'],
    description: 'Charles encontra Loki em velocidade maxima.',
    effects: {
      assistChanceBonus: 0.15,
      goalConversionBonus: 0.1,
    },
  },
  {
    id: 'ubers-system',
    name: 'Ubers System',
    requiredPlayerIds: [26, 30],
    requiredPlayerNames: ['Don Lorenzo', 'Marc Snuffy'],
    description: 'A estrutura perfeita dos Ubers.',
    effects: {
      defensiveActionBonus: 0.15,
      flowChanceBonus: 0.08,
    },
  },
  {
    id: 'master-and-successor',
    name: 'Master and Successor',
    requiredPlayerIds: [28, 19],
    requiredPlayerNames: ['Noel Noa', 'Michael Kaiser'],
    description: 'O melhor atacante do mundo e seu sucessor.',
    effects: {
      goalConversionBonus: 0.12,
    },
  },
  {
    id: 'world-five',
    name: 'World Five',
    requiredPlayerIds: [43, 44, 31, 45, 46],
    requiredPlayerNames: [
      'Adam Blake',
      'Dada Silva',
      'Julian Loki',
      'Leonardo Luna',
      'Pablo Cavasoz',
    ],
    description: 'A elite mundial pressiona em bloco e acelera o jogo final.',
    effects: {
      goalConversionBonus: 0.1,
      offensiveParticipationBonus: 0.08,
      assistChanceBonus: 0.08,
      flowChanceBonus: 0.12,
    },
  },
  {
    id: 'global-elite',
    name: 'Global Elite',
    requiredPlayerIds: [43, 44, 31, 45, 46],
    requiredPlayerNames: [
      'Adam Blake',
      'Dada Silva',
      'Julian Loki',
      'Leonardo Luna',
      'Pablo Cavasoz',
    ],
    minimumRequiredPlayerCount: 3,
    description: 'Tres nomes da elite global ja elevam o ritmo ofensivo.',
    effects: {
      offensiveParticipationBonus: 0.08,
      goalConversionBonus: 0.06,
    },
  },
  {
    id: 'speed-and-technique',
    name: 'Speed and Technique',
    requiredPlayerIds: [31, 45, 46],
    requiredPlayerNames: ['Julian Loki', 'Leonardo Luna', 'Pablo Cavasoz'],
    description: 'Velocidade e tecnica quebram linhas em poucos toques.',
    effects: {
      assistChanceBonus: 0.12,
      offensiveParticipationBonus: 0.08,
      flowChanceBonus: 0.06,
    },
  },
  {
    id: 'physical-pressure',
    name: 'Physical Pressure',
    requiredPlayerIds: [43, 44],
    requiredPlayerNames: ['Adam Blake', 'Dada Silva'],
    description: 'Forca fisica transforma pressao em finalizacoes perigosas.',
    effects: {
      goalConversionBonus: 0.08,
      finisherSelectionBonus: 0.08,
      defensiveActionBonus: 0.08,
    },
  },
]

const EMPTY_EFFECT_TOTALS: SynergyEffectTotals = {
  goalConversionBonus: 0,
  offensiveParticipationBonus: 0,
  finisherSelectionBonus: 0,
  assistChanceBonus: 0,
  defensiveActionBonus: 0,
  flowChanceBonus: 0,
}

const effectLabels: Record<SynergyEffectKey, string> = {
  goalConversionBonus: '+ conversao',
  offensiveParticipationBonus: '+ participacao ofensiva',
  finisherSelectionBonus: '+ finalizador',
  assistChanceBonus: '+ assistencias',
  defensiveActionBonus: '+ defesa',
  flowChanceBonus: '+ Flow',
}

const roleEffectKeys: Record<SynergyImpactRole, SynergyEffectKey[]> = {
  goal: ['goalConversionBonus'],
  finisher: ['finisherSelectionBonus', 'offensiveParticipationBonus'],
  assist: ['assistChanceBonus', 'offensiveParticipationBonus'],
  defense: ['defensiveActionBonus'],
  flow: ['flowChanceBonus'],
}

const impactPhrases: Record<string, Partial<Record<SynergyImpactRole, string>>> = {
  'killer-pass': {
    goal: 'Killer Pass ativou uma jogada decisiva.',
  },
  'direct-path': {
    finisher: 'Direct Path abriu espaco para a finalizacao.',
  },
  'speed-break': {
    finisher: 'Speed Break quebrou a linha defensiva.',
    assist: 'Speed Break acelerou a criacao da jogada.',
  },
  'defensive-command': {
    defense: 'Defensive Command fortaleceu a marcacao.',
  },
  'iron-wall': {
    defense: 'Iron Wall fechou o caminho do ataque.',
  },
  'last-line': {
    defense: 'Last Line protegeu a area.',
  },
  'counter-press': {
    defense: 'Counter Press recuperou a posse rapidamente.',
    flow: 'Counter Press elevou a intensidade da marcacao.',
  },
  lockdown: {
    defense: 'Lockdown antecipou a jogada.',
  },
  'physical-fortress': {
    defense: 'Physical Fortress venceu o duelo defensivo.',
  },
  'press-machine': {
    defense: 'Press Machine forcou o erro adversario.',
    flow: 'Press Machine aumentou a pressao em campo.',
  },
  'complete-team': {
    goal: 'Complete Team equilibrou a jogada decisiva.',
    assist: 'Complete Team conectou criacao e finalizacao.',
    defense: 'Complete Team protegeu a transicao defensiva.',
  },
  'ego-trigger': {
    flow: 'Ego Trigger elevou a chance de FLOW.',
  },
  'unstoppable-talent': {
    goal: 'Unstoppable Talent aumentou o perigo da jogada.',
  },
  'creative-chaos': {
    assist: 'Creative Chaos abriu espacos inesperados.',
    finisher: 'Creative Chaos desmontou a defesa.',
  },
  'perfect-duo': {
    goal: 'Perfect Duo encontrou o momento perfeito.',
  },
  'chemical-reaction': {
    goal: 'Chemical Reaction explodiu na area.',
    assist: 'Chemical Reaction achou um passe impossivel.',
  },
  'kaiser-system': {
    finisher: 'Kaiser System criou a finalizacao ideal.',
    assist: 'Kaiser System organizou a jogada.',
  },
  'itoshi-bloodline': {
    finisher: 'Itoshi Bloodline acelerou a jogada.',
    flow: 'Itoshi Bloodline elevou o ego em campo.',
  },
  'meta-link': {
    assist: 'Meta Link abriu o caminho do gol.',
    finisher: 'Meta Link acelerou a leitura da jogada.',
  },
  'vision-rivals': {
    flow: 'Vision Rivals elevou a leitura de jogo.',
    defense: 'Vision Rivals antecipou a jogada.',
  },
  'pxg-connection': {
    assist: 'PXG Connection encontrou um passe impossivel.',
    goal: 'PXG Connection acelerou a finalizacao.',
  },
  'ubers-system': {
    defense: 'Ubers System fortaleceu a organizacao defensiva.',
    flow: 'Ubers System aumentou a disciplina tatica.',
  },
  'master-and-successor': {
    goal: 'Master and Successor elevou a eficiencia da finalizacao.',
  },
  'world-five': {
    goal: 'World Five executou uma acao de elite global.',
    assist: 'World Five conectou tecnica e velocidade.',
    flow: 'World Five elevou a pressao do confronto final.',
  },
  'global-elite': {
    goal: 'Global Elite aumentou a eficiencia ofensiva.',
    finisher: 'Global Elite acelerou a escolha do finalizador.',
  },
  'speed-and-technique': {
    assist: 'Speed and Technique desmontou a marcacao.',
    finisher: 'Speed and Technique criou uma finalizacao limpa.',
    flow: 'Speed and Technique aumentou o ritmo da elite.',
  },
  'physical-pressure': {
    goal: 'Physical Pressure empurrou a jogada para a area.',
    finisher: 'Physical Pressure abriu caminho para o chute.',
    defense: 'Physical Pressure venceu o duelo fisico.',
  },
}

export function getActiveSynergies(players: Player[]): Synergy[] {
  const archetypes = new Set(
    players.flatMap((player) => player.archetypes ?? []),
  )
  const activeSynergyIds = new Set<string>()

  return SYNERGY_DEFINITIONS.filter((synergy) => {
    if (activeSynergyIds.has(synergy.id)) {
      return false
    }

    const isActive = synergy.requiredArchetypes.every((archetype) =>
      archetypes.has(archetype),
    )

    if (isActive) {
      activeSynergyIds.add(synergy.id)
    }

    return isActive
  })
}

export function getActiveUniqueSynergies(
  players: Player[],
): UniqueSynergy[] {
  const playerIds = new Set(players.map((player) => player.id))
  const activeSynergyIds = new Set<string>()

  return UNIQUE_SYNERGY_DEFINITIONS.filter((synergy) => {
    if (activeSynergyIds.has(synergy.id)) {
      return false
    }

    const requiredPlayerCount =
      synergy.minimumRequiredPlayerCount ?? synergy.requiredPlayerIds.length
    const matchedPlayerCount = synergy.requiredPlayerIds.filter((playerId) =>
      playerIds.has(playerId),
    ).length
    const isActive = matchedPlayerCount >= requiredPlayerCount

    if (isActive) {
      activeSynergyIds.add(synergy.id)
    }

    return isActive
  })
}

function getAllActiveSynergies(players: Player[]): TeamSynergy[] {
  return [...getActiveSynergies(players), ...getActiveUniqueSynergies(players)]
}

function isUniqueSynergy(synergy: TeamSynergy): synergy is UniqueSynergy {
  return 'requiredPlayerIds' in synergy
}

function getNewItemsById<T extends { id: string }>(
  currentItems: T[],
  nextItems: T[],
): T[] {
  const currentIds = new Set(currentItems.map((item) => item.id))

  return nextItems.filter((item) => !currentIds.has(item.id))
}

export function getNewSynergiesIfPlayerAdded(
  currentTeam: Player[],
  candidate: Player,
): NewSynergyPreview {
  const teamHasCandidate = currentTeam.some(
    (player) => player.id === candidate.id,
  )
  const nextTeam = teamHasCandidate
    ? currentTeam
    : [...currentTeam, candidate]

  return {
    archetypeSynergies: getNewItemsById(
      getActiveSynergies(currentTeam),
      getActiveSynergies(nextTeam),
    ),
    uniqueSynergies: getNewItemsById(
      getActiveUniqueSynergies(currentTeam),
      getActiveUniqueSynergies(nextTeam),
    ),
  }
}

export function getSynergyEffectTotals(
  synergies: readonly TeamSynergy[],
): SynergyEffectTotals {
  return synergies.reduce<SynergyEffectTotals>(
    (totals, synergy) => ({
      goalConversionBonus:
        totals.goalConversionBonus +
        (synergy.effects.goalConversionBonus ?? 0),
      offensiveParticipationBonus:
        totals.offensiveParticipationBonus +
        (synergy.effects.offensiveParticipationBonus ?? 0),
      finisherSelectionBonus:
        totals.finisherSelectionBonus +
        (synergy.effects.finisherSelectionBonus ?? 0),
      assistChanceBonus:
        totals.assistChanceBonus + (synergy.effects.assistChanceBonus ?? 0),
      defensiveActionBonus:
        totals.defensiveActionBonus +
        (synergy.effects.defensiveActionBonus ?? 0),
      flowChanceBonus:
        totals.flowChanceBonus + (synergy.effects.flowChanceBonus ?? 0),
    }),
    { ...EMPTY_EFFECT_TOTALS },
  )
}

export function getTeamSynergyMultiplier(
  players: Player[],
  effectKey: SynergyEffectKey,
): number {
  return 1 + getSynergyEffectTotals(getAllActiveSynergies(players))[effectKey]
}

export function getTeamSynergyBonus(
  players: Player[],
  effectKey: SynergyEffectKey,
): number {
  return getSynergyEffectTotals(getAllActiveSynergies(players))[effectKey]
}

function appliesToPlayer(
  synergy: TeamSynergy,
  player: Player,
  effectKey: SynergyEffectKey,
): boolean {
  if ((synergy.effects[effectKey] ?? 0) <= 0) {
    return false
  }

  if (effectKey === 'finisherSelectionBonus') {
    if (!player.archetypes?.includes('Finisher')) {
      return false
    }

    return isUniqueSynergy(synergy)
      ? synergy.requiredPlayerIds.includes(player.id)
      : true
  }

  if (effectKey === 'defensiveActionBonus') {
    if (!player.archetypes?.includes('Defender')) {
      return false
    }

    return isUniqueSynergy(synergy)
      ? synergy.requiredPlayerIds.includes(player.id)
      : true
  }

  return true
}

export function getPlayerSynergyMultiplier(
  players: Player[],
  player: Player,
  effectKey: SynergyEffectKey,
): number {
  const bonus = getAllActiveSynergies(players).reduce(
    (total, synergy) =>
      appliesToPlayer(synergy, player, effectKey)
        ? total + (synergy.effects[effectKey] ?? 0)
        : total,
    0,
  )

  return 1 + bonus
}

export function getSynergyEffectSummary(
  synergy: TeamSynergy,
): string {
  return Object.entries(synergy.effects)
    .filter(([, bonus]) => (bonus ?? 0) > 0)
    .map(([effectKey, bonus]) => {
      const percentage = Math.round((bonus ?? 0) * 100)

      return `${effectLabels[effectKey as SynergyEffectKey]} ${percentage}%`
    })
    .join(' / ')
}

function hasRelevantEffect(
  synergy: TeamSynergy,
  role: SynergyImpactRole,
): boolean {
  return roleEffectKeys[role].some(
    (effectKey) => (synergy.effects[effectKey] ?? 0) > 0,
  )
}

function shouldShowSynergyImpact(
  synergy: TeamSynergy,
  role: SynergyImpactRole,
  eventId: number,
): boolean {
  const seed = `${synergy.id}-${role}-${eventId}`
  const hash = [...seed].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  )

  return hash % 100 < 45
}

export function getSynergyImpactMessage(
  players: Player[],
  role: SynergyImpactRole,
  eventId: number,
  options: { force?: boolean } = {},
): string | undefined {
  const candidates = getAllActiveSynergies(players)
    .filter((synergy) => hasRelevantEffect(synergy, role))
    .filter((synergy) => impactPhrases[synergy.id]?.[role])
    .filter(
      (synergy) =>
        options.force || shouldShowSynergyImpact(synergy, role, eventId),
    )
  const synergy =
    candidates.find((candidate) => isUniqueSynergy(candidate)) ??
    candidates[0]

  return synergy ? impactPhrases[synergy.id]?.[role] : undefined
}
