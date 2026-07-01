import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Grid3X3, Trophy } from 'lucide-react'
import { supabase } from '../lib/supabase'
import PageHeader from '../components/ui/PageHeader'
import StatCard from '../components/ui/StatCard'
import CountdownTimer, { getVotingStatus } from '../components/ui/CountdownTimer'
import EmptyState from '../components/ui/EmptyState'
import CategoryCard from '../components/ui/CategoryCard'

async function getCategories(eventSlug) {
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id,name,slug,description,vote_price,voting_open,voting_starts_at,voting_ends_at')
    .eq('slug', eventSlug)
    .single()

  if (eventError) throw eventError

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('event_id', event.id)
    .eq('is_active', true)
    .order('name')

  if (error) throw error

  return { event, categories: data || [] }
}

export default function Categories() {
  const { eventSlug } = useParams()

  const { data, isLoading } = useQuery({
    queryKey: ['categories', eventSlug],
    queryFn: () => getCategories(eventSlug),
  })

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Voting Categories"
        title={data?.event?.name || 'Voting Event'}
        description="Select a category, view the nominees and support your favourite contestant with verified voting."
      >
        <div className="grid sm:grid-cols-3 gap-4">
          <StatCard icon={Trophy} label="Event Status" value={getVotingStatus(data?.event)} tone="green" />
          <StatCard icon={Grid3X3} label="Categories" value={data?.categories?.length || 0} tone="blue" />
          <StatCard icon={Trophy} label="Per Vote" value={`₦${Number(data?.event?.vote_price || 50).toLocaleString()}`} tone="gold" />
        </div>
      </PageHeader>

      {data?.event && (
        <CountdownTimer event={data.event} />
      )}

      {isLoading && (
        <p className="font-semibold text-slate-700 dark:text-slate-200">
          Loading categories...
        </p>
      )}

      {!isLoading && data?.categories?.length === 0 && (
        <EmptyState
          title="No category available"
          description="Categories added by the admin will appear here."
        />
      )}

      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.categories?.map((cat, index) => (
          <CategoryCard
            key={cat.id}
            category={cat}
            eventSlug={eventSlug}
            index={index}
          />
        ))}
      </section>
    </div>
  )
}