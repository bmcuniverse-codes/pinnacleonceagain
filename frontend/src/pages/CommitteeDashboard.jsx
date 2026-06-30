import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Award,
  BarChart3,
  Clock,
  Grid3X3,
  LockKeyhole,
  LogOut,
  RefreshCcw,
  ShieldCheck,
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

const dashboardTabs = [
  ['overview', BarChart3, 'Overview'],
  ['leaders', Trophy, 'Leaders'],
  ['categories', Grid3X3, 'Categories'],
  ['nominees', Users, 'Nominees'],
]

export default function CommitteeDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')

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
        const nominees = [...group.nominees].sort((a, b) =>
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

  const leaders = categoryGroups.filter(item => item.leader)

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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-green-700">
                VoteWave
              </p>
              <h1 className="text-2xl sm:text-4xl font-black text-blue-800">
                Committee Dashboard
              </h1>
              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-green-50 border border-green-100 px-3 py-1 text-xs font-black text-green-700">
                <ShieldCheck size={14} />
                Encrypted and secured results
              </div>
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

          <nav className="overflow-x-auto pb-1">
            <div className="flex gap-2 min-w-max">
              {dashboardTabs.map(([key, Icon, label]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-2 rounded-full px-4 py-3 text-sm font-black transition ${
                    activeTab === key
                      ? 'bg-blue-800 text-white shadow-lg'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Icon size={17} />
                  {label}
                </button>
              ))}
            </div>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {(error || summaryError) && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 font-bold">
            {error?.message || summaryError?.message}
          </div>
        )}

        {activeTab === 'overview' && (
          <OverviewTab
            summary={summary}
            summaryLoading={summaryLoading}
            categories={categories}
            nominations={nominations}
            leaders={leaders}
          />
        )}

        {activeTab === 'leaders' && (
          <LeadersTab isLoading={isLoading} categoryGroups={categoryGroups} />
        )}

        {activeTab === 'categories' && (
          <CategoriesTab isLoading={isLoading} categoryGroups={categoryGroups} />
        )}

        {activeTab === 'nominees' && (
          <NomineesTab isLoading={isLoading} categoryGroups={categoryGroups} nominations={nominations} />
        )}
      </main>
    </div>
  )
}

function OverviewTab({ summary, summaryLoading, categories, nominations, leaders }) {
  return (
    <section className="space-y-6">
      <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <Stat icon={Grid3X3} label="Categories" value={categories.length} />
        <Stat icon={Users} label="Nominees" value={nominations.length} />
        <Stat icon={Trophy} label="Current Leaders" value={leaders.length} />
        <Stat icon={BarChart3} label="Total Votes" value={summaryLoading ? 'Loading...' : summary?.total_votes_display || 'Not updated'} />
        <Stat icon={Award} label="Total Revenue" value={summaryLoading ? 'Loading...' : summary?.total_revenue_display || 'Not updated'} />
      </div>

      <section className="rounded-[2rem] bg-white border border-slate-200 p-5 sm:p-6 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-black text-blue-800">
              <LockKeyhole size={14} />
              Protected Committee Access
            </div>
            <h2 className="mt-4 text-2xl sm:text-3xl font-black text-slate-950">
              Election Summary
            </h2>
            <p className="mt-2 text-slate-600 leading-relaxed">
              {summary?.message || 'Voting is currently ongoing.'}
            </p>
          </div>

          <div className="rounded-3xl bg-slate-50 border border-slate-200 p-4 min-w-[240px]">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Last Update
            </p>
            <p className="mt-2 font-black text-blue-800 flex items-center gap-2">
              <Clock size={18} />
              {formatDate(summary?.last_updated)}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] bg-white border border-slate-200 p-5 sm:p-6 shadow-lg">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-green-700">
              Leaders Preview
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">
              Current Category Leaders
            </h2>
          </div>
          <Trophy className="text-yellow-600" size={28} />
        </div>

        {leaders.length === 0 ? (
          <Empty message="No category leader available yet." />
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {leaders.slice(0, 6).map(({ category, leader }) => (
              <LeaderCard key={category.id} category={category} leader={leader} compact />
            ))}
          </div>
        )}
      </section>
    </section>
  )
}

function LeadersTab({ isLoading, categoryGroups }) {
  if (isLoading) return <Loading message="Loading leaders..." />
  if (categoryGroups.length === 0) return <Empty message="No categories available yet." />

  return (
    <section className="space-y-5">
      <SectionTitle
        eyebrow="Category Leaders"
        title="Current Winners Per Category"
        description="Encrypted and secured result display."
      />

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {categoryGroups.map(({ category, leader }) => (
          <LeaderCard key={category.id} category={category} leader={leader} />
        ))}
      </div>
    </section>
  )
}

