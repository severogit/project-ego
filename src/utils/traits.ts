import type { Player } from "../types/player";

export type TraitImpactRole = "finisher" | "assistant" | "defender" | "flow";

export interface TraitContext {
  isClutch?: boolean;
}

export interface TraitModifiers {
  shotWeightMultiplier: number;
  goalConversionMultiplier: number;
  assistWeightMultiplier: number;
  offensiveParticipationMultiplier: number;
  defensiveActionWeightMultiplier: number;
  flowChanceMultiplier: number;
  assistedShotConversionMultiplier: number;
}

interface TraitDefinition {
  summary: string;
  modifiers?: Partial<TraitModifiers>;
  clutchModifiers?: Partial<TraitModifiers>;
  phrases?: Partial<Record<TraitImpactRole, (player: Player) => string>>;
}

const DEFAULT_TRAIT_MODIFIERS: TraitModifiers = {
  shotWeightMultiplier: 1,
  goalConversionMultiplier: 1,
  assistWeightMultiplier: 1,
  offensiveParticipationMultiplier: 1,
  defensiveActionWeightMultiplier: 1,
  flowChanceMultiplier: 1,
  assistedShotConversionMultiplier: 1,
};

export const TRAIT_DEFINITIONS: Record<string, TraitDefinition> = {
  "Demon Striker": {
    summary: "Demon Striker: + finalizacoes",
    modifiers: {
      shotWeightMultiplier: 1.4,
      goalConversionMultiplier: 1.25,
      assistWeightMultiplier: 0.1,
    },
    phrases: {
      finisher: (player) => `${player.name} finaliza gracas ao Demon Striker.`,
    },
  },
  "Meta Vision": {
    summary: "Meta Vision: + participacao",
    modifiers: {
      offensiveParticipationMultiplier: 1.25,
      assistWeightMultiplier: 1.25,
    },
    clutchModifiers: {
      flowChanceMultiplier: 1.1,
    },
    phrases: {
      assistant: (player) => `${player.name} le o campo com Meta Vision.`,
      flow: (player) => `${player.name} enxerga o jogo com Meta Vision.`,
    },
  },
  "Perfect Pass": {
    summary: "Perfect Pass: + assistencias",
    modifiers: {
      assistWeightMultiplier: 1.4,
      assistedShotConversionMultiplier: 1.1,
    },
    phrases: {
      assistant: (player) => `${player.name} encontra um passe perfeito.`,
    },
  },
  "World Class Passer": {
    summary: "World Class Passer: + assistencias",
    modifiers: {
      assistWeightMultiplier: 1.6,
      assistedShotConversionMultiplier: 1.15,
    },
    phrases: {
      assistant: (player) => `${player.name} acha um passe de classe mundial.`,
    },
  },
  "The King": {
    summary: "The King: + finalizacoes",
    modifiers: {
      shotWeightMultiplier: 1.35,
      goalConversionMultiplier: 1.15,
      assistWeightMultiplier: 0.6,
    },
    phrases: {
      finisher: (player) => `${player.name} toma a jogada com The King.`,
    },
  },
  "First Touch Genius": {
    summary: "First Touch Genius: + conversao",
    modifiers: {
      goalConversionMultiplier: 1.25,
    },
    phrases: {
      finisher: (player) =>
        `${player.name} domina e finaliza com First Touch Genius.`,
    },
  },
  "Monster Dribble": {
    summary: "Monster Dribble: + participacao",
    modifiers: {
      offensiveParticipationMultiplier: 1.3,
      assistWeightMultiplier: 1.15,
    },
    phrases: {
      finisher: (player) => `${player.name} cria espaco com Monster Dribble.`,
      assistant: (player) =>
        `${player.name} quebra linhas com Monster Dribble.`,
    },
  },
  "Red Panther": {
    summary: "Red Panther: + velocidade ofensiva",
    modifiers: {
      offensiveParticipationMultiplier: 1.2,
      shotWeightMultiplier: 1.08,
    },
    phrases: {
      finisher: (player) => `${player.name} acelera com Red Panther.`,
      assistant: (player) =>
        `${player.name} dispara pela linha com Red Panther.`,
    },
  },
  "Hero Shot": {
    summary: "Hero Shot: + finalizacoes diretas",
    modifiers: {
      shotWeightMultiplier: 1.18,
      goalConversionMultiplier: 1.12,
      offensiveParticipationMultiplier: 1.08,
    },
    phrases: {
      finisher: (player) => `${player.name} finaliza com Hero Shot.`,
    },
  },
  Chameleon: {
    summary: "Chameleon: + versatilidade",
    modifiers: {
      offensiveParticipationMultiplier: 1.08,
      assistWeightMultiplier: 1.08,
      defensiveActionWeightMultiplier: 1.08,
      goalConversionMultiplier: 1.04,
    },
    phrases: {
      finisher: (player) => `${player.name} adapta a jogada com Chameleon.`,
      assistant: (player) =>
        `${player.name} copia a melhor leitura com Chameleon.`,
      defender: (player) => `${player.name} se ajusta com Chameleon.`,
    },
  },
  "Aerial King": {
    summary: "Aerial King: + defesa e jogo aereo",
    modifiers: {
      defensiveActionWeightMultiplier: 1.18,
      shotWeightMultiplier: 1.08,
      goalConversionMultiplier: 1.06,
    },
    phrases: {
      finisher: (player) => `${player.name} sobe com Aerial King.`,
      defender: (player) => `${player.name} domina o alto com Aerial King.`,
    },
  },
  "Monster Physique": {
    summary: "Monster Physique: + defesa fisica",
    modifiers: {
      defensiveActionWeightMultiplier: 1.22,
      flowChanceMultiplier: 1.05,
    },
    phrases: {
      defender: (player) => `${player.name} impoe forca com Monster Physique.`,
      flow: (player) => `${player.name} desperta sua força monstruosa.`,
    },
  },
  "Ball Hunter": {
    summary: "Ball Hunter: + leitura e defesa",
    modifiers: {
      offensiveParticipationMultiplier: 1.08,
      defensiveActionWeightMultiplier: 1.16,
    },
    phrases: {
      finisher: (player) => `${player.name} le a jogada com Ball Hunter.`,
      defender: (player) => `${player.name} caca a bola com Ball Hunter.`,
    },
  },
  "Shadow Runner": {
    summary: "Shadow Runner: + infiltracao",
    modifiers: {
      offensiveParticipationMultiplier: 1.14,
      shotWeightMultiplier: 1.12,
    },
    phrases: {
      finisher: (player) => `${player.name} surge livre com Shadow Runner.`,
    },
  },
  "Street Dribbler": {
    summary: "Street Dribbler: + drible e finalizacao",
    modifiers: {
      offensiveParticipationMultiplier: 1.1,
      shotWeightMultiplier: 1.12,
      goalConversionMultiplier: 1.06,
    },
    phrases: {
      finisher: (player) => `${player.name} cria o chute com Street Dribbler.`,
      assistant: (player) =>
        `${player.name} quebra a marcacao com Street Dribbler.`,
    },
  },
  "Planet Hotline": {
    summary: "Planet Hotline: + apoio ofensivo",
    modifiers: {
      offensiveParticipationMultiplier: 1.14,
      assistWeightMultiplier: 1.16,
    },
    phrases: {
      assistant: (player) =>
        `${player.name} conecta a jogada com Planet Hotline.`,
      finisher: (player) =>
        `${player.name} acompanha a orbita com Planet Hotline.`,
    },
  },
  "Hidden Vision": {
    summary: "Hidden Vision: + leitura defensiva",
    modifiers: {
      offensiveParticipationMultiplier: 1.06,
      assistWeightMultiplier: 1.08,
      defensiveActionWeightMultiplier: 1.16,
    },
    phrases: {
      assistant: (player) => `${player.name} leu o campo com Hidden Vision.`,
      defender: (player) => `${player.name} leu a jogada com Hidden Vision.`,
    },
  },
  "Acceleration Burst": {
    summary: "Acceleration Burst: + arrancada",
    modifiers: {
      offensiveParticipationMultiplier: 1.16,
      shotWeightMultiplier: 1.15,
    },
    phrases: {
      finisher: (player) => `${player.name} explodiu em velocidade.`,
    },
  },
  Duelist: {
    summary: "Duelist: + duelos defensivos",
    modifiers: {
      defensiveActionWeightMultiplier: 1.2,
    },
    clutchModifiers: {
      flowChanceMultiplier: 1.08,
    },
    phrases: {
      defender: (player) => `${player.name} venceu o duelo fisico.`,
      flow: (player) => `${player.name} cresce no duelo com Duelist.`,
    },
  },
  "Ace Pride": {
    summary: "Ace Pride: + responsabilidade",
    modifiers: {
      shotWeightMultiplier: 1.18,
      goalConversionMultiplier: 1.1,
    },
    clutchModifiers: {
      flowChanceMultiplier: 1.12,
    },
    phrases: {
      finisher: (player) =>
        `${player.name} assumiu a responsabilidade como Ace Pride.`,
      flow: (player) => `${player.name} chama o jogo com Ace Pride.`,
    },
  },
  "Zombie Dribble": {
    summary: "Zombie Dribble: + defesa e conducao",
    modifiers: {
      offensiveParticipationMultiplier: 1.1,
      shotWeightMultiplier: 1.06,
      defensiveActionWeightMultiplier: 1.22,
    },
    phrases: {
      finisher: (player) => `${player.name} avancou com Zombie Dribble.`,
      defender: (player) =>
        `${player.name} travou a jogada com Zombie Dribble.`,
    },
  },
  "Creative Imp": {
    summary: "Creative Imp: + criacao imprevisivel",
    modifiers: {
      offensiveParticipationMultiplier: 1.16,
      assistWeightMultiplier: 1.25,
      flowChanceMultiplier: 1.06,
    },
    phrases: {
      assistant: (player) => `${player.name} criou uma jogada imprevisivel.`,
      finisher: (player) =>
        `${player.name} baguncou a defesa com Creative Imp.`,
      flow: (player) => `${player.name} entra no ritmo com Creative Imp.`,
    },
  },
  "Perfect Striker": {
    summary: "Perfect Striker: + finalizacao elite",
    modifiers: {
      shotWeightMultiplier: 1.22,
      goalConversionMultiplier: 1.22,
      flowChanceMultiplier: 1.12,
    },
    phrases: {
      finisher: (player) => `${player.name} finalizou como Perfect Striker.`,
      flow: (player) => `${player.name} ativa instinto de Perfect Striker.`,
    },
  },
  "Samba Dribble": {
    summary: "Samba Dribble: + drible criativo",
    modifiers: {
      offensiveParticipationMultiplier: 1.22,
      assistWeightMultiplier: 1.12,
      shotWeightMultiplier: 1.08,
    },
    phrases: {
      finisher: (player) => `${player.name} quebrou linhas com Samba Dribble.`,
      assistant: (player) => `${player.name} criou com Samba Dribble.`,
    },
  },
  "Master Tactician": {
    summary: "Master Tactician: + estrategia total",
    modifiers: {
      offensiveParticipationMultiplier: 1.12,
      assistWeightMultiplier: 1.22,
      assistedShotConversionMultiplier: 1.12,
      defensiveActionWeightMultiplier: 1.08,
    },
    phrases: {
      assistant: (player) =>
        `${player.name} organizou tudo com Master Tactician.`,
      defender: (player) => `${player.name} antecipou com Master Tactician.`,
    },
  },
  Godspeed: {
    summary: "Godspeed: + velocidade absurda",
    modifiers: {
      offensiveParticipationMultiplier: 1.24,
      shotWeightMultiplier: 1.2,
      goalConversionMultiplier: 1.08,
    },
    phrases: {
      finisher: (player) =>
        `${player.name} desapareceu em velocidade com Godspeed.`,
    },
  },
  "Perfect Physique": {
    summary: "Perfect Physique: + fisico completo",
    modifiers: {
      shotWeightMultiplier: 1.18,
      goalConversionMultiplier: 1.12,
      defensiveActionWeightMultiplier: 1.08,
    },
    phrases: {
      finisher: (player) => `${player.name} impos seu Perfect Physique.`,
      defender: (player) =>
        `${player.name} segurou no fisico com Perfect Physique.`,
    },
  },
  "Two-Footed Support": {
    summary: "Two-Footed Support: + apoio",
    modifiers: {
      offensiveParticipationMultiplier: 1.04,
      assistWeightMultiplier: 1.08,
    },
    phrases: {
      assistant: (player) => `${player.name} apoiou com Two-Footed Support.`,
    },
  },
  "Survival Instinct": {
    summary: "Survival Instinct: + recuperacao",
    modifiers: {
      defensiveActionWeightMultiplier: 1.04,
      flowChanceMultiplier: 1.02,
    },
    phrases: {
      defender: (player) => `${player.name} resistiu com Survival Instinct.`,
    },
  },
  "Quick Man Mark": {
    summary: "Quick Man Mark: + marcacao",
    modifiers: {
      defensiveActionWeightMultiplier: 1.1,
    },
    phrases: {
      defender: (player) => `${player.name} fecha a jogada com Quick Man Mark.`,
    },
  },
  "Steady Balance": {
    summary: "Steady Balance: + equilibrio",
    modifiers: {
      offensiveParticipationMultiplier: 1.04,
      defensiveActionWeightMultiplier: 1.04,
    },
    phrases: {
      finisher: (player) => `${player.name} aparece com Steady Balance.`,
      defender: (player) => `${player.name} cobre o espaco com Steady Balance.`,
    },
  },
  "Patient Read": {
    summary: "Patient Read: + leitura",
    modifiers: {
      assistWeightMultiplier: 1.06,
      defensiveActionWeightMultiplier: 1.06,
    },
    phrases: {
      assistant: (player) => `${player.name} espera a leitura com Patient Read.`,
      defender: (player) => `${player.name} antecipa com Patient Read.`,
    },
  },
  "Body Check": {
    summary: "Body Check: + duelos",
    modifiers: {
      defensiveActionWeightMultiplier: 1.08,
    },
    phrases: {
      defender: (player) => `${player.name} vence o contato com Body Check.`,
    },
  },
  "Link Support": {
    summary: "Link Support: + assistencias",
    modifiers: {
      offensiveParticipationMultiplier: 1.05,
      assistWeightMultiplier: 1.05,
    },
    phrases: {
      assistant: (player) => `${player.name} conecta a jogada com Link Support.`,
    },
  },
  "Tight Mark": {
    summary: "Tight Mark: + marcacao",
    modifiers: {
      defensiveActionWeightMultiplier: 1.09,
    },
    phrases: {
      defender: (player) => `${player.name} gruda na marcacao com Tight Mark.`,
    },
  },
  "Quiet Technique": {
    summary: "Quiet Technique: + tecnica",
    modifiers: {
      offensiveParticipationMultiplier: 1.05,
      shotWeightMultiplier: 1.04,
    },
    phrases: {
      finisher: (player) => `${player.name} finaliza com Quiet Technique.`,
    },
  },
  "Off-Ball Run": {
    summary: "Off-Ball Run: + movimentacao",
    modifiers: {
      offensiveParticipationMultiplier: 1.08,
      shotWeightMultiplier: 1.05,
    },
    phrases: {
      finisher: (player) => `${player.name} ataca o espaco com Off-Ball Run.`,
    },
  },
  Destroyer: {
    summary: "Destroyer: + ataque e defesa",
    modifiers: {
      shotWeightMultiplier: 1.15,
      defensiveActionWeightMultiplier: 1.15,
      flowChanceMultiplier: 1.1,
    },
    phrases: {
      finisher: (player) => `${player.name} ataca com Destroyer.`,
      defender: (player) => `${player.name} corta a jogada com Destroyer.`,
      flow: (player) => `${player.name} entra em FLOW com Destroyer.`,
    },
  },
  "Kaiser Impact": {
    summary: "Kaiser Impact: + conversao",
    modifiers: {
      goalConversionMultiplier: 1.35,
      shotWeightMultiplier: 1.25,
    },
    phrases: {
      finisher: () => "Kaiser Impact decide a jogada.",
    },
  },
  "Obsessive Support": {
    summary: "Obsessive Support: + assistencias",
    modifiers: {
      assistWeightMultiplier: 1.35,
      assistedShotConversionMultiplier: 1.1,
    },
    phrases: {
      assistant: (player) => `${player.name} serve o finalizador com obsessao.`,
    },
  },
  "Wild Reflexes": {
    summary: "Wild Reflexes: + defesa",
    modifiers: {
      defensiveActionWeightMultiplier: 1.35,
    },
    phrases: {
      defender: (player) => `${player.name} reage com Wild Reflexes.`,
    },
  },
  "Last Wall": {
    summary: "Last Wall: + defesa",
    modifiers: {
      defensiveActionWeightMultiplier: 1.4,
    },
    phrases: {
      defender: (player) => `${player.name} bloqueia com Last Wall.`,
    },
  },
};

