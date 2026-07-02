import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function VerifyTicket() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [usingTicket, setUsingTicket] = useState(false)
  const [result, setResult] = useState(null)

  const verifierCode = localStorage.getItem('votewave-verifier-code') || ''

  useEffect(() => {
    if (!verifierCode) {
      navigate('/verifier/login')
      return
    }
    checkTicket()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  async function callVerifier(action) {
    const { data, error } = await supabase.functions.invoke('verify-ticket', {
      body: { ticket_code: code, action },
      headers: { 'x-verifier-code': verifierCode },
    })

    if (error) throw error
    if (data?.error) throw new Error(data.error)
    return data
  }

  async function checkTicket() {
    setLoading(true)
    try {
      const data = await callVerifier('check')
      setResult(data)
    } catch (error) {
      setResult({ status: 'invalid', message: error.message || 'Ticket could not be verified' })
    } finally {
      setLoading(false)
    }
  }

  async function markUsed() {
    if (!window.confirm('Confirm this ticket for entry? It cannot be used again after this.')) return

    setUsingTicket(true)
    try {
      const data = await callVerifier('use')
      setResult(data)
      toast.success('Ticket marked as used')
    } catch (error) {
      toast.error(error.message || 'Could not mark ticket as used')
      await checkTicket()
    } finally {
      setUsingTicket(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen grid place-items-center bg-slate-100 p-4"><p className="font-black">Checking ticket...</p></div>
  }

  const ticket = result?.ticket
  const status = result?.status
  const valid = status === 'valid'
  const used = status === 'used'

  return (
    <div className="min-h-screen bg-slate-100 p-4 grid place-items-center">
      <section className="w-full max-w-xl rounded-[2rem] bg-white p-6 text-center shadow-2xl">
        <div className={`mx-auto grid h-20 w-20 place-items-center rounded-full ${valid ? 'bg-green-100 text-green-700' : used ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
          {valid ? <CheckCircle2 size={44} /> : used ? <AlertTriangle size={44} /> : <XCircle size={44} />}
        </div>

        <h1 className="mt-5 text-4xl font-black text-slate-950">
          {valid ? 'Valid Ticket' : used ? 'Already Used' : 'Invalid Ticket'}
        </h1>

        <p className="mt-2 font-bold text-slate-600">{result?.message || 'Ticket verification completed.'}</p>

        {ticket && (
          <div className="mt-6 grid gap-3 text-left sm:grid-cols-2">
            <Info label="Name" value={ticket.buyer_name} />
            <Info label="Phone" value={ticket.buyer_phone} />
            <Info label="Ticket Type" value={ticket.ticket_type === 'couple' ? 'Couple' : 'Single'} />
            <Info label="Phase" value={ticket.ticket_phase === 'early_bird' ? 'Early Bird' : 'Regular'} />
            <Info label="Amount" value={`₦${Number(ticket.amount || 0).toLocaleString()}`} />
            <Info label="Status" value={ticket.ticket_status} />
            {ticket.used_at && <Info label="Used At" value={new Date(ticket.used_at).toLocaleString()} />}
          </div>
        )}

        {valid && (
          <button onClick={markUsed} disabled={usingTicket} className="mt-6 w-full rounded-full bg-green-700 px-6 py-4 font-black text-white shadow-lg disabled:opacity-60">
            {usingTicket ? 'Confirming...' : 'Mark as Used / Admit Guest'}
          </button>
        )}

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button onClick={checkTicket} className="flex-1 rounded-full border border-slate-200 px-6 py-3 font-black text-blue-800">Recheck</button>
          <Link to="/verifier" className="flex-1 rounded-full bg-blue-800 px-6 py-3 font-black text-white inline-flex items-center justify-center gap-2"><ShieldCheck size={18} />Verifier Home</Link>
        </div>
      </section>
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 break-words font-black text-slate-950">{value || '—'}</p>
    </div>
  )
}
