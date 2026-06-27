import { Link } from 'react-router-dom'
import { ArrowRight, ShieldCheck, UserRound } from 'lucide-react'

export default function NomineeCard({ nominee }) {
  return (
    <article className="group overflow-hidden rounded-[2rem] bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition duration-300">
      <div className="relative h-64 bg-blue-800 overflow-hidden">
        {nominee.image_url ? (
          <img
            src={nominee.image_url}
            alt={nominee.full_name}
            className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-blue-800 grid place-items-center">
            <UserRound className="text-yellow-300" size={70} />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-green-500 px-3 py-1.5 text-xs font-black text-white shadow-lg">
          <ShieldCheck size={14} />
          Voting Open
        </div>

        <div className="absolute left-5 bottom-5 right-5">
          <p className="text-yellow-300 text-sm font-black truncate">
            {nominee.category_name}
          </p>
          <h2 className="text-2xl font-black text-white leading-tight truncate">
            {nominee.full_name}
          </h2>
          <p className="text-sm text-white/85 truncate">
            {nominee.nickname ? `“${nominee.nickname}” • ` : ''}
            {nominee.level} Level
          </p>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
          {nominee.bio || 'Support this nominee by casting a secure verified vote.'}
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-300">Level</p>
            <p className="font-black text-slate-950 dark:text-white">
              {nominee.level || 'N/A'}
            </p>
          </div>

          <div className="rounded-2xl bg-yellow-50 dark:bg-yellow-400/10 border border-yellow-100 dark:border-yellow-400/20 p-4">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-300">Award</p>
            <p className="font-black text-yellow-700 dark:text-yellow-300 truncate">
              Active
            </p>
          </div>
        </div>

        <Link
          to={`/vote/${nominee.slug}`}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-blue-800 px-6 py-3 font-black text-white shadow-lg hover:bg-blue-900 transition"
        >
          Vote Now <ArrowRight size={18} />
        </Link>
      </div>
    </article>
  )
}