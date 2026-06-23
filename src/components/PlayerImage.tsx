import type { Player } from "../types/player";

interface PlayerImageProps {
  player: Player;
  className?: string;
  imageClassName?: string;
  eager?: boolean;
}

function getPlayerInitials(name: string): string {
  return name
    .split(" ")
    .map((namePart) => namePart[0])
    .join("")
    .slice(0, 2);
}

function PlayerImage({
  player,
  className = "",
  imageClassName = "",
  eager = false,
}: PlayerImageProps) {
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-zinc-900 via-[#0a1427] to-[#08152c] ${className}`}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div
          className="absolute h-2/3 w-2/3 rounded-full bg-blue-500/15 blur-3xl"
          aria-hidden="true"
        />
        <span className="relative text-4xl font-black italic tracking-tighter text-white/85 sm:text-5xl">
          {getPlayerInitials(player.name)}
        </span>
        <span className="relative mt-2 text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-600">
          No Image
        </span>
      </div>

      {player.image && (
        <img
          src={player.image}
          alt={player.name}
          loading={eager ? "eager" : "lazy"}
          draggable="false"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
          className={`absolute inset-0 h-full w-full object-contain object-center ${imageClassName}`}
        />
      )}
    </div>
  );
}

export default PlayerImage;
