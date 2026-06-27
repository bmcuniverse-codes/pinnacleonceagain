import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import Footer from '../components/ui/Footer'
import { Home, Trophy, Vote, BarChart3, Menu, Moon, Sun, X } from 'lucide-react'

const navLink = ({ isActive }) =>
  `font-bold transition ${
    isActive
      ? 'text-blue-700 dark:text-yellow-300'
      : 'text-slate-700 hover:text-blue-700 dark:text-slate-200 dark:hover:text-yellow-300'
  }`

const mobileLink = ({ isActive }) =>
  `block rounded-2xl px-4 py-3 font-black transition ${
    isActive
      ? 'bg-blue-800 text-white dark:bg-yellow-400 dark:text-blue-950'
      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10'
  }`

const bottomItem = ({ isActive }) =>
  `flex flex-col items-center gap-1 text-[11px] font-bold ${
    isActive
      ? 'text-blue-700 dark:text-yellow-300'
      : 'text-slate-500 dark:text-slate-300'
  }`

export default function PublicLayout() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('votewave-theme') === 'dark'
  })

  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('votewave-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('votewave-theme', 'light')
    }
  }, [darkMode])

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-50 text-slate-900 dark:bg-[#061425] dark:text-white pb-24 md:pb-0 transition-colors duration-300">
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#061425]/95 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 shadow-sm">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-blue-800 grid place-items-center text-yellow-300 font-black text-xl shadow-lg shrink-0">
              V
            </div>

            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-black leading-none text-blue-800 dark:text-yellow-300">
                VoteWave
              </h1>
              <p className="text-[9px] sm:text-[10px] tracking-[0.22em] text-green-700 dark:text-green-300 uppercase truncate">
                LASUSTECH Voting
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <NavLink to="/" className={navLink}>Home</NavLink>
            <NavLink to="/events" className={navLink}>Events</NavLink>
            <NavLink to="/leaderboard" className={navLink}>Leaderboard</NavLink>
            <NavLink to="/admin/login" className={navLink}>Admin</NavLink>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setDarkMode(prev => !prev)}
              className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/10 grid place-items-center shadow-sm"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun size={20} className="text-yellow-300" /> : <Moon size={20} className="text-blue-800" />}
            </button>

            <Link
              to="/events"
              className="hidden md:inline-flex rounded-full bg-blue-800 px-7 py-3 text-white font-black shadow-xl hover:bg-blue-900 transition"
            >
              Start Voting
            </Link>

            <button
              onClick={() => setMenuOpen(prev => !prev)}
              className="md:hidden h-10 w-10 sm:h-11 sm:w-11 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/10 grid place-items-center shadow-sm"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#061425] px-4 pb-4">
            <nav className="space-y-2 pt-4">
              <NavLink onClick={() => setMenuOpen(false)} to="/" className={mobileLink}>Home</NavLink>
              <NavLink onClick={() => setMenuOpen(false)} to="/events" className={mobileLink}>Events</NavLink>
              <NavLink onClick={() => setMenuOpen(false)} to="/leaderboard" className={mobileLink}>Leaderboard</NavLink>
              <NavLink onClick={() => setMenuOpen(false)} to="/admin/login" className={mobileLink}>Admin Login</NavLink>
            </nav>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet />
      </main>
           <Footer />
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#061425] border-t border-slate-200 dark:border-white/10 safe-bottom px-6 pt-3 flex justify-between shadow-2xl">
        <NavLink to="/" className={bottomItem}><Home size={21}/>Home</NavLink>
        <NavLink to="/events" className={bottomItem}><Trophy size={21}/>Events</NavLink>
        <NavLink to="/leaderboard" className={bottomItem}><BarChart3 size={21}/>Board</NavLink>
        <NavLink to="/admin/login" className={bottomItem}><Vote size={21}/>Admin</NavLink>
      </nav>
   
    </div>
  )
}