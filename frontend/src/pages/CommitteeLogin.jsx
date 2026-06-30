import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { LockKeyhole, ShieldCheck } from 'lucide-react'

const ACCESS_CODE = import.meta.env.VITE_COMMITTEE_ACCESS_CODE || 'committee2026'

export default function CommitteeLogin() {
  const [code, setCode] = useState('')
  const navigate = useNavigate()

  function login(e) {
    e.preventDefault()

    if (code.trim() !== ACCESS_CODE) {
      toast.error('Invalid committee access code')
      return
    }

    localStorage.setItem('votewave_committee_access', 'granted')
    toast.success('Committee access granted')
    navigate('/committee/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10 grid place-items-center text-slate-950">
      <div className="w-full max-w-md rounded-[2rem] bg-white border border-slate-200 p-6 sm:p-8 shadow-xl">
        <div className="mx-auto h-16 w-16 rounded-3xl bg-blue-800 text-yellow-300 grid place-items-center shadow-lg">
          <ShieldCheck size={32} />
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-green-700">VoteWave</p>
          <h1 className="mt-2 text-3xl font-black text-blue-800">Committee Access</h1>
          <p className="mt-3 text-slate-600 leading-relaxed">
            View current category leaders and nominee lists without editing access or sensitive vote totals.
          </p>
        </div>

        <form onSubmit={login} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Access Code</span>
            <div className="mt-2 flex items-center gap-3 rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 focus-within:border-blue-800">
              <LockKeyhole size={20} className="text-blue-800 shrink-0" />
              <input
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="Enter committee code"
                type="password"
                className="w-full bg-transparent outline-none text-slate-950 placeholder:text-slate-400"
                autoComplete="off"
              />
            </div>
          </label>

          <button className="w-full rounded-full bg-blue-800 px-6 py-4 text-white font-black shadow-lg hover:bg-blue-900 transition">
            Open Committee Dashboard
          </button>
        </form>
      </div>
    </div>
  )
}
