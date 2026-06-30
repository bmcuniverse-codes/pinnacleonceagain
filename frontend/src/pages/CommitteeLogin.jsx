import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { LockKeyhole, ShieldCheck } from 'lucide-react'
import Button from '../components/Button'
import Card from '../components/Card'

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
    <div className="min-h-screen bg-ink grid place-items-center px-4 py-10">
      <Card className="w-full max-w-md">
        <div className="mx-auto h-16 w-16 rounded-3xl gold-gradient text-black grid place-items-center shadow-glow">
          <ShieldCheck size={32} />
        </div>

        <div className="mt-6 text-center">
          <h1 className="text-3xl font-black text-gradient">Committee Access</h1>
          <p className="mt-2 text-slate-300 leading-relaxed">
            View current category leaders and nominee lists without editing access or sensitive vote totals.
          </p>
        </div>

        <form onSubmit={login} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-bold text-slate-300">Access Code</span>
            <div className="mt-2 flex items-center gap-3 rounded-2xl bg-black/30 border border-white/10 px-4 py-3 focus-within:border-gold">
              <LockKeyhole size={20} className="text-gold shrink-0" />
              <input
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="Enter committee code"
                type="password"
                className="w-full bg-transparent outline-none text-white placeholder:text-slate-500"
                autoComplete="off"
              />
            </div>
          </label>

          <Button className="w-full">Open Committee Dashboard</Button>
        </form>
      </Card>
    </div>
  )
}
