export default function StatCard({ icon: Icon, label, value, tone = 'blue' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-800 border-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-400/20',
    gold: 'bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-400/10 dark:text-yellow-300 dark:border-yellow-400/20',
    green: 'bg-green-50 text-green-700 border-green-100 dark:bg-green-400/10 dark:text-green-300 dark:border-green-400/20',
  }

  return (
    <div className="rounded-[1.5rem] bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 p-5 shadow-lg">
      <div className={`h-12 w-12 rounded-2xl border grid place-items-center ${tones[tone]}`}>
        {Icon && <Icon size={23} />}
      </div>

      <p className="mt-5 text-3xl font-black text-slate-950 dark:text-white">
        {value}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-300">
        {label}
      </p>
    </div>
  )
}