import { useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Trophy, ArrowRight, ShieldCheck } from 'lucide-react'

export default function Success() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const reference = searchParams.get('reference')

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/leaderboard')
    }, 3500)

    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="min-h-[70vh] grid place-items-center">
      <section className="w-full max-w-2xl rounded-[2rem] bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 p-8 md:p-12 text-center shadow-xl">
        <div className="mx-auto h-24 w-24 rounded-full bg-green-50 dark:bg-green-400/10 border border-green-100 dark:border-green-400/20 grid place-items-center">
          <CheckCircle2 className="text-green-700 dark:text-green-300" size={54} />
        </div>

        <p className="mt-7 text-sm font-black uppercase tracking-[0.25em] text-green-700 dark:text-green-300">
          Payment Successful
        </p>

        <h1 className="mt-3 text-4xl md:text-5xl font-black text-slate-950 dark:text-white">
          Your vote has been recorded.
        </h1>

        <p className="mt-5 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
          Thank you for supporting your nominee. Your payment has been submitted for verification and your vote will reflect on the leaderboard shortly.
        </p>

        {reference && (
          <div className="mt-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-300">
              Transaction Reference
            </p>
            <p className="mt-1 font-black text-blue-800 dark:text-yellow-300 break-all">
              {reference}
            </p>
          </div>
        )}

        <div className="mt-8 grid sm:grid-cols-2 gap-3">
          <Link
            to="/leaderboard"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-800 px-6 py-4 font-black text-white shadow-lg hover:bg-blue-900 transition"
          >
            View Leaderboard <Trophy size={19} />
          </Link>

          <Link
            to="/events"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 dark:border-white/10 px-6 py-4 font-black text-blue-800 dark:text-yellow-300 hover:bg-slate-50 dark:hover:bg-white/5 transition"
          >
            Vote Again <ArrowRight size={19} />
          </Link>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-300">
          <ShieldCheck size={18} />
          Redirecting to leaderboard automatically...
        </div>
      </section>
    </div>
  )
}