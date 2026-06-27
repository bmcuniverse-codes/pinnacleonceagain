import { Link } from 'react-router-dom'
import { ArrowRight, ShieldCheck, Trophy, Sparkles } from 'lucide-react'

export default function HeroSection() {
  return (
    <section className="grid lg:grid-cols-2 gap-10 items-center min-h-[72vh]">
      <div className="space-y-7">
        <div className="inline-flex items-center gap-2 rounded-full bg-green-50 dark:bg-green-400/10 border border-green-100 dark:border-green-400/20 px-4 py-2 text-sm font-black text-green-700 dark:text-green-300">
          <ShieldCheck size={16} />
          Verified voting for LASUSTECH events
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tight text-slate-950 dark:text-white">
          Celebrate excellence. Vote with confidence.
        </h1>

        <p className="max-w-xl text-lg sm:text-xl leading-relaxed text-slate-600 dark:text-slate-300">
          Support your favourite nominees through secure paid voting. Every confirmed payment is recorded transparently and reflected on the public leaderboard.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/events" className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-800 px-7 py-4 font-black text-white shadow-lg hover:bg-blue-900 transition">
            Start Voting <ArrowRight size={19} />
          </Link>

          <Link to="/leaderboard" className="inline-flex items-center justify-center rounded-full border border-slate-200 dark:border-white/10 px-7 py-4 font-black text-blue-800 dark:text-yellow-300 hover:bg-slate-100 dark:hover:bg-white/10 transition">
            View Leaderboard
          </Link>
        </div>
      </div>

      <div className="relative">
        <div className="rounded-[2.2rem] bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 p-5 shadow-2xl">
          <div className="rounded-[1.8rem] bg-blue-800 p-6 text-white relative overflow-hidden">
            <div className="absolute right-[-40px] top-[-40px] h-32 w-32 rounded-full bg-yellow-400/80" />
            <div className="absolute left-[-40px] bottom-[-40px] h-36 w-36 rounded-full bg-green-500/60" />

            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-black text-yellow-300">CBS Awards</p>
                  <h2 className="mt-2 text-3xl font-black">Current Standings</h2>
                </div>
                <Trophy className="text-yellow-300" size={46} />
              </div>

              <div className="mt-8 space-y-4">
                {[
                  ['Most Popular Student', '82%'],
                  ['Best Dressed', '64%'],
                  ['Entrepreneur of the Year', '48%'],
                ].map(([title, width]) => (
                  <div key={title} className="rounded-3xl bg-white/10 p-4">
                    <div className="flex justify-between gap-3">
                      <p className="font-black">{title}</p>
                      <Sparkles className="text-yellow-300" size={18} />
                    </div>
                    <div className="mt-3 h-3 rounded-full bg-white/20 overflow-hidden">
                      <div className="h-full rounded-full bg-yellow-400" style={{ width }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}