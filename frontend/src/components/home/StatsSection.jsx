import { useQuery } from '@tanstack/react-query'
import { Trophy, Grid3X3, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import StatCard from '../ui/StatCard'

async function getStats() {
  const [events, categories, nominations] = await Promise.all([
    supabase.from('events').select('id', { count: 'exact', head: true }),
    supabase.from('categories').select('id', { count: 'exact', head: true }),
    supabase.from('nominations').select('id', { count: 'exact', head: true }),
  ])

  return {
    events: events.count || 0,
    categories: categories.count || 0,
    nominees: nominations.count || 0,
  }
}

export default function StatsSection() {
  const { data } = useQuery({ queryKey: ['home-stats'], queryFn: getStats })

  return (
    <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <StatCard icon={Trophy} label="Active Events" value={data?.events ?? '—'} tone="blue" />
      <StatCard icon={Grid3X3} label="Categories" value={data?.categories ?? '—'} tone="gold" />
      <StatCard icon={Users} label="Nominees" value={data?.nominees ?? '—'} tone="blue" />
    </section>
  )
}