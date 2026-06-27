import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, ArrowRight, Trophy } from 'lucide-react'
import { supabase } from '../lib/supabase'

async function getEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export default function Events() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: getEvents,
  })

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 p-7 md:p-10 shadow-xl">
        <p className="text-sm font-black uppercase tracking-[0.25em] text-green-700 dark:text-green-300">
          Voting Events
        </p>
        <h1 className="mt-3 text-4xl md:text-5xl font-black text-slate-950 dark:text-white">
          Choose an event
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
          Select the active event you want to participate in and continue to its voting categories.
        </p>
      </section>

      {isLoading && (
        <p className="font-semibold text-slate-700 dark:text-slate-200">
          Loading events...
        </p>
      )}

      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map(event => (
          <article
            key={event.id}
            className="group overflow-hidden rounded-[2rem] bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 shadow-xl hover:-translate-y-1 transition duration-300"
          >
            <div className="relative h-52 overflow-hidden bg-blue-800">
              {event.cover_url ? (
                <img
                  src={event.cover_url}
                  alt={event.name}
                  className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                  loading="lazy"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-blue-800 via-blue-700 to-green-600 grid place-items-center">
                  <Trophy className="text-yellow-300" size={54} />
                </div>
              )}

              <div className="absolute left-5 top-5 rounded-full bg-yellow-400 px-4 py-2 text-xs font-black text-blue-950 shadow-lg">
                Active Voting
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <h2 className="text-2xl font-black text-slate-950 dark:text-white leading-tight">
                  {event.name}
                </h2>
                <p className="mt-3 line-clamp-3 leading-relaxed text-slate-600 dark:text-slate-300">
                  {event.description || 'Open this event to view categories and vote for your preferred nominees.'}
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm font-bold text-green-700 dark:text-green-300">
                <CalendarDays size={17} />
                <span>Voting is currently open</span>
              </div>

              <Link
                to={`/events/${event.slug}/categories`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-blue-800 px-6 py-3 font-black text-white shadow-lg hover:bg-blue-900 transition"
              >
                View Categories <ArrowRight size={18} />
              </Link>
            </div>
          </article>
        ))}
      </section>

      {!isLoading && data.length === 0 && (
        <div className="rounded-[2rem] bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 p-8 text-center shadow-lg">
          <h2 className="text-2xl font-black text-slate-950 dark:text-white">
            No active event yet
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Login as admin to create and activate your first voting event.
          </p>
        </div>
      )}
    </div>
  )
}