import { Link } from 'react-router-dom'
import { ArrowRight, Grid3X3, Trophy } from 'lucide-react'

export default function CategoryCard({ category, eventSlug, index = 0 }) {
  return (
    <Link to={`/events/${eventSlug}/categories/${category.slug}`} className="group block h-full">
      <article className="h-full overflow-hidden rounded-[2rem] bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition duration-300">
        <div className="relative h-36 bg-blue-800 overflow-hidden">
          <div className="absolute inset-0 bg-blue-800" />
          <div className="absolute right-[-35px] top-[-35px] h-28 w-28 rounded-full bg-yellow-400/80" />
          <div className="absolute left-[-40px] bottom-[-40px] h-32 w-32 rounded-full bg-green-500/70" />

          <div className="relative h-full p-6 flex items-center justify-between text-white">
            <div>
              <p className="text-xs font-black text-yellow-300 tracking-[0.18em]">
                CATEGORY {String(index + 1).padStart(2, '0')}
              </p>
              <Grid3X3 className="mt-4" size={34} />
            </div>
            <Trophy className="text-yellow-300 opacity-80" size={42} />
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <h2 className="text-2xl font-black text-slate-950 dark:text-white leading-tight">
              {category.name}
            </h2>
            <p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-300">
              {category.description || 'View nominees in this category and support your favourite contestant.'}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 font-black text-blue-800 dark:text-yellow-300">
            View Nominees <ArrowRight size={18} className="group-hover:translate-x-1 transition" />
          </div>
        </div>
      </article>
    </Link>
  )
}