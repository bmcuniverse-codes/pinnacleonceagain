import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Download, QrCode, ShieldCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'

async function getTicket(code) {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('ticket_code', code)
    .maybeSingle()

  if (error) throw error
  return data
}

export default function TicketSuccess() {
  const [params] = useSearchParams()
  const code = params.get('code') || ''

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket-success', code],
    queryFn: () => getTicket(code),
    enabled: Boolean(code),
    refetchInterval: ticket => ticket?.payment_status === 'success' ? false : 3000,
  })

  const verifyUrl = useMemo(() => `${window.location.origin}/verify-ticket/${code}`, [code])
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(verifyUrl)}`

  function printTicket() {
    window.print()
  }

  if (!code) {
    return <p className="font-bold text-red-600">Ticket code is missing.</p>
  }

  if (isLoading || !ticket) {
    return <p className="font-bold text-slate-700 dark:text-slate-200">Preparing your ticket...</p>
  }

  const paid = ticket.payment_status === 'success' && ticket.ticket_status === 'valid'

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="rounded-[2rem] bg-white p-6 text-center shadow-xl dark:bg-white/10 md:p-8 print:shadow-none">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-green-100 text-green-700">
          <ShieldCheck size={34} />
        </div>

        <h1 className="mt-4 text-4xl font-black text-slate-950 dark:text-white">
          {paid ? 'Ticket Generated' : 'Waiting for Payment Confirmation'}
        </h1>

        <p className="mt-2 text-slate-600 dark:text-slate-300">
          {paid ? 'Save this QR ticket securely. You will need it at the gate.' : 'If you have paid, this page will update automatically after confirmation.'}
        </p>

        <div className="mx-auto mt-6 w-full max-w-sm rounded-[2rem] border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
          <img src={qrUrl} alt="Ticket QR Code" className="mx-auto h-72 w-72 rounded-2xl bg-white p-3" />
          <p className="mt-4 break-all text-xs font-black text-slate-500 dark:text-slate-300">{code}</p>
        </div>

        <div className="mt-6 grid gap-3 text-left sm:grid-cols-2">
          <Info label="Name" value={ticket.buyer_name} />
          <Info label="Ticket Type" value={ticket.ticket_type === 'couple' ? 'Couple' : 'Single'} />
          <Info label="Phase" value={ticket.ticket_phase === 'early_bird' ? 'Early Bird' : 'Regular'} />
          <Info label="Amount" value={`₦${Number(ticket.amount || 0).toLocaleString()}`} />
          <Info label="Status" value={ticket.ticket_status} />
          <Info label="Payment" value={ticket.payment_status} />
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button onClick={printTicket} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-blue-800 px-6 py-4 font-black text-white">
            <Download size={18} />
            Print / Save Ticket
          </button>
          <Link to="/" className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-200 px-6 py-4 font-black text-blue-800 dark:border-white/10 dark:text-yellow-300">
            Back Home
          </Link>
        </div>
      </section>

      <section className="rounded-[2rem] bg-yellow-50 p-5 dark:bg-yellow-400/10 print:hidden">
        <div className="flex gap-3">
          <QrCode className="shrink-0 text-blue-800 dark:text-yellow-300" />
          <p className="font-bold text-slate-700 dark:text-slate-200">
            Screenshot this page or tap Print / Save Ticket and save it as PDF/image on your phone. This QR code can only be used once.
          </p>
        </div>
      </section>
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">{label}</p>
      <p className="mt-1 break-words font-black text-slate-950 dark:text-white">{value || '—'}</p>
    </div>
  )
}
