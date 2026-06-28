import { useQuery } from '@tanstack/react-query'
import { Trophy } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { percent } from '../../lib/helpers'
import MovingProgressBar from './MovingProgressBar'

async function getCategoryLeaderboard(categoryId) {
  if (!categoryId) return []

  const { data, error } = await supabase
    .from('nominations_public')
    .select('*')
    .eq('category_id', categoryId)
    .eq('is_active', true)

  if (error) throw error

  const max = Math.max(
    ...(data || []).map(item => Number(item.public_score || item.total_votes || 0)),
    0
  )

  return (data || [])
    .map(item => ({
      ...item,
      percentage: percent(item.public_score || item.total_votes || 0, max),
    }))
    .sort(
      (a, b) =>
        Number(b.public_score || b.total_votes || 0) -
        Number(a.public_score || a.total_votes || 0)
    )
}

export default function CategoryLeaderboard({ categoryId, categoryName }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ['category-leaderboard', categoryId],
    queryFn: () => getCategoryLeaderboard(categoryId),
    enabled: Boolean(categoryId),
    refetchInterval: 15000,
  })

  return (
    <section className="mt-12 rounded-[2rem] bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 p-5 sm:p-7 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-green-700 dark:text-green-300">
            Category Standings
          </p>

          <h2 className="mt-2 text-3xl sm:text-4xl font-black text-slate-950 dark:text-white">
            {categoryName || 'Category'} Leaderboard
          </h2>

          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Track the progress of nominees in this category. Exact vote totals remain private.
          </p>
        </div>

        <div className="h-14 w-14 rounded-2xl bg-blue-800 text-yellow-300 grid place-items-center shrink-0">
          <Trophy size={30} />
        </div>
      </div>

      {isLoading ? (
        <p className="font-bold text-slate-600 dark:text-slate-300">
          Loading category leaderboard...
        </p>
      ) : data.length === 0 ? (
        <div className="rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 text-center">
          <p className="font-black text-slate-950 dark:text-white">
            No votes yet
          </p>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
            Once voting begins, nominee progress will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((nominee, index) => (
            <MovingProgressBar
              key={nominee.id}
              nominee={nominee}
              percentage={nominee.percentage}
              rank={index + 1}
            />
          ))}
        </div>
      )}
    </section>
  )
}
