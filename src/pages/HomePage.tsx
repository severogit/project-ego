import { Link } from 'react-router-dom'

function HomePage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#05070b] px-6 py-16 text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        aria-hidden="true"
      >
        <div className="absolute left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-cyan-400/10 blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <section className="relative z-10 mx-auto flex max-w-4xl flex-col items-center text-center">
        <span className="mb-6 rounded-full border border-blue-400/25 bg-blue-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-blue-300">
          O campo espera por você
        </span>

        <h1 className="bg-gradient-to-b from-white via-white to-blue-300 bg-clip-text text-6xl font-black uppercase italic tracking-[-0.06em] text-transparent sm:text-7xl md:text-8xl">
          Project Ego
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg md:text-xl">
          Monte o time definitivo e prove que seu ego merece o topo.
        </p>

        <Link
          to="/draft"
          className="group mt-10 inline-flex items-center gap-3 rounded-sm bg-blue-600 px-8 py-4 text-sm font-black uppercase tracking-[0.16em] text-white shadow-[0_0_40px_rgba(37,99,235,0.3)] transition duration-300 hover:-translate-y-1 hover:bg-blue-500 hover:shadow-[0_0_55px_rgba(37,99,235,0.45)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-400"
        >
          Iniciar Projeto
          <span
            className="text-xl transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          >
            →
          </span>
        </Link>
      </section>

      <p className="absolute bottom-6 text-[10px] font-semibold uppercase tracking-[0.35em] text-zinc-700">
        Talento não basta
      </p>
    </main>
  )
}

export default HomePage
