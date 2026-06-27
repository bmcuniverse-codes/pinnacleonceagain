import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import Button from '../../components/Button'
import Card from '../../components/Card'

export default function AdminLogin(){
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const navigate=useNavigate()
  async function login(e){
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if(error) return toast.error(error.message)
    navigate('/admin')
  }
  return <div className="min-h-screen bg-ink grid place-items-center px-4"><Card className="w-full max-w-md"><h1 className="text-3xl font-black text-gradient">VoteWave Admin</h1><p className="text-slate-400 mt-2">Login to manage events, nominees, payments and results.</p><form onSubmit={login} className="mt-6 space-y-4"><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-gold"/><input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-gold"/><Button className="w-full">Login</Button></form></Card></div>
}
