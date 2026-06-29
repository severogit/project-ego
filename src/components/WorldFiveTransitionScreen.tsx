import type { Player } from '../types/player'

interface WorldFiveTransitionScreenProps {
  team: Player[]
  onChallengeWorldFive: () => void
}

function WorldFiveTransitionScreen({ onChallengeWorldFive }: WorldFiveTransitionScreenProps) {
  return (
    <section className="relative z-10 mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-4xl flex-col items-center justify-center text-center">
      <span className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-300">
        Voce conquistou o torneio
      </span>
      <h1 className="mt-4 text-4xl font-black uppercase italic tracking-tight text-white sm:text-6xl">
        O torneio era apenas o comeco
      </h1>
      <p className="mt-5 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
        Seu ego superou todos os adversarios ate aqui. Agora chegou a hora de
        enfrentar aqueles que inspiraram o Blue Lock.
      </p>

      <article className="mt-8 border border-blue-300/30 bg-blue-500/[0.08] px-7 py-6 shadow-[0_24px_70px_rgba(37,99,235,0.16)]">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-300">
          Desafio final
        </p>
        <h2 className="mt-2 text-5xl font-black uppercase italic text-white sm:text-7xl">
          World Five
        </h2>
      </article>

      <button
        type="button"
        onClick={onChallengeWorldFive}
        className="mt-8 bg-blue-600 px-8 py-4 text-sm font-black uppercase tracking-[0.16em] text-white shadow-[0_0_42px_rgba(37,99,235,0.38)] transition duration-200 hover:bg-blue-500 hover:shadow-[0_0_58px_rgba(37,99,235,0.52)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-400"
      >
        Enfrentar o World Five
      </button>
    </section>
  )
}

export default WorldFiveTransitionScreen