function getTraitName(player: Player): string | undefined {
  return player.trait?.name;
}

export function getTraitDefinition(
  player: Player,
): TraitDefinition | undefined {
  const traitName = getTraitName(player);

  return traitName ? TRAIT_DEFINITIONS[traitName] : undefined;
}

export function getTraitModifiers(
  player: Player,
  context: TraitContext = {},
): TraitModifiers {
  const definition = getTraitDefinition(player);

  if (!definition) {
    return DEFAULT_TRAIT_MODIFIERS;
  }

  return {
    ...DEFAULT_TRAIT_MODIFIERS,
    ...definition.modifiers,
    ...(context.isClutch ? definition.clutchModifiers : undefined),
  };
}

export function getShotTraitWeight(
  player: Player,
  baseWeight: number,
  context: TraitContext = {},
): number {
  const modifiers = getTraitModifiers(player, context);

  return (
    baseWeight *
    modifiers.offensiveParticipationMultiplier *
    modifiers.shotWeightMultiplier
  );
}

export function getAssistTraitWeight(
  player: Player,
  baseWeight: number,
  context: TraitContext = {},
): number {
  const modifiers = getTraitModifiers(player, context);

  return (
    baseWeight *
    modifiers.offensiveParticipationMultiplier *
    modifiers.assistWeightMultiplier
  );
}

