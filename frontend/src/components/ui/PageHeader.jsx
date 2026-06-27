export default function PageHeader({
  eyebrow,
  title,
  description,
  action,
  children,
  className = '',
}) {
  return (
    <section
      className={`relative overflow-hidden rounded-[2rem] bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 shadow-xl ${className}`}
    >
      <div className="absolute right-[-80px] top-[-80px] h-56 w-56 rounded-full bg-blue-200/60 dark:bg-blue-500/20 blur-3xl" />
      <div className="absolute left-[-80px] bottom-[-80px] h-56 w-56 rounded-full bg-green-200/70 dark:bg-green-500/20 blur-3xl" />

      <div className="relative p-6 sm:p-8 md:p-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="max-w-3xl">
            {eyebrow && (
              <p className="text-sm font-black uppercase tracking-[0.22em] text-green-700 dark:text-green-300">
                {eyebrow}
              </p>
            )}

            <h1 className="mt-3 text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight text-slate-950 dark:text-white">
              {title}
            </h1>

            {description && (
              <p className="mt-4 text-base sm:text-lg md:text-xl leading-relaxed text-slate-600 dark:text-slate-300">
                {description}
              </p>
            )}
          </div>

          {action && <div className="shrink-0">{action}</div>}
        </div>

        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  )
}