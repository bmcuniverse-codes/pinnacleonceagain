import { Trophy } from 'lucide-react'

export default function EmptyState({
  icon: Icon = Trophy,
  title = 'Nothing here yet',
  description = 'Content added by the admin will appear here.',
}) {
  return (
    <div className="rounded-[2rem] bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 p-8 text-center shadow-lg">
      <div className="mx-auto h-16 w-16 rounded-2xl bg-yellow-50 dark:bg-yellow-400/10 border border-yellow-100 dark:border-yellow-400/20 grid place-items-center">
        <Icon className="text-yellow-600 dark:text-yellow-300" size={34} />
      </div>

      <h2 className="mt-5 text-2xl font-black text-slate-950 dark:text-white">
        {title}
      </h2>

      <p className="mt-2 max-w-md mx-auto text-slate-600 dark:text-slate-300">
        {description}
      </p>
    </div>
  )
}