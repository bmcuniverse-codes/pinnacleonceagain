import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ShieldCheck } from 'lucide-react'

const VERIFIER_CODE = import.meta.env.VITE_VERIFIER_ACCESS_CODE || ''

export default function VerifierLogin() {
  const [code, setCode] = useState('')
  const navigate = useNavigate()

  function login(e) {
    e.preventDefault()

    if (!VERIFIER_CODE) {
      toast.error('Verifier access code has not been configured')
      return
    }

    if (code.trim() !== VERIFIER_CODE) {
      toast.error('Invalid verifier code')
      return
    }

    localStorage.setItem('votewave-verifier-code', code.trim())
    toast.success('Verifier access granted')
    navigate('/verifier')
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 grid place-items-center">
      <form onSubmit={login} className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
        <div className="grid h-16 w-16 place-items-center rounded-3xl bg-blue-800 text-yellow-300">
          <ShieldCheck size={34} />
        </div>

        <h1 className="mt-5 text-3xl font-black text-slate-950">Verifier Login</h1>
        <p className="mt-2 text-slate-600 font-semibold">Enter the verifier access code to scan and validate tickets at the gate.</p>

        <label className="mt-6 block">
          <span className="text-sm font-bold text-slate-600">Verifier Code</span>
          <input
            value={code}
            onChange={e => setCode(e.target.value)}
            type="password"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 font-black outline-none focus:border-blue-800"
          />
        </label>

        <button className="mt-6 w-full rounded-full bg-blue-800 px-6 py-4 font-black text-white shadow-lg">
          Continue
        </button>
      </form>
    </div>
  )
}
