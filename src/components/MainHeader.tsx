import { Link, NavLink, useLocation } from 'react-router-dom'

const navigationItems = [
  {
    label: 'Jogar',
    to: '/game-modes',
    activePaths: ['/game-modes', '/campaign', '/draft'],
  },
  {
    label: 'Colecao',
    to: '/collection',
    activePaths: ['/collection'],
  },
]

function MainHeader() {
  const location = useLocation()

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-blue-300/15 bg-[#05070b]/88 text-white shadow-[0_14px_44px_rgba(0,0,0,0.32)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[96rem] items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6 lg:px-7">
        <Link
          to="/"
          className="group flex items-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-400"
          aria-label="Project Ego Home"
        >
          <span className="text-xs font-black uppercase italic tracking-[0.16em] text-white transition group-hover:text-blue-100 sm:text-sm sm:tracking-[0.2em]">
            Project Ego
          </span>
        </Link>

        <nav
          className="flex items-center gap-1 border border-white/10 bg-white/[0.035] p-1"
          aria-label="Navegacao principal"
        >
          {navigationItems.map((item) => {
            const isCurrent = item.activePaths.includes(location.pathname)

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`px-2.5 py-2 text-[10px] font-black uppercase tracking-[0.12em] transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 sm:px-4 sm:text-xs sm:tracking-[0.18em] ${
                  isCurrent
                    ? 'bg-blue-500 text-white shadow-[0_0_22px_rgba(59,130,246,0.28)]'
                    : 'text-zinc-500 hover:bg-blue-300/[0.08] hover:text-blue-100'
                }`}
              >
                {item.label}
              </NavLink>
            )
          })}
        </nav>
      </div>
    </header>
  )
}

export default MainHeader