function CategoriesTab({ isLoading, categoryGroups }) {
  if (isLoading) return <Loading message="Loading categories..." />
  if (categoryGroups.length === 0) return <Empty message="No categories available yet." />

  return (
    <section className="space-y-5">
      <SectionTitle
        eyebrow="Categories"
        title="Voting Categories"
        description="All active categories are listed below."
      />

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {categoryGroups.map(({ category, nominees, leader }) => (
          <article key={category.id} className="rounded-[2rem] bg-white border border-slate-200 p-5 shadow-lg">
            <div className="flex items-start gap-4">
              <PreviewImage src={category.cover_url} icon={Grid3X3} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-green-700">
                  Category
                </p>
                <h3 className="mt-1 text-xl font-black text-slate-950 truncate">
                  {category.name}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {nominees.length} nominee{nominees.length === 1 ? '' : 's'} listed
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-3xl bg-blue-50 border border-blue-100 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
                Current Leader
              </p>
              <p className="mt-2 font-black text-slate-950 truncate">
                {leader?.full_name || 'No leader yet'}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function NomineesTab({ isLoading, categoryGroups, nominations }) {
  if (isLoading) return <Loading message="Loading nominees..." />
  if (nominations.length === 0) return <Empty message="No nominees available yet." />

  return (
    <section className="space-y-5">
      <SectionTitle
        eyebrow="Nominees"
        title="Nominees by Category"
        description="All active nominees are grouped according to their categories."
      />

      <div className="space-y-5">
        {categoryGroups.map(({ category, nominees }) => (
          <article key={category.id} className="rounded-[2rem] bg-white border border-slate-200 p-5 sm:p-6 shadow-lg">
            <div className="flex items-center gap-4 mb-5">
              <PreviewImage src={category.cover_url} icon={Grid3X3} />
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-green-700">
                  Category
                </p>
                <h3 className="text-xl sm:text-2xl font-black text-slate-950 truncate">
                  {category.name}
                </h3>
              </div>
            </div>

            {nominees.length === 0 ? (
              <p className="text-sm text-slate-500">No nominee in this category yet.</p>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                {nominees.map(nominee => (
                  <NomineeCard key={nominee.id} nominee={nominee} />
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

function LeaderCard({ category, leader, compact = false }) {
  return (
    <article className="rounded-[2rem] bg-white border border-slate-200 p-5 shadow-lg overflow-hidden">
      <div className="flex items-start gap-4">
        <PreviewImage src={category.cover_url} icon={Grid3X3} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-green-700">
            {category.name}
          </p>
          <h3 className="mt-1 text-lg sm:text-xl font-black text-slate-950 truncate">
            Current Leader
          </h3>
        </div>
      </div>

      {leader ? (
        <div className="mt-5 rounded-3xl bg-blue-50 border border-blue-100 p-4 flex items-center gap-4 min-w-0">
          <PreviewImage src={leader.image_url} icon={Users} circle />
          <div className="min-w-0">
            <h4 className={`${compact ? 'text-base' : 'text-lg'} font-black text-slate-950 truncate`}>
              {leader.full_name}
            </h4>
            <p className="text-sm text-slate-600 truncate">
              {leader.nickname || 'No nickname'}{leader.level ? ` • ${leader.level} Level` : ''}
            </p>
            <p className="mt-1 text-xs font-black text-green-700">
              Leading currently
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-3xl bg-slate-50 border border-slate-200 p-4">
          <p className="font-bold text-slate-500">No leader yet.</p>
        </div>
      )}
    </article>
  )
}

function NomineeCard({ nominee }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 border border-slate-200 p-3 min-w-0">
      <PreviewImage src={nominee.image_url} icon={Users} circle small />
      <div className="min-w-0">
        <p className="font-black text-slate-950 truncate">{nominee.full_name}</p>
        <p className="text-xs text-slate-500 truncate">
          {nominee.nickname || 'No nickname'}{nominee.level ? ` • ${nominee.level} Level` : ''}
        </p>
      </div>
    </div>
  )
}

function SectionTitle({ eyebrow, title, description }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.25em] text-green-700">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl sm:text-4xl font-black text-slate-950">
        {title}
      </h2>
      {description && <p className="mt-2 text-slate-600">{description}</p>}
    </div>
  )
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-lg min-w-0">
      <div className="h-11 w-11 rounded-2xl bg-blue-50 text-blue-800 grid place-items-center">
        <Icon size={22} />
      </div>
      <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-slate-950 break-words">
        {value}
      </p>
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

function Loading({ message }) {
  return (
    <div className="rounded-[2rem] bg-white border border-slate-200 p-6 shadow-lg">
      <p className="font-bold text-slate-600">{message}</p>
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
