import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Ticket, CreditCard, ShieldCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'

async function getTicketSettings() {
  const { data, error } = await supabase
    .from('ticket_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle()

  if (error) throw error
  return data
}

function getCurrentPhase(settings) {
  if (!settings?.ticket_sales_open) return { open: false }

  const earlyEnds = settings?.early_bird_ends_at ? new Date(settings.early_bird_ends_at).getTime() : null
  const isEarly = earlyEnds && Date.now() <= earlyEnds

  return {
    open: true,
    phase: isEarly ? 'early_bird' : 'regular',
    title: isEarly ? 'Early Bird Ticket' : 'Regular Ticket',
    note: isEarly ? 'Early Bird ends July 8 by 10:00 PM' : 'Regular ticket sales are active',
    single: Number(isEarly ? settings.early_single_price || 3000 : settings.regular_single_price || 5000),
    couple: Number(isEarly ? settings.early_couple_price || 5000 : settings.regular_couple_price || 8000),
  }
}

export default function TicketPurchase() {
  const [buyerName, setBuyerName] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [ticketType, setTicketType] = useState('single')
  const [paying, setPaying] = useState(false)

  const { data: settings, isLoading } = useQuery({
    queryKey: ['ticket-settings-purchase'],
    queryFn: getTicketSettings,
    refetchInterval: 30000,
  })

  const phase = getCurrentPhase(settings)
  const amount = useMemo(() => ticketType === 'couple' ? phase.couple : phase.single, [phase, ticketType])

  async function startPayment(e) {
    e.preventDefault()

    if (!buyerName.trim()) return toast.error('Enter your full name')
    if (!buyerPhone.trim()) return toast.error('Enter your phone number')
    if (!phase.open) return toast.error('Ticket sales are closed')

    setPaying(true)

    try {
      const { data, error } = await supabase.functions.invoke('initialize-ticket', {
        body: {
          buyer_name: buyerName,
          buyer_phone: buyerPhone,
          buyer_email: buyerEmail,
          ticket_type: ticketType,
        },
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)
      if (!data?.authorization_url) throw new Error('Payment could not start')

      window.location.href = data.authorization_url
    } catch (error) {
      toast.error(error.message || 'Could not start ticket payment')
    } finally {
      setPaying(false)
    }
  }

  if (isLoading) {
    return <p className="font-bold text-slate-700 dark:text-slate-200">Loading tickets...</p>
  }

  if (!phase.open) {
    return (
      <section className="mx-auto max-w-3xl rounded-[2rem] bg-white p-8 text-center shadow-xl dark:bg-white/10">
        <Ticket className="mx-auto text-blue-800 dark:text-yellow-300" size={56} />
        <h1 className="mt-4 text-4xl font-black text-slate-950 dark:text-white">Ticket Sales Closed</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">Tickets are not available at the moment.</p>
      </section>
    )
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
      <section className="rounded-[2rem] bg-blue-800 p-7 text-white shadow-xl">
        <div className="grid h-16 w-16 place-items-center rounded-3xl bg-yellow-400 text-blue-950">
          <Ticket size={34} />
        </div>

        <h1 className="mt-6 text-4xl font-black md:text-5xl">Buy Event Ticket</h1>
        <p className="mt-3 text-lg text-white/80">{phase.note}</p>

        <div className="mt-7 grid gap-4">
          <button
            type="button"
            onClick={() => setTicketType('single')}
            className={`rounded-3xl border p-5 text-left transition ${ticketType === 'single' ? 'border-yellow-300 bg-white text-blue-950' : 'border-white/20 bg-white/10 text-white'}`}
          >
            <p className="font-black">Single Ticket</p>
            <p className="mt-1 text-3xl font-black">₦{phase.single.toLocaleString()}</p>
          </button>

          <button
            type="button"
            onClick={() => setTicketType('couple')}
            className={`rounded-3xl border p-5 text-left transition ${ticketType === 'couple' ? 'border-yellow-300 bg-white text-blue-950' : 'border-white/20 bg-white/10 text-white'}`}
          >
            <p className="font-black">Couple Ticket</p>
            <p className="mt-1 text-3xl font-black">₦{phase.couple.toLocaleString()}</p>
          </button>
        </div>

        <div className="mt-6 rounded-3xl bg-white/10 p-5">
          <ShieldCheck className="text-yellow-300" />
          <p className="mt-2 text-sm font-semibold text-white/80">
            After successful payment, your unique QR ticket will be generated. Save it securely and present it at the gate.
          </p>
        </div>
      </section>

      <section className="rounded-[2rem] bg-white p-6 shadow-xl dark:bg-white/10 md:p-8">
        <div className="flex items-start gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-blue-800 text-yellow-300">
            <CreditCard size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-950 dark:text-white">Ticket Details</h2>
            <p className="mt-1 text-slate-600 dark:text-slate-300">Fill your details correctly before payment.</p>
          </div>
        </div>

        <form onSubmit={startPayment} className="mt-7 space-y-5">
          <label className="block">
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Full Name</span>
            <input value={buyerName} onChange={e => setBuyerName(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 font-bold outline-none focus:border-blue-800 dark:border-white/10 dark:bg-white/5 dark:text-white" />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Phone Number</span>
            <input value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 font-bold outline-none focus:border-blue-800 dark:border-white/10 dark:bg-white/5 dark:text-white" />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Email Optional</span>
            <input type="email" value={buyerEmail} onChange={e => setBuyerEmail(e.target.value)} placeholder="Leave empty if you do not want email" className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 font-bold outline-none focus:border-blue-800 dark:border-white/10 dark:bg-white/5 dark:text-white" />
          </label>

          <div className="rounded-3xl bg-yellow-50 p-5 dark:bg-yellow-400/10">
            <p className="font-black text-slate-950 dark:text-white">Amount to Pay</p>
            <p className="mt-1 text-4xl font-black text-blue-800 dark:text-yellow-300">₦{Number(amount || 0).toLocaleString()}</p>
          </div>

          <button disabled={paying} className="w-full rounded-full bg-blue-800 px-6 py-4 font-black text-white shadow-lg disabled:opacity-60">
            {paying ? 'Starting Payment...' : 'Pay Now'}
          </button>
        </form>
      </section>
    </div>
  )
}
