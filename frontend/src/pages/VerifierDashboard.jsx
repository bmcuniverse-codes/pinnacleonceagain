import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Search, ShieldCheck, LogOut } from 'lucide-react'

export default function VerifierDashboard() {
  const [code, setCode] = useState('')
  const navigate = useNavigate()

  function openTicket(e) {
    e.preventDefault()
    const clean = code.trim()
    if (!clean) return toast.error('Enter ticket code')
    navigate(`/verify-ticket/${encodeURIComponent(clean)}`)
  }

  function logout() {
    localStorage.removeItem('votewave-verifier-code')
    navigate('/verifier/login')
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between gap-4 rounded-[2rem] bg-white p-5 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-800 text-yellow-300">
              <ShieldCheck />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-950">Ticket Verifier</h1>
              <p className="text-sm font-bold text-slate-500">Scan QR with phone camera or enter ticket code manually.</p>
            </div>
          </div>
          <button onClick={logout} className="grid h-11 w-11 place-items-center rounded-full bg-red-50 text-red-600">
            <LogOut size={18} />
          </button>
        </div>

        <form onSubmit={openTicket} className="rounded-[2rem] bg-white p-6 shadow-lg">
          <label className="block">
            <span className="text-sm font-bold text-slate-600">Ticket Code</span>
            <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-blue-800">
              <Search className="text-slate-400" />
              <input value={code} onChange={e => setCode(e.target.value)} className="w-full bg-transparent py-2 font-black outline-none" placeholder="Paste ticket code here" />
            </div>
          </label>
          <button className="mt-5 w-full rounded-full bg-blue-800 px-6 py-4 font-black text-white shadow-lg">
            Verify Ticket
          </button>
        </form>
      </div>
    </div>
  )
}