export function getDefensiveActionTraitWeight(
  player: Player,
  baseWeight: number,
  context: TraitContext = {},
): number {
  return (
    baseWeight *
    getTraitModifiers(player, context).defensiveActionWeightMultiplier
  );
}

export function getGoalConversionTraitMultiplier(
  finisher: Player,
  assistant?: Player,
  context: TraitContext = {},
): number {
  const finisherModifiers = getTraitModifiers(finisher, context);
  const assistantModifiers = assistant
    ? getTraitModifiers(assistant, context)
    : DEFAULT_TRAIT_MODIFIERS;

  return (
    finisherModifiers.goalConversionMultiplier *
    assistantModifiers.assistedShotConversionMultiplier
  );
}

export function getFlowChanceTraitMultiplier(
  player: Player,
  context: TraitContext = {},
): number {
  return getTraitModifiers(player, context).flowChanceMultiplier;
}

export function getTraitImpactSummary(player: Player): string {
  return getTraitDefinition(player)?.summary ?? "-";
}

function getRoleImpactMultiplier(
  player: Player,
  role: TraitImpactRole,
  context: TraitContext,
): number {
  const modifiers = getTraitModifiers(player, context);

  if (role === "finisher") {
    return (
      modifiers.offensiveParticipationMultiplier *
      modifiers.shotWeightMultiplier *
      modifiers.goalConversionMultiplier
    );
  }

  if (role === "assistant") {
    return (
      modifiers.offensiveParticipationMultiplier *
      modifiers.assistWeightMultiplier *
      modifiers.assistedShotConversionMultiplier
    );
  }

  if (role === "defender") {
    return modifiers.defensiveActionWeightMultiplier;
  }

  return modifiers.flowChanceMultiplier;
}

function shouldShowTraitImpact(
  player: Player,
  role: TraitImpactRole,
  eventId: number,
  traitName: string,
): boolean {
  const seed = `${player.id}-${eventId}-${role}-${traitName}`;
  const hash = [...seed].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );

  return hash % 100 < 55;
}

export function getTraitImpactMessage(
  player: Player,
  role: TraitImpactRole,
  eventId: number,
  context: TraitContext = {},
  options: { force?: boolean } = {},
): string | undefined {
  const traitName = getTraitName(player);
  const definition = getTraitDefinition(player);
  const phrase = definition?.phrases?.[role];

  if (
    !traitName ||
    !phrase ||
    getRoleImpactMultiplier(player, role, context) === 1 ||
    (!options.force && !shouldShowTraitImpact(player, role, eventId, traitName))
  ) {
    return undefined;
  }

  return phrase(player);
}
