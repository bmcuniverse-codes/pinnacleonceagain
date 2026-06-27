import { useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, CreditCard, ShieldCheck, Trophy, UserRound, MessageCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { currency } from '../lib/helpers'

async function getNomination(slug) {
  const { data, error } = await supabase
    .from('nominations_public')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) throw error
  return data
}

export default function NomineeProfile() {
  const { nominationSlug } = useParams()
  const navigate = useNavigate()

  const [amount, setAmount] = useState(500)
  const [supporterName, setSupporterName] = useState('')
  const [supporterMessage, setSupporterMessage] = useState('')
  const [phone, setPhone] = useState('')
  const [isPaying, setIsPaying] = useState(false)

  const { data: n, isLoading } = useQuery({
    queryKey: ['nomination', nominationSlug],
    queryFn: () => getNomination(nominationSlug),
  })

  const votePrice = Number(n?.vote_price || 50)

  const voteCount = useMemo(() => {
    const value = Number(amount || 0)
    if (!value || value < votePrice) return 0
    return Math.floor(value / votePrice)
  }, [amount, votePrice])

  const validAmount = Number(amount) >= votePrice && Number(amount) % votePrice === 0

  async function pay() {
    if (!validAmount) {
      return toast.error(`Amount must be at least ${currency(votePrice)} and a multiple of ${currency(votePrice)}`)
    }

    try {
      setIsPaying(true)

      const { data, error } = await supabase.functions.invoke('initialize-payment', {
        body: {
          nomination_id: n.id,
          amount: Number(amount),
          supporter_name: supporterName,
          supporter_message: supporterMessage,
          voter_phone: phone,
        },
      })

      if (error) {
        toast.error(error.message)
        return
      }

      if (data?.error) {
        toast.error(data.error)
        return
      }

      if (!data?.authorization_url) {
        toast.error('Payment could not start')
        return
      }

      window.location.href = data.authorization_url
    } finally {
      setIsPaying(false)
    }
  }

  if (isLoading) {
    return (
      <p className="font-semibold text-slate-700 dark:text-slate-200">
        Loading nominee...
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 font-black text-blue-800 dark:text-yellow-300"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <section className="grid lg:grid-cols-[0.9fr_1.1fr] gap-8">
        <div className="overflow-hidden rounded-[2rem] bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 shadow-xl">
          <div className="relative h-[430px] bg-blue-800">
            {n.image_url ? (
              <img
                src={n.image_url}
                alt={n.full_name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="h-full w-full grid place-items-center">
                <UserRound className="text-yellow-300" size={96} />
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            <div className="absolute left-6 right-6 bottom-6 text-white">
              <p className="text-yellow-300 text-sm font-black uppercase tracking-[0.16em]">
                {n.category_name}
              </p>
              <h1 className="mt-2 text-4xl md:text-5xl font-black leading-tight">
                {n.full_name}
              </h1>
              <p className="mt-2 text-lg text-white/85">
                {n.nickname ? `“${n.nickname}” • ` : ''}
                {n.level} Level
              </p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-300">Event</p>
                <p className="font-black text-slate-950 dark:text-white">
                  {n.event_name}
                </p>
              </div>

              <div className="rounded-2xl bg-green-50 dark:bg-green-400/10 border border-green-100 dark:border-green-400/20 p-4">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-300">Voting</p>
                <p className="font-black text-green-700 dark:text-green-300">
                  Open
                </p>
              </div>
            </div>

            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {n.bio || 'Support this nominee by casting a secure verified vote. Your vote is recorded only after payment confirmation.'}
            </p>
          </div>
        </div>

        <div className="rounded-[2rem] bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 p-6 md:p-8 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl bg-blue-800 grid place-items-center text-yellow-300 shrink-0">
              <CreditCard size={26} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-950 dark:text-white">
                Support with your vote
              </h2>
              <p className="mt-2 text-slate-600 dark:text-slate-300">
                No email required. Enter the amount you want to vote with.
              </p>
            </div>
          </div>

          <div className="mt-7 space-y-5">
            <label className="block">
              <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                Amount to vote with
              </span>

              <div className="mt-2 flex items-center rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus-within:border-blue-700 overflow-hidden">
                <span className="px-5 text-slate-500 dark:text-slate-300 font-black">₦</span>
                <input
                  min={votePrice}
                  step={votePrice}
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  type="number"
                  className="w-full bg-transparent px-2 py-4 outline-none text-slate-950 dark:text-white font-black"
                />
              </div>
            </label>

            <div className="grid grid-cols-3 gap-3">
              {[250, 500, 1000].map(value => (
                <button
                  key={value}
                  onClick={() => setAmount(value)}
                  className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 py-3 text-sm font-black text-slate-800 dark:text-white hover:border-blue-700 transition"
                >
                  {currency(value)}
                </button>
              ))}
            </div>

            <div className="rounded-3xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-400/20 p-5 flex items-center justify-between gap-4">
              <div>
                <span className="block font-black text-slate-950 dark:text-white">
                  Vote value
                </span>
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  {currency(votePrice)} per vote
                </span>
              </div>

              <strong className="text-3xl font-black text-blue-800 dark:text-yellow-300">
                {voteCount}
              </strong>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                  Supporter name optional
                </span>
                <input
                  value={supporterName}
                  onChange={e => setSupporterName(e.target.value)}
                  placeholder="Anonymous"
                  className="mt-2 w-full rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-3 outline-none text-slate-950 dark:text-white focus:border-blue-700"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                  Phone optional
                </span>
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="mt-2 w-full rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-3 outline-none text-slate-950 dark:text-white focus:border-blue-700"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                Message optional
              </span>

              <div className="relative">
                <MessageCircle className="absolute left-4 top-5 text-slate-400" size={18} />
                <textarea
                  value={supporterMessage}
                  onChange={e => setSupporterMessage(e.target.value)}
                  rows="3"
                  placeholder="Say something nice to your nominee"
                  className="mt-2 w-full rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 pl-11 pr-4 py-3 outline-none text-slate-950 dark:text-white focus:border-blue-700"
                />
              </div>
            </label>

            <button
              onClick={pay}
              disabled={isPaying}
              className="w-full rounded-full bg-blue-800 px-6 py-4 font-black text-white shadow-lg hover:bg-blue-900 transition disabled:opacity-60"
            >
              {isPaying ? 'Starting Payment...' : 'Pay & Vote Securely'}
            </button>

            <div className="flex items-center gap-2 rounded-2xl bg-green-50 dark:bg-green-400/10 border border-green-100 dark:border-green-400/20 p-4 text-green-700 dark:text-green-300">
              <ShieldCheck size={20} />
              <p className="text-sm font-bold">
                Payment is verified before your vote is counted.
              </p>
            </div>

            <Link
              to="/leaderboard"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 dark:border-white/10 px-6 py-3 font-black text-blue-800 dark:text-yellow-300 hover:bg-slate-50 dark:hover:bg-white/5 transition"
            >
              View Leaderboard <Trophy size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}