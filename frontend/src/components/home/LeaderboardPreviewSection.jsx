import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Trophy } from 'lucide-react'

import { supabase } from '../../lib/supabase'
import { percent } from '../../lib/helpers'

import Section from '../ui/Section'
import MovingProgressBar from '../ui/MovingProgressBar'

async function getLeaderboardPreview() {
  const { data, error } = await supabase
    .from('nominations_public')
    .select('*')
    .eq('is_active', true)

  if (error) throw error

  if (!data || data.length === 0) return []

  const max = Math.max(
    ...data.map((item) => Number(item.public_score || 0)),
    0
  )

  return data
    .map((item) => ({
      ...item,
      percentage: percent(item.public_score, max),
    }))
    .sort(
      (a, b) =>
        Number(b.public_score || 0) -
        Number(a.public_score || 0)
    )
    .slice(0, 3)
}

export default function LeaderboardPreviewSection() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['homepage-leaderboard'],
    queryFn: getLeaderboardPreview,
    refetchInterval: 15000,
  })

  return (
    <Section
      eyebrow="Live Standings"
      title="Current leaderboard"
      description="Watch nominees climb the rankings in real time. Exact vote totals remain private while the public can follow overall progress."
    >
      {isLoading ? (
        <div className="rounded-[2rem] bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 p-8 text-center">
          Loading leaderboard...
        </div>
      ) : data.length === 0 ? (
        <div className="rounded-[2rem] bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 p-10 text-center">
          <Trophy
            className="mx-auto text-yellow-500"
            size={46}
          />

          <h3 className="mt-5 text-2xl font-black text-slate-900 dark:text-white">
            No leaderboard yet
          </h3>

          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Once voting starts, nominee rankings will appear here.
          </p>
        </div>
      ) : (
        <>
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

          <div className="pt-6">
            <Link
              to="/leaderboard"
              className="inline-flex items-center gap-2 rounded-full bg-blue-800 px-7 py-4 font-black text-white shadow-lg hover:bg-blue-900 transition"
            >
              View Full Leaderboard
              <ArrowRight size={18} />
            </Link>
          </div>
        </>
      )}
    </Section>
  )
}