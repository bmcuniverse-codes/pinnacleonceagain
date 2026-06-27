import { motion } from 'framer-motion'
import { initials } from '../../lib/helpers'

export default function MovingProgressBar({ nominee, percentage = 0, rank }) {
  const safePercentage = Math.max(4, Math.min(Number(percentage) || 0, 96))

  return (
    <article className="rounded-[1.75rem] bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 p-4 sm:p-5 shadow-lg">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          {rank && (
            <div className="h-10 w-10 rounded-2xl bg-blue-800 text-yellow-300 grid place-items-center font-black shrink-0">
              {rank}
            </div>
          )}

          <div className="min-w-0">
            <p className="font-black text-lg text-slate-950 dark:text-white truncate">
              {nominee?.full_name}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300 truncate">
              {nominee?.nickname ? `“${nominee.nickname}” • ` : ''}
              {nominee?.level} Level
            </p>
            <p className="mt-1 text-sm font-black text-blue-800 dark:text-yellow-300 truncate">
              {nominee?.category_name}
            </p>
          </div>
        </div>

        <span className="rounded-full bg-green-50 dark:bg-green-400/10 px-3 py-1 text-xs font-black text-green-700 dark:text-green-300 shrink-0">
          Progress
        </span>
      </div>

      <div className="relative h-8 rounded-full bg-slate-200 dark:bg-slate-800 overflow-visible border border-slate-300 dark:border-white/10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${safePercentage}%` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="absolute left-0 top-0 h-full rounded-full bg-blue-800"
        />

        <motion.div
          initial={{ left: 0 }}
          animate={{ left: `calc(${safePercentage}% - 20px)` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="absolute top-1/2 -translate-y-1/2 h-14 w-14 rounded-full bg-white dark:bg-[#061425] border-4 border-yellow-400 shadow-xl overflow-hidden"
        >
          {nominee?.image_url ? (
            <img
              src={nominee.image_url}
              alt={nominee.full_name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full bg-blue-800 text-yellow-300 grid place-items-center text-sm font-black">
              {initials(nominee?.full_name)}
            </div>
          )}
        </motion.div>
      </div>
    </article>
  )
}