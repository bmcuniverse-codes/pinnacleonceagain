import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, Filter, Trophy } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { percent } from '../lib/helpers'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import MovingProgressBar from '../components/ui/MovingProgressBar'

async function getLeaderboardData() {
  const [nominationRes, categoryRes] = await Promise.all([
    supabase
      .from('nominations_public')
      .select('*')
      .eq('is_active', true),

    supabase
      .from('categories')
      .select('id,name,event_id')
      .eq('is_active', true)
      .order('name'),
  ])

  if (nominationRes.error) throw nominationRes.error
  if (categoryRes.error) throw categoryRes.error

  return {
    nominations: nominationRes.data || [],
    categories: categoryRes.data || [],
  }
}

export default function Leaderboard() {
  const [selectedCategory, setSelectedCategory] = useState('all')

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard-with-filter'],
    queryFn: getLeaderboardData,
    refetchInterval: 15000,
  })

  const nominations = data?.nominations || []
  const categories = data?.categories || []

  const filtered = useMemo(() => {
    const items =
      selectedCategory === 'all'
        ? nominations
        : nominations.filter(item => item.category_id === selectedCategory)

    const max = Math.max(
      ...items.map(item => Number(item.public_score || item.total_votes || 0)),
      0
    )

    return items
      .map(item => ({
        ...item,
        percentage: percent(item.public_score || item.total_votes || 0, max),
      }))
      .sort(
        (a, b) =>
          Number(b.public_score || b.total_votes || 0) -
          Number(a.public_score || a.total_votes || 0)
      )
  }, [nominations, selectedCategory])

  const activeCategoryName =
    selectedCategory === 'all'
      ? 'All Categories'
      : categories.find(cat => cat.id === selectedCategory)?.name || 'Category'

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Live Leaderboard"
        title="Track nominee progress"
        description="Follow nominee rankings globally or filter by category. Exact vote totals remain private and visible only to administrators."
      />

      <section className="rounded-[2rem] bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 p-5 sm:p-6 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300 font-black uppercase tracking-[0.18em] text-sm">
              <Filter size={17} />
              Filter Leaderboard
            </div>

            <h2 className="mt-2 text-2xl sm:text-3xl font-black text-slate-950 dark:text-white">
              {activeCategoryName}
            </h2>

            <p className="mt-1 text-slate-600 dark:text-slate-300">
              Select a category to view only nominees competing in that category.
            </p>
          </div>

          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="w-full lg:w-[320px] rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#061425] px-4 py-4 font-bold text-slate-800 dark:text-white outline-none focus:border-blue-800"
          >
            <option value="all">All Categories</option>

            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`rounded-full px-4 py-2 text-sm font-black transition ${
              selectedCategory === 'all'
                ? 'bg-blue-800 text-white'
                : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300'
            }`}
          >
            All
          </button>

          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`rounded-full px-4 py-2 text-sm font-black transition ${
                selectedCategory === category.id
                  ? 'bg-blue-800 text-white'
                  : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </section>

      {isLoading && (
        <p className="font-semibold text-slate-700 dark:text-slate-200">
          Loading leaderboard...
        </p>
      )}

      {!isLoading && filtered.length === 0 && (
        <EmptyState
          icon={BarChart3}
          title="No leaderboard record yet"
          description="Once nominees begin receiving verified votes, progress will appear here."
        />
      )}

      {!isLoading && filtered.length > 0 && (
        <section className="space-y-4">
          {filtered.map((nominee, index) => (
            <MovingProgressBar
              key={nominee.id}
              nominee={nominee}
              percentage={nominee.percentage}
              rank={index + 1}
            />
          ))}
        </section>
      )}

      {!isLoading && selectedCategory !== 'all' && filtered.length > 0 && (
        <section className="rounded-[2rem] bg-blue-800 text-white p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div>
              <p className="font-black text-yellow-300 uppercase tracking-[0.18em] text-sm">
                Category Champion
              </p>

              <h2 className="mt-2 text-3xl font-black">
                {filtered[0]?.full_name}
              </h2>

              <p className="mt-1 text-white/80">
                Currently leading in {activeCategoryName}
              </p>
            </div>

            <div className="h-16 w-16 rounded-2xl bg-yellow-400 text-blue-900 grid place-items-center">
              <Trophy size={36} />
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
