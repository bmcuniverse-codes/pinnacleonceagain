import { Link } from 'react-router-dom'
import { ShieldCheck, Trophy, BarChart3 } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid md:grid-cols-[1.2fr_.8fr_.8fr] gap-8">
          <div>
            <Link to="/" className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-blue-800 grid place-items-center text-yellow-300 font-black text-xl shadow-lg">
                V
              </div>

              <div>
                <h2 className="text-2xl font-black text-blue-800 dark:text-yellow-300">
                  VoteWave
                </h2>

                <p className="text-xs font-bold text-green-700 dark:text-green-300">
                  LASUSTECH Voting Platform
                </p>
              </div>
            </Link>

            <p className="mt-5 max-w-md text-slate-600 dark:text-slate-300 leading-relaxed">
              A secure paid voting platform designed for school awards, campus events and transparent nominee-based voting.
            </p>
          </div>

          <div>
            <h3 className="font-black text-slate-950 dark:text-white">
              Navigate
            </h3>

            <div className="mt-4 space-y-3 text-sm font-bold text-slate-600 dark:text-slate-300">
              <Link
                className="block hover:text-blue-800 dark:hover:text-yellow-300"
                to="/events"
              >
                Events
              </Link>

              <Link
                className="block hover:text-blue-800 dark:hover:text-yellow-300"
                to="/leaderboard"
              >
                Leaderboard
              </Link>

              <Link
                className="block hover:text-blue-800 dark:hover:text-yellow-300"
                to="/admin/login"
              >
                Admin Login
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-black text-slate-950 dark:text-white">
              Trust
            </h3>

            <div className="mt-4 space-y-3 text-sm font-bold text-slate-600 dark:text-slate-300">
              <p className="flex items-center gap-2">
                <ShieldCheck size={17} />
                Verified payments
              </p>

              <p className="flex items-center gap-2">
                <Trophy size={17} />
                Category awards
              </p>

              <p className="flex items-center gap-2">
                <BarChart3 size={17} />
                Private vote totals
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row justify-between gap-3 text-sm text-slate-500 dark:text-slate-400">
          <p>
            © {new Date().getFullYear()} VoteWave. All rights reserved.
          </p>

          <p>
            Built for secure and transparent school voting. By{' '}
            <a
              href="https://wa.me/2348104535145"
              target="_blank"
              rel="noopener noreferrer"
              className="font-black text-blue-800 hover:text-green-700 dark:text-yellow-300 dark:hover:text-green-300"
            >
              BMC Pinnacle
            </a>{' '}
            x{' '}
            <a
              href="https://wa.me/234XXXXXXXXXX"
              target="_blank"
              rel="noopener noreferrer"
              className="font-black text-blue-800 hover:text-green-700 dark:text-yellow-300 dark:hover:text-green-300"
            >
              YGril
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
