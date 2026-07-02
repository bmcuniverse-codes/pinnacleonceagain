import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Ticket, Clock } from 'lucide-react'
import { supabase } from '../../lib/supabase'

async function getTicketSettings() {
  const { data, error } = await supabase
    .from('ticket_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle()

  if (error) throw error
  return data
}

function getTicketPhase(settings) {
  if (!settings?.ticket_sales_open) return { label: 'Ticket sales closed', active: false }

  const earlyEnds = settings?.early_bird_ends_at ? new Date(settings.early_bird_ends_at).getTime() : null
  const now = Date.now()

  if (earlyEnds && now <= earlyEnds) {
    return {
      label: 'Early Bird Tickets End July 8 by 10:00 PM',
      active: true,
      single: Number(settings.early_single_price || 3000),
      couple: Number(settings.early_couple_price || 5000),
    }
  }

  return {
    label: 'Regular Tickets Now Available',
    active: true,
    single: Number(settings?.regular_single_price || 5000),
    couple: Number(settings?.regular_couple_price || 8000),
  }
}

export default function TicketFloatingBanner() {
  const { data: settings } = useQuery({
    queryKey: ['ticket-settings-floating'],
    queryFn: getTicketSettings,
    refetchInterval: 30000,
  })

  const phase = getTicketPhase(settings)

  if (!settings || !phase.active) return null

  return (
    <div className="fixed left-3 right-3 bottom-4 z-50 mx-auto max-w-5xl rounded-[1.5rem] border border-yellow-200 bg-blue-950 text-white shadow-2xl">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-yellow-400 text-blue-950">
            <Ticket size={22} />
          </div>
          <div>
            <p className="flex items-center gap-2 text-sm font-black text-yellow-300">
              <Clock size={15} />
              {phase.label}
            </p>
            <p className="mt-1 text-sm font-bold text-white/90">
              Single ₦{phase.single.toLocaleString()} • Couple ₦{phase.couple.toLocaleString()}
            </p>
          </div>
        </div>

        <Link
          to="/tickets"
          className="inline-flex items-center justify-center rounded-full bg-yellow-400 px-6 py-3 text-sm font-black text-blue-950 transition hover:bg-yellow-300"
        >
          Buy Ticket
        </Link>
      </div>
    </div>
  )
}
