import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, Trophy, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import PageHeader from '../components/ui/PageHeader'
import StatCard from '../components/ui/StatCard'
import EmptyState from '../components/ui/EmptyState'
import NomineeCard from '../components/ui/NomineeCard'

async function getNominees(eventSlug, categorySlug) {
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id,name,slug')
    .eq('slug', eventSlug)
    .single()

  if (eventError) throw eventError

  const { data: cat, error: catError } = await supabase
    .from('categories')
    .select('id,name,description')
    .eq('event_id', event.id)
    .eq('slug', categorySlug)
    .single()

  if (catError) throw catError

  const { data, error } = await supabase
    .from('nominations_public')
    .select('*')
    .eq('category_id', cat.id)
    .eq('is_active', true)
    .order('full_name')

  if (error) throw error

  return { event, cat, nominations: data || [] }
}

export default function Nominees() {
  const { eventSlug, categorySlug } = useParams()

  const { data, isLoading } = useQuery({
    queryKey: ['nominees', eventSlug, categorySlug],
    queryFn: () => getNominees(eventSlug, categorySlug),
  })

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={data?.event?.name || 'Voting Event'}
        title={data?.cat?.name || 'Nominees'}
        description={data?.cat?.description || 'Choose your favourite nominee and support them with a secure verified vote.'}
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <StatCard icon={Users} label="Nominees" value={data?.nominations?.length || 0} tone="blue" />
          <StatCard icon={Trophy} label="Voting Status" value="Open" tone="green" />
        </div>
      </PageHeader>

      <div className="flex items-center gap-3 rounded-[1.5rem] bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 px-5 py-4 shadow-sm">
        <Search className="text-slate-400" size={20} />
        <input
          disabled
          placeholder="Search nominees coming soon..."
          className="w-full bg-transparent outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
        />
      </div>

      {isLoading && (
        <p className="font-semibold text-slate-700 dark:text-slate-200">
          Loading nominees...
        </p>
      )}

      {!isLoading && data?.nominations?.length === 0 && (
        <EmptyState
          title="No nominee available"
          description="Nominees added by the admin will appear here."
        />
      )}

      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.nominations?.map(n => (
          <NomineeCard key={n.id} nominee={n} />
        ))}
      </section>
    </div>
  )
}