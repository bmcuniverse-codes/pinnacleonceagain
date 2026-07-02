import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { X, Ticket } from 'lucide-react'
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

function getPrices(settings) {
  const earlyEnds = settings?.early_bird_ends_at ? new Date(settings.early_bird_ends_at).getTime() : null
  const isEarly = settings?.ticket_sales_open && earlyEnds && Date.now() <= earlyEnds

  return {
    isOpen: Boolean(settings?.ticket_sales_open),
    title: isEarly ? 'Early Bird Tickets' : 'Regular Tickets',
    note: isEarly ? 'Early Bird ends July 8 by 10:00 PM' : 'Regular ticket sales are now active',
    single: Number(isEarly ? settings?.early_single_price || 3000 : settings?.regular_single_price || 5000),
    couple: Number(isEarly ? settings?.early_couple_price || 5000 : settings?.regular_couple_price || 8000),
  }
}

export default function TicketPopup() {
  const [open, setOpen] = useState(false)
  const { data: settings } = useQuery({
    queryKey: ['ticket-settings-popup'],
    queryFn: getTicketSettings,
  })

  useEffect(() => {
    const dismissed = sessionStorage.getItem('ticket-popup-dismissed')
    if (dismissed) return

    const timer = setTimeout(() => setOpen(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  const prices = getPrices(settings)

  if (!open || !settings || !prices.isOpen) return null

  function close() {
    sessionStorage.setItem('ticket-popup-dismissed', 'yes')
    setOpen(false)
  }

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/60 p-4">
      <div className="relative w-full max-w-lg overflow-hidden rounded-[2rem] bg-white p-6 shadow-2xl dark:bg-slate-950">
        <button onClick={close} className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white">
          <X size={20} />
        </button>

        <div className="grid h-16 w-16 place-items-center rounded-3xl bg-yellow-400 text-blue-950">
          <Ticket size={32} />
        </div>

        <h2 className="mt-5 text-3xl font-black text-slate-950 dark:text-white">
          Secure Your Event Ticket
        </h2>

        <p className="mt-2 font-bold text-green-700 dark:text-green-300">
          {prices.note}
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
            <p className="text-sm font-black text-slate-500 dark:text-slate-300">Single</p>
            <p className="mt-1 text-3xl font-black text-blue-800 dark:text-yellow-300">₦{prices.single.toLocaleString()}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
            <p className="text-sm font-black text-slate-500 dark:text-slate-300">Couple</p>
            <p className="mt-1 text-3xl font-black text-blue-800 dark:text-yellow-300">₦{prices.couple.toLocaleString()}</p>
          </div>
        </div>

        <Link
          to="/tickets"
          onClick={close}
          className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-blue-800 px-6 py-4 font-black text-white shadow-lg hover:bg-blue-900"
        >
          Buy Ticket Now
        </Link>
      </div>
    </div>
  )
}
