export default function Section({ eyebrow, title, description, children, className = '' }) {
  return (
    <section className={`space-y-7 ${className}`}>
      {(eyebrow || title || description) && (
        <div className="max-w-3xl">
          {eyebrow && (
            <p className="text-sm font-black uppercase tracking-[0.22em] text-green-700 dark:text-green-300">
              {eyebrow}
            </p>
          )}

          {title && (
            <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-950 dark:text-white">
              {title}
            </h2>
          )}

          {description && (
            <p className="mt-4 text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300">
              {description}
            </p>
          )}
        </div>
      )}

      {children}
    </section>
  )
}