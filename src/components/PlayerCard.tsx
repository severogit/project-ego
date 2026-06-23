import type { Player, Rarity } from "../types/player";
import { calculatePlayerPower, playerAttributes } from "../utils/draft";
import PlayerImage from "./PlayerImage";

interface PlayerCardProps {
  player: Player;
  onSelect: (player: Player) => void;
}

const rarityStyles: Record<Rarity, string> = {
  Common: "border-zinc-600 bg-zinc-500/10 text-zinc-300",
  Rare: "border-blue-500 bg-blue-500/10 text-blue-300",
  Epic: "border-violet-500 bg-violet-500/10 text-violet-300",
  Legendary: "border-amber-400 bg-amber-400/10 text-amber-300",
  Egoist: "border-rose-500 bg-rose-500/10 text-rose-300",
};

const attributeLabels = {
  attack: "Ataque",
  speed: "Velocidade",
  vision: "Visão",
  dribble: "Drible",
  defense: "Defesa",
  ego: "Ego",
};

function PlayerCard({ player, onSelect }: PlayerCardProps) {
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
  );
}

export default PlayerCard;
