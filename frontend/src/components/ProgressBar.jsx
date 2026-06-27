import { motion } from 'framer-motion'
import Avatar from './Avatar'

export default function ProgressBar({ nominee, percentage = 0 }) {
  const safePercentage = Math.max(4, Math.min(Number(percentage) || 0, 96))

  return (
    <div className="rounded-[1.75rem] bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 p-4 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-black text-slate-900 dark:text-white truncate">
            {nominee?.full_name}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300 truncate">
            {nominee?.nickname ? `“${nominee.nickname}” • ` : ''}
            {nominee?.level} Level
          </p>
          <p className="mt-1 text-sm font-bold text-blue-700 dark:text-yellow-300 truncate">
            {nominee?.category_name}
          </p>
        </div>

        <span className="rounded-full bg-green-50 dark:bg-green-400/10 px-3 py-1 text-xs font-black text-green-700 dark:text-green-300 shrink-0">
          Progress
        </span>
      </div>

      <div className="relative h-7 rounded-full bg-slate-200 dark:bg-slate-800 overflow-visible border border-slate-300 dark:border-white/10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${safePercentage}%` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="absolute left-0 top-0 h-full rounded-full bg-blue-700"
        />

        <motion.div
          initial={{ left: 0 }}
          animate={{ left: `calc(${safePercentage}% - 18px)` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="absolute top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white dark:bg-[#061425] border-4 border-yellow-400 shadow-lg overflow-hidden"
        >
          {nominee?.image_url ? (
            <img
              src={nominee.image_url}
              alt={nominee.full_name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <Avatar src={nominee?.image_url} name={nominee?.full_name} size="h-full w-full" />
          )}
        </motion.div>
      </div>
    </div>
  )
}