import { Link } from 'react-router-dom'
import { ArrowRight, Grid3X3, Trophy } from 'lucide-react'

export default function CategoryCard({ category, eventSlug, index = 0 }) {
  return (
    <Link
      to={`/events/${eventSlug}/categories/${category.slug}`}
      className="group block h-full"
    >
      <article className="h-full overflow-hidden rounded-[2rem] bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition duration-300">
        <div className="relative h-48 bg-blue-800 overflow-hidden">
          {category.cover_url ? (
            <img
              src={category.cover_url}
              alt={category.name}
              className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full bg-blue-800 grid place-items-center">
              <Grid3X3 className="text-yellow-300" size={52} />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

          <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-white/90 backdrop-blur px-3 py-1.5 text-xs font-black text-blue-800 shadow-lg">
            <Trophy size={14} />
            CATEGORY {String(index + 1).padStart(2, '0')}
          </div>

          <div className="absolute left-5 right-5 bottom-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-300">
              Voting Category
            </p>

            <h2 className="mt-1 text-2xl font-black text-white leading-tight">
              {category.name}
            </h2>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <p className="leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-3">
            {category.description ||
              'View nominees in this category and support your favourite contestant.'}
          </p>

          <div className="inline-flex items-center gap-2 font-black text-blue-800 dark:text-yellow-300">
            View Nominees
            <ArrowRight
              size={18}
              className="group-hover:translate-x-1 transition"
            />
          </div>
        </div>
      </article>
    </Link>
  )
}