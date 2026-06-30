import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Award,
  BarChart3,
  Clock,
  Eye,
  Grid3X3,
  LogOut,
  RefreshCcw,
  Trophy,
  Users,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

function formatDate(value) {
  if (!value) return 'Not updated yet'

  try {
    return new Date(value).toLocaleString('en-NG', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return 'Not updated yet'
  }
}

async function getCommitteeSummary() {
  const { data, error } = await supabase
    .from('committee_summary')
    .select('*')
    .eq('id', 1)
    .maybeSingle()

  if (error) throw error

  return data || {
    total_votes_display: 'Not updated yet',
    total_revenue_display: 'Not updated yet',
    message: 'Voting is currently ongoing.',
    last_updated: null,
  }
}

async function getCommitteeData() {
  const [categoryRes, nominationRes] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true }),
    supabase
      .from('nominations_public')
      .select('*')
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

  const {
    data: summary,
    isLoading: summaryLoading,
    refetch: refetchSummary,
    error: summaryError,
  } = useQuery({
    queryKey: ['committee-summary'],
    queryFn: getCommitteeSummary,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  })

  const {
    data,
    isLoading,
    refetch,
    error,
  } = useQuery({
    queryKey: ['committee-dashboard-data'],
    queryFn: getCommitteeData,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  })

  const categories = data?.categories || []
  const nominations = data?.nominations || []

  const categoryGroups = useMemo(() => {
    const categoryMap = new Map()

    categories.forEach(category => {
      categoryMap.set(category.id, {
        category,
        nominees: [],
      })
    })

    nominations.forEach(nomination => {
      const categoryId = nomination.category_id
      if (!categoryId) return

      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          category: {
            id: categoryId,
            name: nomination.category_name || 'Category',
            event_name: nomination.event_name || '',
            cover_url: nomination.category_cover_url || null,
          },
          nominees: [],
        })
      }

      categoryMap.get(categoryId).nominees.push(nomination)
    })

    return Array.from(categoryMap.values())
      .map(group => {
        const nominees = group.nominees.sort((a, b) =>
          Number(b.public_score || b.total_votes || 0) -
          Number(a.public_score || a.total_votes || 0)
        )

        return {
          category: group.category,
          leader: nominees[0] || null,
          nominees,
        }
      })
      .sort((a, b) => String(a.category.name || '').localeCompare(String(b.category.name || '')))
  }, [categories, nominations])

  const leadersCount = categoryGroups.filter(item => item.leader).length

  function logout() {
    localStorage.removeItem('votewave_committee_access')
    navigate('/committee/login')
  }

  async function refreshEverything() {
    await Promise.all([refetch(), refetchSummary()])
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-green-700">VoteWave</p>
            <h1 className="text-2xl sm:text-4xl font-black text-blue-800">Committee Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">
              View-only access. Winners and nominee lists are visible, sensitive vote figures are hidden.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={refreshEverything}
              className="rounded-full bg-blue-800 px-4 py-2 text-sm font-black text-white hover:bg-blue-900 flex items-center gap-2"
            >
              <RefreshCcw size={16} />
              Refresh
            </button>

            <button
              onClick={logout}
              className="rounded-full bg-red-50 border border-red-100 px-4 py-2 text-sm font-black text-red-600 hover:bg-red-100 flex items-center gap-2"
            >
              <LogOut size={16} />
              Exit
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {(error || summaryError) && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 font-bold">
            {error?.message || summaryError?.message}
          </div>
        )}

        <section className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4">
          <Stat icon={Grid3X3} label="Categories" value={categories.length} />
          <Stat icon={Users} label="Nominees" value={nominations.length} />
          <Stat icon={Trophy} label="Current Leaders" value={leadersCount} />
          <Stat icon={BarChart3} label="Displayed Votes" value={summaryLoading ? 'Loading...' : summary?.total_votes_display || 'Not updated'} />
          <Stat icon={Award} label="Displayed Revenue" value={summaryLoading ? 'Loading...' : summary?.total_revenue_display || 'Not updated'} />
        </section>

        <section className="rounded-[2rem] bg-white border border-slate-200 p-5 sm:p-6 shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-green-50 border border-green-100 px-3 py-1 text-xs font-black text-green-700">
                <Eye size={14} />
                Committee View Only
              </div>
              <h2 className="mt-4 text-2xl sm:text-3xl font-black text-slate-950">Committee Summary</h2>
              <p className="mt-2 text-slate-600 leading-relaxed">
                {summary?.message || 'Voting is currently ongoing.'}
              </p>
            </div>

            <div className="rounded-3xl bg-slate-50 border border-slate-200 p-4 min-w-[240px]">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Last Update</p>
              <p className="mt-2 font-black text-blue-800 flex items-center gap-2">
                <Clock size={18} />
                {formatDate(summary?.last_updated)}
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-green-700">Live Category Leaders</p>
            <h2 className="mt-2 text-2xl sm:text-4xl font-black text-slate-950">Current Winners Per Category</h2>
            <p className="mt-2 text-slate-600">
              This section refreshes automatically. Vote counts and revenue are not shown here.
            </p>
          </div>

          {isLoading ? (
            <p className="font-bold text-slate-600">Loading committee dashboard...</p>
          ) : categoryGroups.length === 0 ? (
            <Empty message="No categories or nominees available yet." />
          ) : (
            <div className="grid lg:grid-cols-2 gap-5">
              {categoryGroups.map(({ category, leader, nominees }) => (
                <article key={category.id} className="rounded-[2rem] bg-white border border-slate-200 p-5 sm:p-6 shadow-lg overflow-hidden">
                  <div className="flex items-start gap-4">
                    <PreviewImage src={category.cover_url} icon={Grid3X3} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-green-700">Category</p>
                      <h3 className="mt-1 text-xl sm:text-2xl font-black text-slate-950 truncate">{category.name}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {nominees.length} nominee{nominees.length === 1 ? '' : 's'} listed
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-3xl bg-blue-50 border border-blue-100 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Current Leader</p>
                    {leader ? (
                      <div className="mt-3 flex items-center gap-4 min-w-0">
                        <PreviewImage src={leader.image_url} icon={Users} circle />
                        <div className="min-w-0">
                          <h4 className="text-lg font-black text-slate-950 truncate">{leader.full_name}</h4>
                          <p className="text-sm text-slate-600 truncate">
                            {leader.nickname || 'No nickname'}{leader.level ? ` • ${leader.level} Level` : ''}
                          </p>
                          <p className="mt-1 text-xs font-black text-green-700">Leading currently</p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-3 font-bold text-slate-500">No leader yet.</p>
                    )}
                  </div>

                  <div className="mt-5">
                    <p className="text-sm font-black text-slate-700 mb-3">Nominees in this Category</p>
                    {nominees.length === 0 ? (
                      <p className="text-sm text-slate-500">No nominee in this category yet.</p>
                    ) : (
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {nominees.map((nominee, index) => (
                          <div key={nominee.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 border border-slate-200 p-3 min-w-0">
                            <span className="h-8 w-8 rounded-full bg-blue-800 grid place-items-center text-xs font-black text-yellow-300 shrink-0">
                              {index + 1}
                            </span>
                            <PreviewImage src={nominee.image_url} icon={Users} circle small />
                            <div className="min-w-0">
                              <p className="font-black text-slate-950 truncate">{nominee.full_name}</p>
                              <p className="text-xs text-slate-500 truncate">
                                {nominee.nickname || 'No nickname'}{nominee.level ? ` • ${nominee.level} Level` : ''}
                              </p>
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
    <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-lg min-w-0">
      <div className="h-11 w-11 rounded-2xl bg-blue-50 text-blue-800 grid place-items-center">
        <Icon size={22} />
      </div>
      <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-950 break-words">{value}</p>
    </div>
  )
}

function PreviewImage({ src, icon: Icon, circle = false, small = false }) {
  return (
    <div className={`${small ? 'h-10 w-10' : 'h-14 w-14'} ${circle ? 'rounded-full' : 'rounded-2xl'} bg-blue-800 overflow-hidden grid place-items-center text-yellow-300 shrink-0`}>
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : <Icon size={small ? 18 : 24} />}
    </div>
  )
}

function Empty({ message }) {
  return (
    <div className="rounded-[2rem] bg-white border border-slate-200 p-8 text-center shadow-lg">
      <p className="font-black text-xl text-slate-950">{message}</p>
    </div>
  )
}
