import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { percent } from '../lib/helpers'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import MovingProgressBar from '../components/ui/MovingProgressBar'
import { BarChart3 } from 'lucide-react'

async function getLeaderboard() {
  const { data, error } = await supabase
    .from('nominations_public')
    .select('*')
    .eq('is_active', true)

  if (error) throw error

  const max = Math.max(...(data || []).map(x => Number(x.public_score || 0)), 0)

  return (data || [])
    .map(x => ({ ...x, percentage: percent(x.public_score, max) }))
    .sort((a, b) => Number(b.public_score || 0) - Number(a.public_score || 0))
}

export default function Leaderboard() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: getLeaderboard,
    refetchInterval: 15000,
  })

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Live Leaderboard"
        title="Track nominee progress"
        description="Follow the progress of nominees in real time. Exact vote totals remain private and visible only to administrators."
      />

      {isLoading && (
        <p className="font-semibold text-slate-700 dark:text-slate-200">
          Loading leaderboard...
        </p>
      )}

      {!isLoading && data.length === 0 && (
        <EmptyState
          icon={BarChart3}
          title="No leaderboard record yet"
          description="Once nominees begin receiving verified votes, progress will appear here."
        />
      )}

      <section className="grid gap-4">
        {data.map((n, index) => (
          <MovingProgressBar
            key={n.id}
            nominee={n}
            percentage={n.percentage}
            rank={index + 1}
          />
        ))}
      </section>
    </div>
  )
}