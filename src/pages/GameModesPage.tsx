import { Link } from 'react-router-dom'

interface FutureMode {
  name: string
  tag: string
  description: string
}

const futureModes: FutureMode[] = [
  {
    name: 'Neo Egoist League',
    tag: 'Em breve',
    description: 'A proxima etapa da jornada.',
  },
  {
    name: 'Ranked',
    tag: 'Em breve',
    description: 'Competicoes sazonais.',
  },
  {
    name: 'Eventos',
    tag: 'Em breve',
    description: 'Modos temporarios e desafios especiais.',
  },
]

const campaignSteps = [
  'Draft Inicial',
  'Recrutamento',
  'Fase de Grupos',
  'Mata-mata',
  'World Five',
]

const modeHighlights = [
  'Campanha Principal',
  'Modo Solo',
  'Progressao Completa',
]

function GameModesPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05070b] px-4 pb-14 pt-24 text-white sm:px-6 lg:px-7">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <div className="absolute left-1/2 top-20 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-blue-600/15 blur-[130px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.035)_1px,transparent_1px)] bg-[size:52px_52px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#05070b_72%)]" />
      </div>

      <section className="relative z-10 mx-auto w-full max-w-6xl">
        <header className="max-w-3xl">
          <span className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-300">
            Modos de jogo
          </span>
          <h1 className="mt-3 text-4xl font-black uppercase italic tracking-tight text-white sm:text-5xl">
            Escolha o desafio
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            A campanha principal vive aqui, e novos modos podem entrar sem
            mudar a estrutura de navegacao.
          </p>
        </header>

        <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.55fr)]">
          <article className="relative overflow-hidden border border-blue-300/30 bg-blue-500/[0.07] p-5 shadow-[0_24px_70px_rgba(37,99,235,0.12)] transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out hover:-translate-y-1.5 hover:scale-[1.01] hover:border-blue-200/70 hover:bg-blue-500/[0.095] hover:shadow-[0_0_0_1px_rgba(147,197,253,0.16),0_30px_88px_rgba(37,99,235,0.28)] sm:p-6">
            <div
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(96,165,250,0.16),transparent_46%)]"
              aria-hidden="true"
            />
            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="border border-blue-200/35 bg-blue-200/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-blue-100">
                  Disponivel
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  Campanha
                </span>
              </div>

              <h2 className="mt-8 text-3xl font-black uppercase italic leading-none text-white sm:text-4xl">
                World 5 Challenge
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
                Monte seu time atraves do Draft Inicial, evolua durante o
                torneio e prove seu ego enfrentando o lendario World Five.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {modeHighlights.map((highlight) => (
                  <span
                    key={highlight}
                    className="border border-blue-300/20 bg-blue-300/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-blue-100"
                  >
                    {highlight}
                  </span>
                ))}
              </div>

              <div className="mt-6 border border-white/10 bg-black/20 p-3">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600">
                  Resumo da campanha
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-5">
                  {campaignSteps.map((step, index) => (
                    <div
                      key={step}
                      className="relative border border-blue-300/15 bg-blue-300/[0.055] px-2.5 py-2 before:pointer-events-none before:absolute before:left-full before:top-1/2 before:hidden before:h-px before:w-2 before:bg-blue-300/25 sm:before:block sm:last:before:hidden"
                    >
                      <span className="font-mono text-[10px] font-black text-blue-200">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <p className="mt-1 text-[9px] font-black uppercase tracking-[0.12em] text-zinc-300">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-7 flex flex-col items-center gap-3 border-t border-white/10 pt-5 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-200/80">
                  Campanha Principal
                </p>
                <Link
                  to="/campaign"
                  className="inline-flex min-w-52 items-center justify-center bg-blue-600 px-12 py-4.5 text-sm font-black uppercase tracking-[0.18em] text-white shadow-[0_0_42px_rgba(37,99,235,0.4)] transition duration-200 hover:-translate-y-1 hover:scale-[1.025] hover:bg-blue-500 hover:shadow-[0_0_62px_rgba(37,99,235,0.58)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-400"
                >
                  Jogar
                </Link>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600">
                  Primeira Campanha
                </p>
              </div>
            </div>
          </article>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {futureModes.map((mode) => (
              <article
                key={mode.name}
                className="relative min-h-36 overflow-hidden border border-white/10 bg-white/[0.035] p-4 opacity-78 transition-[filter,border-color,background-color,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.05] hover:brightness-110"
              >
                <div
                  className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(148,163,184,0.08),transparent_45%)]"
                  aria-hidden="true"
                />
                <div className="relative flex h-full flex-col">
                  <span className="w-fit border border-zinc-500/30 bg-zinc-500/10 px-2 py-1 text-[8px] font-black uppercase tracking-[0.18em] text-zinc-400">
                    {mode.tag}
                  </span>
                  <h3 className="mt-5 text-lg font-black uppercase italic leading-tight text-zinc-300">
                    {mode.name}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                    {mode.description}
                  </p>
                  <p className="mt-auto pt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-700">
                    Bloqueado
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

export default GameModesPage
