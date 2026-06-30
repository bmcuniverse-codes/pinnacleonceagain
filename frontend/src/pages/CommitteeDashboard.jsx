import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Award, BarChart3, Clock, Eye, Grid3X3, LogOut, Trophy, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'

function formatDate(value) {
  if (!value) return 'Not updated yet'
  return new Date(value).toLocaleString('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

async function getCommitteeSummary() {
  const { data, error } = await supabase
    .from('committee_summary')
    .select('*')
    .eq('id', 1)
    .single()

  if (error) throw error
  return data
}

async function getCommitteeData() {
  const [categoryRes, nominationRes] = await Promise.all([
    supabase
      .from('categories')
      .select('id,event_id,name,slug,description,cover_url,is_active')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('nominations_public')
      .select('id,event_id,category_id,nominee_id,slug,full_name,nickname,level,bio,image_url,category_name,event_name,is_active,total_votes,public_score')
      .eq('is_active', true),
  ])

  if (categoryRes.error) throw categoryRes.error
  if (nominationRes.error) throw nominationRes.error

  return {
    categories: categoryRes.data || [],
    nominations: nominationRes.data || [],
  }
}

export default function CommitteeDashboard() {
  const navigate = useNavigate()

  useEffect(() => {
    const granted = localStorage.getItem('votewave_committee_access')
    if (granted !== 'granted') navigate('/committee/login')
  }, [navigate])

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['committee-summary'],
    queryFn: getCommitteeSummary,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  })

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['committee-dashboard-data'],
    queryFn: getCommitteeData,
    refetchInterval: 10000,
  })

  const categories = data?.categories || []
  const nominations = data?.nominations || []

  const categoryGroups = useMemo(() => {
    return categories.map(category => {
      const nominees = nominations
        .filter(item => item.category_id === category.id)
        .sort((a, b) =>
          Number(b.total_votes || b.public_score || 0) -
          Number(a.total_votes || a.public_score || 0)
        )

      return {
        category,
        leader: nominees[0] || null,
        nominees,
      }
    })
  }, [categories, nominations])

  const leadersCount = categoryGroups.filter(item => item.leader).length

  function logout() {
    localStorage.removeItem('votewave_committee_access')
    navigate('/committee/login')
  }

  return (
    <div className="min-h-screen bg-ink text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/85 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-gold">VoteWave</p>
            <h1 className="text-2xl sm:text-4xl font-black text-gradient">Committee Dashboard</h1>
            <p className="mt-1 text-sm text-slate-300">View-only live leaders. Sensitive vote totals are hidden.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              className="rounded-full bg-white/10 border border-white/10 px-4 py-2 text-sm font-black text-white hover:bg-white/15"
            >
              Refresh Leaders
            </button>
            <button
              onClick={logout}
              className="rounded-full bg-red-500/10 border border-red-400/20 px-4 py-2 text-sm font-black text-red-200 hover:bg-red-500/20 flex items-center gap-2"
            >
              <LogOut size={16} />
              Exit
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <section className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4">
          <Stat icon={Grid3X3} label="Categories" value={categories.length} />
          <Stat icon={Users} label="Nominees" value={nominations.length} />
          <Stat icon={Trophy} label="Current Leaders" value={leadersCount} />
          <Stat icon={BarChart3} label="Displayed Votes" value={summaryLoading ? 'Loading...' : summary?.total_votes_display || 'Not updated'} />
          <Stat icon={Award} label="Displayed Revenue" value={summaryLoading ? 'Loading...' : summary?.total_revenue_display || 'Not updated'} />
        </section>

        <section className="glass rounded-[2rem] p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-gold/10 border border-gold/20 px-3 py-1 text-xs font-black text-gold">
                <Eye size={14} />
                Committee View Only
              </div>
              <h2 className="mt-4 text-2xl sm:text-3xl font-black">Manual Admin Summary</h2>
              <p className="mt-2 text-slate-300 leading-relaxed">
                {summary?.message || 'Voting is currently ongoing.'}
              </p>
            </div>

            <div className="rounded-3xl bg-black/25 border border-white/10 p-4 min-w-[240px]">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Last Manual Update</p>
              <p className="mt-2 font-black text-gold flex items-center gap-2">
                <Clock size={18} />
                {formatDate(summary?.last_updated)}
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-gold">Live Category Leaders</p>
            <h2 className="mt-2 text-2xl sm:text-4xl font-black">Current Winners Per Category</h2>
            <p className="mt-2 text-slate-300">This updates automatically, but exact vote counts and revenue are not exposed.</p>
          </div>

          {isLoading ? (
            <p className="font-bold text-slate-300">Loading committee dashboard...</p>
          ) : categoryGroups.length === 0 ? (
            <Empty message="No categories available yet." />
          ) : (
            <div className="grid lg:grid-cols-2 gap-5">
              {categoryGroups.map(({ category, leader, nominees }) => (
                <article key={category.id} className="glass rounded-[2rem] p-5 sm:p-6 overflow-hidden">
                  <div className="flex items-start gap-4">
                    <PreviewImage src={category.cover_url} icon={Grid3X3} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-gold">Category</p>
                      <h3 className="mt-1 text-xl sm:text-2xl font-black truncate">{category.name}</h3>
                      <p className="mt-1 text-sm text-slate-400">{nominees.length} nominees listed</p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-3xl bg-black/25 border border-white/10 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Current Leader</p>
                    {leader ? (
                      <div className="mt-3 flex items-center gap-4">
                        <PreviewImage src={leader.image_url} icon={Users} circle />
                        <div className="min-w-0">
                          <h4 className="text-lg font-black truncate">{leader.full_name}</h4>
                          <p className="text-sm text-slate-400 truncate">{leader.nickname || 'No nickname'}{leader.level ? ` • ${leader.level} Level` : ''}</p>
                          <p className="mt-1 text-xs font-black text-green-300">Leading currently</p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-3 font-bold text-slate-400">No leader yet.</p>
                    )}
                  </div>

                  <div className="mt-5">
                    <p className="text-sm font-black text-slate-200 mb-3">Nominees</p>
                    {nominees.length === 0 ? (
                      <p className="text-sm text-slate-400">No nominee in this category yet.</p>
                    ) : (
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {nominees.map((nominee, index) => (
                          <div key={nominee.id} className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 p-3">
                            <span className="h-8 w-8 rounded-full bg-white/10 grid place-items-center text-xs font-black text-gold shrink-0">
                              {index + 1}
                            </span>
                            <PreviewImage src={nominee.image_url} icon={Users} circle small />
                            <div className="min-w-0">
                              <p className="font-black truncate">{nominee.full_name}</p>
                              <p className="text-xs text-slate-400 truncate">{nominee.nickname || 'No nickname'}{nominee.level ? ` • ${nominee.level} Level` : ''}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="glass rounded-3xl p-5 min-w-0">
      <div className="h-11 w-11 rounded-2xl bg-gold/10 text-gold grid place-items-center">
        <Icon size={22} />
      </div>
      <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black break-words">{value}</p>
    </div>
  )
}

function PreviewImage({ src, icon: Icon, circle = false, small = false }) {
  return (
    <div className={`${small ? 'h-10 w-10' : 'h-14 w-14'} ${circle ? 'rounded-full' : 'rounded-2xl'} bg-black/40 border border-white/10 overflow-hidden grid place-items-center text-gold shrink-0`}>
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : <Icon size={small ? 18 : 24} />}
    </div>
  )
}

function Empty({ message }) {
  return (
    <div className="glass rounded-[2rem] p-8 text-center">
      <p className="font-black text-xl">{message}</p>
    </div>
  )
}
