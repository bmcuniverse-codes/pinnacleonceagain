import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Ticket, ShieldCheck, QrCode } from 'lucide-react'
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

export default function TicketSection() {
  const { data: settings } = useQuery({ queryKey: ['ticket-section-settings'], queryFn: getTicketSettings })

  if (!settings?.ticket_sales_open) return null

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-white/10 md:p-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-2 text-sm font-black text-blue-950">
            <Ticket size={16} />
            Tickets Available
          </div>

          <h2 className="mt-4 text-3xl font-black text-slate-950 dark:text-white md:text-5xl">
            Buy your event ticket before coming to the gate.
          </h2>

          <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
            After payment, a unique QR ticket will be generated for you. Save it securely and present it at the gate for one-time verification.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl bg-green-50 p-5 dark:bg-green-400/10">
              <p className="font-black text-green-700 dark:text-green-300">Early Bird ends July 8, 10:00 PM</p>
              <p className="mt-2 font-bold text-slate-700 dark:text-slate-200">Single ₦{Number(settings.early_single_price || 3000).toLocaleString()} • Couple ₦{Number(settings.early_couple_price || 5000).toLocaleString()}</p>
            </div>

            <div className="rounded-3xl bg-blue-50 p-5 dark:bg-blue-400/10">
              <p className="font-black text-blue-800 dark:text-yellow-300">Regular</p>
              <p className="mt-2 font-bold text-slate-700 dark:text-slate-200">Single ₦{Number(settings.regular_single_price || 5000).toLocaleString()} • Couple ₦{Number(settings.regular_couple_price || 8000).toLocaleString()}</p>
            </div>
          </div>

          <Link to="/tickets" className="mt-6 inline-flex rounded-full bg-blue-800 px-8 py-4 font-black text-white shadow-lg hover:bg-blue-900">
            Get Ticket
          </Link>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[2rem] bg-blue-800 p-6 text-white">
            <QrCode className="text-yellow-300" size={48} />
            <h3 className="mt-4 text-2xl font-black">QR Verification</h3>
            <p className="mt-2 text-white/80">Each QR code works once. After gate verification, it becomes void automatically.</p>
          </div>

          <div className="rounded-[2rem] bg-yellow-100 p-6 text-blue-950">
            <ShieldCheck size={42} />
            <h3 className="mt-4 text-2xl font-black">Secure Entry</h3>
            <p className="mt-2 font-semibold">Ticket details are checked by authorized verifiers only.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
