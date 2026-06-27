import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Trophy } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Section from '../ui/Section'

async function getFeaturedEvent() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) return null
  return data
}

export default function FeaturedEventSection() {
  const { data: event } = useQuery({ queryKey: ['featured-event'], queryFn: getFeaturedEvent })

  if (!event) return null

  return (
    <Section
      eyebrow="Featured Award"
      title="Active voting event"
      description="Join the current voting event and support nominees across different categories."
    >
      <div className="overflow-hidden rounded-[2rem] bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 shadow-xl">
        <div className="grid lg:grid-cols-[1.1fr_.9fr]">
          <div className="p-7 md:p-10 space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-green-50 dark:bg-green-400/10 px-4 py-2 text-sm font-black text-green-700 dark:text-green-300">
              Voting Open
            </div>

            <h3 className="text-4xl md:text-5xl font-black text-slate-950 dark:text-white">
              {event.name}
            </h3>

            <p className="max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
              {event.description || 'Support your favourite nominees and follow the leaderboard progress.'}
            </p>

            <Link
              to={`/events/${event.slug}/categories`}
              className="inline-flex items-center gap-2 rounded-full bg-blue-800 px-7 py-4 text-white font-black shadow-lg hover:bg-blue-900 transition"
            >
              View Categories <ArrowRight size={19} />
            </Link>
          </div>

          <div className="min-h-[280px] bg-blue-800 relative overflow-hidden grid place-items-center">
            {event.cover_url ? (
              <img src={event.cover_url} alt={event.name} className="h-full w-full object-cover" />
            ) : (
              <>
                <div className="absolute right-[-60px] top-[-60px] h-48 w-48 rounded-full bg-yellow-400" />
                <div className="absolute left-[-70px] bottom-[-70px] h-52 w-52 rounded-full bg-green-500" />
                <Trophy className="relative text-yellow-300" size={96} />
              </>
            )}
          </div>
        </div>
      </div>
    </Section>
  )
}