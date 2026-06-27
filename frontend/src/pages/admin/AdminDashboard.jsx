import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  LayoutDashboard,
  Trophy,
  Grid3X3,
  Users,
  Vote,
  CreditCard,
  LogOut,
  Copy,
  Plus,
  Upload,
  Pencil,
  X,
  Image as ImageIcon,
  Building2,
  Trash2,
  RotateCcw,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { currency, slugify } from '../../lib/helpers'

const APP_URL = window.location.origin
const MEDIA_BUCKET = 'votewave-media'

const tabs = [
  ['overview', LayoutDashboard, 'Overview'],
  ['organizations', Building2, 'Organizations'],
  ['events', Trophy, 'Events'],
  ['categories', Grid3X3, 'Categories'],
  ['nominees', Users, 'Nominees'],
  ['nominations', Vote, 'Nominations'],
  ['payments', CreditCard, 'Payments'],
]

export default function AdminDashboard() {
  const navigate = useNavigate()

  const [active, setActive] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [organizations, setOrganizations] = useState([])
  const [events, setEvents] = useState([])
  const [categories, setCategories] = useState([])
  const [nominees, setNominees] = useState([])
  const [nominations, setNominations] = useState([])
  const [transactions, setTransactions] = useState([])

  const [editingOrganization, setEditingOrganization] = useState(null)
  const [editingEvent, setEditingEvent] = useState(null)
  const [editingCategory, setEditingCategory] = useState(null)
  const [editingNominee, setEditingNominee] = useState(null)

  const [organizationForm, setOrganizationForm] = useState({
    name: '',
    description: '',
    logo_file: null,
  })

  const [eventForm, setEventForm] = useState({
    organization_id: '',
    name: '',
    description: '',
    vote_price: 50,
    cover_file: null,
  })

  const [categoryForm, setCategoryForm] = useState({
    event_id: '',
    name: '',
    description: '',
    cover_file: null,
  })

  const [nomineeForm, setNomineeForm] = useState({
    organization_id: '',
    full_name: '',
    nickname: '',
    level: '100',
    bio: '',
    image_file: null,
  })

  const [bulkForm, setBulkForm] = useState({
    organization_id: '',
    event_id: '',
    category_id: '',
    level: '100',
    names: '',
  })

  const [assignForm, setAssignForm] = useState({
    event_id: '',
    category_id: '',
    nominee_id: '',
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate('/admin/login')
      else loadAll()
    })
  }, [navigate])

  async function loadAll() {
    setLoading(true)

    const [orgRes, eventRes, catRes, nomineeRes, nominationRes, txRes] = await Promise.all([
      supabase.from('organizations').select('*').order('created_at', { ascending: false }),
      supabase.from('events').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name'),
      supabase.from('nominees').select('*').order('full_name'),
      supabase.from('nominations_public').select('*'),
      supabase.from('vote_transactions').select('*').order('created_at', { ascending: false }).limit(150),
    ])

    if (orgRes.error) toast.error(orgRes.error.message)
    if (eventRes.error) toast.error(eventRes.error.message)
    if (catRes.error) toast.error(catRes.error.message)
    if (nomineeRes.error) toast.error(nomineeRes.error.message)
    if (nominationRes.error) toast.error(nominationRes.error.message)
    if (txRes.error) toast.error(txRes.error.message)

    const orgs = orgRes.data || []
    const evs = eventRes.data || []
    const cats = catRes.data || []
    const noms = nomineeRes.data || []
    const publicNoms = nominationRes.data || []
    const txs = txRes.data || []

    setOrganizations(orgs)
    setEvents(evs)
    setCategories(cats)
    setNominees(noms)
    setNominations(publicNoms)
    setTransactions(txs)

    const firstOrg = orgs[0]?.id || ''
    const firstEvent = evs[0]?.id || ''

    setEventForm(prev => ({ ...prev, organization_id: prev.organization_id || firstOrg }))
    setNomineeForm(prev => ({ ...prev, organization_id: prev.organization_id || firstOrg }))
    setBulkForm(prev => ({ ...prev, organization_id: prev.organization_id || firstOrg, event_id: prev.event_id || firstEvent }))
    setCategoryForm(prev => ({ ...prev, event_id: prev.event_id || firstEvent }))
    setAssignForm(prev => ({ ...prev, event_id: prev.event_id || firstEvent }))

    setLoading(false)
  }

  const successfulTx = transactions.filter(t => t.payment_status === 'success')

  const stats = useMemo(() => ({
    votes: successfulTx.reduce((sum, t) => sum + Number(t.votes || 0), 0),
    revenue: successfulTx.reduce((sum, t) => sum + Number(t.amount || 0), 0),
    organizations: organizations.length,
    events: events.length,
    nominees: nominees.length,
    categories: categories.length,
    nominations: nominations.length,
  }), [successfulTx, organizations, events, nominees, categories, nominations])

  const eventStats = useMemo(() => {
    return events.map(event => {
      const eventCategories = categories.filter(c => c.event_id === event.id)
      const eventNominations = nominations.filter(n => n.event_id === event.id)
      const eventTx = successfulTx.filter(t => t.event_id === event.id)

      return {
        ...event,
        category_count: eventCategories.length,
        nomination_count: eventNominations.length,
        total_votes: eventTx.reduce((sum, t) => sum + Number(t.votes || 0), 0),
        revenue: eventTx.reduce((sum, t) => sum + Number(t.amount || 0), 0),
      }
    })
  }, [events, categories, nominations, successfulTx])

  const categoryStats = useMemo(() => {
    return categories.map(cat => {
      const catNominations = nominations.filter(n => n.category_id === cat.id)
      const event = events.find(e => e.id === cat.event_id)

      return {
        ...cat,
        event_name: event?.name || 'Unknown Event',
        nominee_count: catNominations.length,
        total_votes: catNominations.reduce((sum, n) => sum + Number(n.total_votes || n.public_score || 0), 0),
      }
    })
  }, [categories, nominations, events])

  const organizationStats = useMemo(() => {
    return organizations.map(org => {
      const orgEvents = events.filter(e => e.organization_id === org.id)
      return { ...org, event_count: orgEvents.length }
    })
  }, [organizations, events])

  async function uploadMedia(file, folder, label = 'media') {
    if (!file) return null

    const ext = file.name.split('.').pop()
    const filename = `${slugify(label)}-${Date.now()}.${ext}`
    const path = `${folder}/${filename}`

    const { error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(path, file, { upsert: false })

    if (error) throw error

    const { data } = supabase.storage
      .from(MEDIA_BUCKET)
      .getPublicUrl(path)

    return data.publicUrl
  }

  async function logout() {
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  async function createOrganization(e) {
    e.preventDefault()
    setSaving(true)

    try {
      const logoUrl = await uploadMedia(organizationForm.logo_file, 'organizations', organizationForm.name)

      const payload = {
        name: organizationForm.name,
        slug: slugify(organizationForm.name),
        description: organizationForm.description || null,
        logo_url: logoUrl,
        is_active: true,
      }

      const { error } = await supabase.from('organizations').insert(payload)
      if (error) throw error

      toast.success('Organization created')
      setOrganizationForm({ name: '', description: '', logo_file: null })
      loadAll()
    } catch (error) {
      toast.error(error.message || 'Could not create organization')
    } finally {
      setSaving(false)
    }
  }

  async function updateOrganization(e) {
    e.preventDefault()
    if (!editingOrganization) return
    setSaving(true)

    try {
      let logoUrl = editingOrganization.logo_url || null

      if (editingOrganization.logo_file) {
        logoUrl = await uploadMedia(editingOrganization.logo_file, 'organizations', editingOrganization.name)
      }

      const payload = {
        name: editingOrganization.name,
        slug: slugify(editingOrganization.name),
        description: editingOrganization.description || null,
        logo_url: logoUrl,
        is_active: editingOrganization.is_active,
      }

      const { error } = await supabase
        .from('organizations')
        .update(payload)
        .eq('id', editingOrganization.id)

      if (error) throw error

      toast.success('Organization updated')
      setEditingOrganization(null)
      loadAll()
    } catch (error) {
      toast.error(error.message || 'Could not update organization')
    } finally {
      setSaving(false)
    }
  }

  async function deleteOrganization(org) {
    const hasEvents = events.some(e => e.organization_id === org.id)
    if (hasEvents) return toast.error('Delete this organization’s events before deleting the organization.')
    if (!window.confirm(`Delete organization "${org.name}"?`)) return

    const { error } = await supabase.from('organizations').delete().eq('id', org.id)
    if (error) return toast.error(error.message)

    toast.success('Organization deleted')
    loadAll()
  }

  async function createEvent(e) {
    e.preventDefault()
    setSaving(true)

    try {
      const coverUrl = await uploadMedia(eventForm.cover_file, 'events', eventForm.name)

      const payload = {
        organization_id: eventForm.organization_id,
        name: eventForm.name,
        slug: slugify(eventForm.name),
        description: eventForm.description || null,
        vote_price: Number(eventForm.vote_price || 50),
        cover_url: coverUrl,
        voting_open: true,
        is_active: true,
      }

      const { error } = await supabase.from('events').insert(payload)
      if (error) throw error

      toast.success('Event created')
      setEventForm({ organization_id: organizations[0]?.id || '', name: '', description: '', vote_price: 50, cover_file: null })
      loadAll()
    } catch (error) {
      toast.error(error.message || 'Could not create event')
    } finally {
      setSaving(false)
    }
  }

  async function updateEvent(e) {
    e.preventDefault()
    if (!editingEvent) return
    setSaving(true)

    try {
      let coverUrl = editingEvent.cover_url || null

      if (editingEvent.cover_file) {
        coverUrl = await uploadMedia(editingEvent.cover_file, 'events', editingEvent.name)
      }

      const payload = {
        organization_id: editingEvent.organization_id,
        name: editingEvent.name,
        slug: slugify(editingEvent.name),
        description: editingEvent.description || null,
        vote_price: Number(editingEvent.vote_price || 50),
        cover_url: coverUrl,
        voting_open: editingEvent.voting_open,
        is_active: editingEvent.is_active,
      }

      const { error } = await supabase.from('events').update(payload).eq('id', editingEvent.id)
      if (error) throw error

      toast.success('Event updated')
      setEditingEvent(null)
      loadAll()
    } catch (error) {
      toast.error(error.message || 'Could not update event')
    } finally {
      setSaving(false)
    }
  }

  async function resetEventData(event) {
    const yes = window.confirm(`Reset voting/payment data for "${event.name}"?\n\nThis will delete vote transactions for this event and reset nomination vote counts to zero. Categories and nominees will remain.`)
    if (!yes) return
    setSaving(true)

    try {
      const txDelete = await supabase.from('vote_transactions').delete().eq('event_id', event.id)
      if (txDelete.error) throw txDelete.error

      const voteReset = await supabase.from('nominations').update({ total_votes: 0 }).eq('event_id', event.id)
      if (voteReset.error) throw voteReset.error

      toast.success('Event data reset')
      loadAll()
    } catch (error) {
      toast.error(error.message || 'Could not reset event data')
    } finally {
      setSaving(false)
    }
  }

  async function deleteEvent(event) {
    const yes = window.confirm(`Delete "${event.name}"?\n\nThis will delete event transactions, nominations and categories. Nominees themselves will remain.`)
    if (!yes) return
    setSaving(true)

    try {
      const deleteTx = await supabase.from('vote_transactions').delete().eq('event_id', event.id)
      if (deleteTx.error) throw deleteTx.error

      const deleteNominations = await supabase.from('nominations').delete().eq('event_id', event.id)
      if (deleteNominations.error) throw deleteNominations.error

      const deleteCategories = await supabase.from('categories').delete().eq('event_id', event.id)
      if (deleteCategories.error) throw deleteCategories.error

      const deleteEventRes = await supabase.from('events').delete().eq('id', event.id)
      if (deleteEventRes.error) throw deleteEventRes.error

      toast.success('Event deleted')
      loadAll()
    } catch (error) {
      toast.error(error.message || 'Could not delete event')
    } finally {
      setSaving(false)
    }
  }

  async function createCategory(e) {
    e.preventDefault()
    setSaving(true)

    try {
      const coverUrl = await uploadMedia(categoryForm.cover_file, 'categories', categoryForm.name)

      const payload = {
        event_id: categoryForm.event_id,
        name: categoryForm.name,
        slug: slugify(categoryForm.name),
        description: categoryForm.description || null,
        cover_url: coverUrl,
        is_active: true,
      }

      const { error } = await supabase.from('categories').insert(payload)
      if (error) throw error

      toast.success('Category created')
      setCategoryForm({ event_id: categoryForm.event_id, name: '', description: '', cover_file: null })
      loadAll()
    } catch (error) {
      toast.error(error.message || 'Could not create category')
    } finally {
      setSaving(false)
    }
  }

  async function updateCategory(e) {
    e.preventDefault()
    if (!editingCategory) return
    setSaving(true)

    try {
      let coverUrl = editingCategory.cover_url || null

      if (editingCategory.cover_file) {
        coverUrl = await uploadMedia(editingCategory.cover_file, 'categories', editingCategory.name)
      }

      const payload = {
        event_id: editingCategory.event_id,
        name: editingCategory.name,
        slug: slugify(editingCategory.name),
        description: editingCategory.description || null,
        cover_url: coverUrl,
        is_active: editingCategory.is_active,
      }

      const { error } = await supabase.from('categories').update(payload).eq('id', editingCategory.id)
      if (error) throw error

      toast.success('Category updated')
      setEditingCategory(null)
      loadAll()
    } catch (error) {
      toast.error(error.message || 'Could not update category')
    } finally {
      setSaving(false)
    }
  }

  async function createNominee(e) {
    e.preventDefault()
    setSaving(true)

    try {
      const imageUrl = await uploadMedia(nomineeForm.image_file, 'nominees', nomineeForm.full_name)

      const payload = {
        organization_id: nomineeForm.organization_id,
        full_name: nomineeForm.full_name,
        nickname: nomineeForm.nickname || null,
        level: nomineeForm.level,
        bio: nomineeForm.bio || null,
        image_url: imageUrl,
        is_active: true,
      }

      const { error } = await supabase.from('nominees').insert(payload)
      if (error) throw error

      toast.success('Nominee created')
      setNomineeForm({ organization_id: organizations[0]?.id || '', full_name: '', nickname: '', level: '100', bio: '', image_file: null })
      loadAll()
    } catch (error) {
      toast.error(error.message || 'Could not create nominee')
    } finally {
      setSaving(false)
    }
  }

  async function updateNominee(e) {
    e.preventDefault()
    if (!editingNominee) return
    setSaving(true)

    try {
      let imageUrl = editingNominee.image_url || null

      if (editingNominee.image_file) {
        imageUrl = await uploadMedia(editingNominee.image_file, 'nominees', editingNominee.full_name)
      }

      const payload = {
        full_name: editingNominee.full_name,
        nickname: editingNominee.nickname || null,
        level: editingNominee.level,
        bio: editingNominee.bio || null,
        image_url: imageUrl,
        is_active: editingNominee.is_active,
      }

      const { error } = await supabase.from('nominees').update(payload).eq('id', editingNominee.id)
      if (error) throw error

      toast.success('Nominee updated')
      setEditingNominee(null)
      loadAll()
    } catch (error) {
      toast.error(error.message || 'Could not update nominee')
    } finally {
      setSaving(false)
    }
  }

  async function createBulkNominees(e) {
    e.preventDefault()

    const names = bulkForm.names
      .split(/[\n,;]+/)
      .map(name => name.replace(/["']/g, '').trim())
      .filter(Boolean)

    if (names.length === 0) return toast.error('Enter at least one nominee name')
    setSaving(true)

    try {
      const nomineePayload = names.map(name => ({
        organization_id: bulkForm.organization_id,
        full_name: name,
        nickname: null,
        level: bulkForm.level,
        bio: null,
        image_url: null,
        is_active: true,
      }))

      const { data: createdNominees, error } = await supabase
        .from('nominees')
        .insert(nomineePayload)
        .select('*')

      if (error) throw error

      if (bulkForm.event_id && bulkForm.category_id && createdNominees?.length) {
        const event = events.find(e => e.id === bulkForm.event_id)
        const category = categories.find(c => c.id === bulkForm.category_id)

        if (!event || !category) throw new Error('Selected event/category not found')

        const nominationPayload = createdNominees.map((nominee, index) => ({
          organization_id: event.organization_id,
          event_id: event.id,
          category_id: category.id,
          nominee_id: nominee.id,
          slug: `${slugify(nominee.full_name)}-${slugify(category.name)}-${Date.now()}-${index}`,
          total_votes: 0,
          is_active: true,
        }))

        const nominationRes = await supabase.from('nominations').insert(nominationPayload)
        if (nominationRes.error) throw nominationRes.error

        toast.success(`${createdNominees.length} nominees created and assigned`)
      } else {
        toast.success(`${createdNominees.length} nominees created`)
      }

      setBulkForm({
        organization_id: organizations[0]?.id || '',
        event_id: events[0]?.id || '',
        category_id: '',
        level: '100',
        names: '',
      })

      loadAll()
    } catch (error) {
      toast.error(error.message || 'Bulk import failed')
    } finally {
      setSaving(false)
    }
  }

  async function assignNominee(e) {
    e.preventDefault()

    const event = events.find(x => x.id === assignForm.event_id)
    const category = categories.find(x => x.id === assignForm.category_id)
    const nominee = nominees.find(x => x.id === assignForm.nominee_id)

    if (!event || !category || !nominee) return toast.error('Select event, category and nominee')

    const exists = nominations.some(n => n.category_id === category.id && n.nominee_id === nominee.id)
    if (exists) return toast.error('This nominee is already assigned to this category')

    const payload = {
      organization_id: event.organization_id,
      event_id: event.id,
      category_id: category.id,
      nominee_id: nominee.id,
      slug: `${slugify(nominee.nickname || nominee.full_name)}-${slugify(category.name)}-${Date.now()}`,
      total_votes: 0,
      is_active: true,
    }

    const { error } = await supabase.from('nominations').insert(payload)
    if (error) return toast.error(error.message)

    toast.success('Nominee assigned to category')
    setAssignForm({ ...assignForm, nominee_id: '' })
    loadAll()
  }

  function copyLink(slug) {
    navigator.clipboard.writeText(`${APP_URL}/vote/${slug}`)
    toast.success('Voting link copied')
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="grid lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:flex min-h-screen flex-col border-r border-slate-200 bg-white p-5">
          <Brand />

          <nav className="mt-8 space-y-2">
            {tabs.map(([key, Icon, label]) => (
              <button
                key={key}
                onClick={() => setActive(key)}
                className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 font-black transition ${
                  active === key ? 'bg-blue-800 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon size={20} />
                {label}
              </button>
            ))}
          </nav>

          <button onClick={logout} className="mt-auto flex items-center gap-3 rounded-2xl px-4 py-3 font-black text-red-600 hover:bg-red-50">
            <LogOut size={20} />
            Logout
          </button>
        </aside>

        <main className="p-4 md:p-8 space-y-6">
          <div className="lg:hidden rounded-[1.5rem] bg-white border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <Brand compact />
              <button onClick={logout} className="rounded-full bg-red-50 px-4 py-2 font-black text-red-600">Logout</button>
            </div>

            <div className="mt-4 overflow-x-auto pb-1">
              <div className="flex gap-2 min-w-max">
                {tabs.map(([key, Icon, label]) => (
                  <button key={key} onClick={() => setActive(key)} className={`flex items-center gap-2 rounded-full px-4 py-3 font-black ${active === key ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <Icon size={18} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-green-700">Admin Panel</p>
              <h1 className="text-3xl md:text-5xl font-black text-slate-950">{tabs.find(t => t[0] === active)?.[2] || 'Dashboard'}</h1>
            </div>

            <button onClick={loadAll} className="rounded-full bg-white border border-slate-200 px-6 py-3 font-black text-blue-800">Refresh</button>
          </div>

          {loading && <p className="font-bold">Loading admin data...</p>}

          {active === 'overview' && <Overview stats={stats} eventStats={eventStats} setActive={setActive} />}
          {active === 'organizations' && <OrganizationsTab organizationForm={organizationForm} setOrganizationForm={setOrganizationForm} organizationStats={organizationStats} createOrganization={createOrganization} setEditingOrganization={setEditingOrganization} deleteOrganization={deleteOrganization} saving={saving} />}
          {active === 'events' && <EventsTab eventForm={eventForm} setEventForm={setEventForm} organizations={organizations} eventStats={eventStats} createEvent={createEvent} setEditingEvent={setEditingEvent} resetEventData={resetEventData} deleteEvent={deleteEvent} saving={saving} />}
          {active === 'categories' && <CategoriesTab categoryForm={categoryForm} setCategoryForm={setCategoryForm} events={events} categoryStats={categoryStats} createCategory={createCategory} setEditingCategory={setEditingCategory} saving={saving} />}
          {active === 'nominees' && <NomineesTab nomineeForm={nomineeForm} setNomineeForm={setNomineeForm} bulkForm={bulkForm} setBulkForm={setBulkForm} organizations={organizations} events={events} categories={categories} nominees={nominees} createNominee={createNominee} createBulkNominees={createBulkNominees} setEditingNominee={setEditingNominee} saving={saving} />}
          {active === 'nominations' && <NominationsTab assignForm={assignForm} setAssignForm={setAssignForm} events={events} categories={categories} nominees={nominees} nominations={nominations} assignNominee={assignNominee} copyLink={copyLink} saving={saving} />}
          {active === 'payments' && <PaymentsTab transactions={transactions} />}
        </main>
      </div>

      {editingOrganization && (
        <Modal title="Edit Organization" onClose={() => setEditingOrganization(null)}>
          <form onSubmit={updateOrganization} className="space-y-4">
            <Input label="Organization Name" value={editingOrganization.name} onChange={v => setEditingOrganization({ ...editingOrganization, name: v })} required />
            <Textarea label="Description" value={editingOrganization.description || ''} onChange={v => setEditingOrganization({ ...editingOrganization, description: v })} />
            <FileInput label="Replace Logo" file={editingOrganization.logo_file} onChange={file => setEditingOrganization({ ...editingOrganization, logo_file: file })} />
            <Toggle label="Active" checked={editingOrganization.is_active} onChange={v => setEditingOrganization({ ...editingOrganization, is_active: v })} />
            <Submit disabled={saving}>Save Organization</Submit>
          </form>
        </Modal>
      )}

      {editingEvent && (
        <Modal title="Edit Event" onClose={() => setEditingEvent(null)}>
          <form onSubmit={updateEvent} className="space-y-4">
            <Select label="Organization" value={editingEvent.organization_id} onChange={v => setEditingEvent({ ...editingEvent, organization_id: v })} options={organizations.map(o => [o.id, o.name])} />
            <Input label="Event Name" value={editingEvent.name} onChange={v => setEditingEvent({ ...editingEvent, name: v })} required />
            <Textarea label="Description" value={editingEvent.description || ''} onChange={v => setEditingEvent({ ...editingEvent, description: v })} />
            <Input label="Vote Price" type="number" value={editingEvent.vote_price || 50} onChange={v => setEditingEvent({ ...editingEvent, vote_price: v })} required />
            <FileInput label="Replace Cover Image" file={editingEvent.cover_file} onChange={file => setEditingEvent({ ...editingEvent, cover_file: file })} />
            <Toggle label="Voting Open" checked={editingEvent.voting_open} onChange={v => setEditingEvent({ ...editingEvent, voting_open: v })} />
            <Toggle label="Active" checked={editingEvent.is_active} onChange={v => setEditingEvent({ ...editingEvent, is_active: v })} />
            <Submit disabled={saving}>Save Event</Submit>
          </form>
        </Modal>
      )}

      {editingCategory && (
        <Modal title="Edit Category" onClose={() => setEditingCategory(null)}>
          <form onSubmit={updateCategory} className="space-y-4">
            <Select label="Event" value={editingCategory.event_id} onChange={v => setEditingCategory({ ...editingCategory, event_id: v })} options={events.map(e => [e.id, e.name])} />
            <Input label="Category Name" value={editingCategory.name} onChange={v => setEditingCategory({ ...editingCategory, name: v })} required />
            <Textarea label="Description" value={editingCategory.description || ''} onChange={v => setEditingCategory({ ...editingCategory, description: v })} />
            <FileInput label="Replace Cover Image" file={editingCategory.cover_file} onChange={file => setEditingCategory({ ...editingCategory, cover_file: file })} />
            <Toggle label="Active" checked={editingCategory.is_active} onChange={v => setEditingCategory({ ...editingCategory, is_active: v })} />
            <Submit disabled={saving}>Save Category</Submit>
          </form>
        </Modal>
      )}

      {editingNominee && (
        <Modal title="Edit Nominee" onClose={() => setEditingNominee(null)}>
          <form onSubmit={updateNominee} className="space-y-4">
            <Input label="Full Name" value={editingNominee.full_name} onChange={v => setEditingNominee({ ...editingNominee, full_name: v })} required />
            <Input label="Nickname" value={editingNominee.nickname || ''} onChange={v => setEditingNominee({ ...editingNominee, nickname: v })} />
            <Select label="Level" value={editingNominee.level} onChange={v => setEditingNominee({ ...editingNominee, level: v })} options={['100', '200', '300', '400', '500'].map(x => [x, x])} />
            <Textarea label="Bio" value={editingNominee.bio || ''} onChange={v => setEditingNominee({ ...editingNominee, bio: v })} />
            <FileInput label="Replace Photo" file={editingNominee.image_file} onChange={file => setEditingNominee({ ...editingNominee, image_file: file })} />
            <Toggle label="Active" checked={editingNominee.is_active} onChange={v => setEditingNominee({ ...editingNominee, is_active: v })} />
            <Submit disabled={saving}>Save Nominee</Submit>
          </form>
        </Modal>
      )}
    </div>
  )
}

function Overview({ stats, eventStats, setActive }) {
  return (
    <section className="space-y-6">
      <div className="grid sm:grid-cols-2 xl:grid-cols-7 gap-4">
        <Stat title="Votes" value={stats.votes} />
        <Stat title="Revenue" value={currency(stats.revenue)} />
        <Stat title="Organizations" value={stats.organizations} />
        <Stat title="Events" value={stats.events} />
        <Stat title="Categories" value={stats.categories} />
        <Stat title="Nominees" value={stats.nominees} />
        <Stat title="Nominations" value={stats.nominations} />
      </div>

      <Panel title="Quick Actions">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Quick label="Organization" onClick={() => setActive('organizations')} />
          <Quick label="Event" onClick={() => setActive('events')} />
          <Quick label="Category" onClick={() => setActive('categories')} />
          <Quick label="Nominee" onClick={() => setActive('nominees')} />
          <Quick label="Assign" onClick={() => setActive('nominations')} />
        </div>
      </Panel>

      <Panel title="Event Performance">
        <List items={eventStats} render={event => (
          <>
            <div className="flex items-center gap-4 min-w-0">
              <PreviewImage src={event.cover_url} icon={Trophy} />
              <div className="min-w-0">
                <h3 className="font-black truncate">{event.name}</h3>
                <p className="text-sm text-slate-500 truncate">{event.category_count} categories • {event.nomination_count} nominations</p>
                <p className="text-xs font-black text-green-700">{event.total_votes} votes • {currency(event.revenue)}</p>
              </div>
            </div>
            <Badge>{event.voting_open ? 'Voting Open' : 'Closed'}</Badge>
          </>
        )} />
      </Panel>
    </section>
  )
}

function OrganizationsTab({ organizationForm, setOrganizationForm, organizationStats, createOrganization, setEditingOrganization, deleteOrganization, saving }) {
  return (
    <section className="grid xl:grid-cols-[430px_1fr] gap-6">
      <Panel title="Create Organization">
        <form onSubmit={createOrganization} className="space-y-4">
          <Input label="Organization Name" value={organizationForm.name} onChange={v => setOrganizationForm({ ...organizationForm, name: v })} required />
          <Textarea label="Description" value={organizationForm.description} onChange={v => setOrganizationForm({ ...organizationForm, description: v })} />
          <FileInput label="Organization Logo" file={organizationForm.logo_file} onChange={file => setOrganizationForm({ ...organizationForm, logo_file: file })} />
          <Submit disabled={saving}>Create Organization</Submit>
        </form>
      </Panel>

      <Panel title="Organizations">
        <List items={organizationStats} render={org => (
          <>
            <div className="flex items-center gap-4 min-w-0">
              <PreviewImage src={org.logo_url} icon={Building2} circle />
              <div className="min-w-0">
                <h3 className="font-black truncate">{org.name}</h3>
                <p className="text-sm text-slate-500 truncate">{org.description || org.slug}</p>
                <p className="text-xs font-black text-blue-800">{org.event_count} events</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <IconButton onClick={() => setEditingOrganization({ ...org, logo_file: null })}><Pencil size={16} /></IconButton>
              <DangerButton onClick={() => deleteOrganization(org)}><Trash2 size={16} /></DangerButton>
            </div>
          </>
        )} />
      </Panel>
    </section>
  )
}

function EventsTab({ eventForm, setEventForm, organizations, eventStats, createEvent, setEditingEvent, resetEventData, deleteEvent, saving }) {
  return (
    <section className="grid xl:grid-cols-[430px_1fr] gap-6">
      <Panel title="Create Event">
        <form onSubmit={createEvent} className="space-y-4">
          <Select label="Organization" value={eventForm.organization_id} onChange={v => setEventForm({ ...eventForm, organization_id: v })} options={organizations.map(o => [o.id, o.name])} />
          <Input label="Event Name" value={eventForm.name} onChange={v => setEventForm({ ...eventForm, name: v })} required />
          <Textarea label="Description" value={eventForm.description} onChange={v => setEventForm({ ...eventForm, description: v })} />
          <Input label="Vote Price" type="number" value={eventForm.vote_price} onChange={v => setEventForm({ ...eventForm, vote_price: v })} required />
          <FileInput label="Event Cover Image" file={eventForm.cover_file} onChange={file => setEventForm({ ...eventForm, cover_file: file })} />
          <Submit disabled={saving}>Create Event</Submit>
        </form>
      </Panel>

      <Panel title="Events">
        <List items={eventStats} render={event => (
          <>
            <div className="flex items-center gap-4 min-w-0">
              <PreviewImage src={event.cover_url} icon={Trophy} />
              <div className="min-w-0">
                <h3 className="font-black truncate">{event.name}</h3>
                <p className="text-sm text-slate-500 truncate">{event.category_count} categories • {event.nomination_count} nominations</p>
                <p className="text-xs font-black text-green-700">{currency(event.vote_price || 50)} per vote • {currency(event.revenue)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <IconButton onClick={() => setEditingEvent({ ...event, cover_file: null })}><Pencil size={16} /></IconButton>
              <WarnButton onClick={() => resetEventData(event)}><RotateCcw size={16} /></WarnButton>
              <DangerButton onClick={() => deleteEvent(event)}><Trash2 size={16} /></DangerButton>
            </div>
          </>
        )} />
      </Panel>
    </section>
  )
}

function CategoriesTab({ categoryForm, setCategoryForm, events, categoryStats, createCategory, setEditingCategory, saving }) {
  return (
    <section className="grid xl:grid-cols-[430px_1fr] gap-6">
      <Panel title="Create Category">
        <form onSubmit={createCategory} className="space-y-4">
          <Select label="Event" value={categoryForm.event_id} onChange={v => setCategoryForm({ ...categoryForm, event_id: v })} options={events.map(e => [e.id, e.name])} />
          <Input label="Category Name" value={categoryForm.name} onChange={v => setCategoryForm({ ...categoryForm, name: v })} required />
          <Textarea label="Description" value={categoryForm.description} onChange={v => setCategoryForm({ ...categoryForm, description: v })} />
          <FileInput label="Category Cover Image" file={categoryForm.cover_file} onChange={file => setCategoryForm({ ...categoryForm, cover_file: file })} />
          <Submit disabled={saving}>Create Category</Submit>
        </form>
      </Panel>

      <Panel title="Categories & Nominee Counts">
        <List items={categoryStats} render={cat => (
          <>
            <div className="flex items-center gap-4 min-w-0">
              <PreviewImage src={cat.cover_url} icon={Grid3X3} />
              <div className="min-w-0">
                <h3 className="font-black truncate">{cat.name}</h3>
                <p className="text-sm text-slate-500 truncate">{cat.event_name}</p>
                <p className="text-xs font-black text-blue-800">{cat.nominee_count} nominees • {cat.total_votes} public score</p>
              </div>
            </div>
            <IconButton onClick={() => setEditingCategory({ ...cat, cover_file: null })}><Pencil size={16} /></IconButton>
          </>
        )} />
      </Panel>
    </section>
  )
}

function NomineesTab({ nomineeForm, setNomineeForm, bulkForm, setBulkForm, organizations, events, categories, nominees, createNominee, createBulkNominees, setEditingNominee, saving }) {
  return (
    <section className="grid xl:grid-cols-[430px_1fr] gap-6">
      <div className="space-y-6">
        <Panel title="Create Nominee">
          <form onSubmit={createNominee} className="space-y-4">
            <Select label="Organization" value={nomineeForm.organization_id} onChange={v => setNomineeForm({ ...nomineeForm, organization_id: v })} options={organizations.map(o => [o.id, o.name])} />
            <Input label="Full Name" value={nomineeForm.full_name} onChange={v => setNomineeForm({ ...nomineeForm, full_name: v })} required />
            <Input label="Nickname" value={nomineeForm.nickname} onChange={v => setNomineeForm({ ...nomineeForm, nickname: v })} />
            <Select label="Level" value={nomineeForm.level} onChange={v => setNomineeForm({ ...nomineeForm, level: v })} options={['100', '200', '300', '400', '500'].map(x => [x, x])} />
            <Textarea label="Bio" value={nomineeForm.bio} onChange={v => setNomineeForm({ ...nomineeForm, bio: v })} />
            <FileInput label="Nominee Photo" file={nomineeForm.image_file} onChange={file => setNomineeForm({ ...nomineeForm, image_file: file })} />
            <Submit disabled={saving}>Create Nominee</Submit>
          </form>
        </Panel>

        <Panel title="Bulk Create & Assign">
          <form onSubmit={createBulkNominees} className="space-y-4">
            <Select label="Organization" value={bulkForm.organization_id} onChange={v => setBulkForm({ ...bulkForm, organization_id: v })} options={organizations.map(o => [o.id, o.name])} />
            <Select label="Event" value={bulkForm.event_id} onChange={v => setBulkForm({ ...bulkForm, event_id: v, category_id: '' })} options={events.map(e => [e.id, e.name])} />
            <Select label="Assign to Category" value={bulkForm.category_id} onChange={v => setBulkForm({ ...bulkForm, category_id: v })} options={categories.filter(c => c.event_id === bulkForm.event_id).map(c => [c.id, c.name])} />
            <Select label="Level" value={bulkForm.level} onChange={v => setBulkForm({ ...bulkForm, level: v })} options={['100', '200', '300', '400', '500'].map(x => [x, x])} />
            <Textarea label="Names" value={bulkForm.names} onChange={v => setBulkForm({ ...bulkForm, names: v })} placeholder={'One per line, comma, or semicolon separated\nAJ Classic\nMary Gold\nJohn Winner'} />
            <Submit disabled={saving}>Bulk Create Nominees</Submit>
          </form>
        </Panel>
      </div>

      <Panel title="Nominees">
        <List items={nominees} render={n => (
          <>
            <div className="flex items-center gap-4 min-w-0">
              <PreviewImage src={n.image_url} icon={Users} circle />
              <div className="min-w-0">
                <h3 className="font-black truncate">{n.full_name}</h3>
                <p className="text-sm text-slate-500 truncate">{n.nickname || 'No nickname'} • {n.level} Level</p>
              </div>
            </div>
            <IconButton onClick={() => setEditingNominee({ ...n, image_file: null })}><Pencil size={16} /></IconButton>
          </>
        )} />
      </Panel>
    </section>
  )
}

function NominationsTab({ assignForm, setAssignForm, events, categories, nominees, nominations, assignNominee, copyLink, saving }) {
  return (
    <section className="grid xl:grid-cols-[430px_1fr] gap-6">
      <Panel title="Assign Existing Nominee">
        <form onSubmit={assignNominee} className="space-y-4">
          <Select label="Event" value={assignForm.event_id} onChange={v => setAssignForm({ ...assignForm, event_id: v, category_id: '' })} options={events.map(e => [e.id, e.name])} />
          <Select label="Category" value={assignForm.category_id} onChange={v => setAssignForm({ ...assignForm, category_id: v })} options={categories.filter(c => c.event_id === assignForm.event_id).map(c => [c.id, c.name])} />
          <Select label="Nominee" value={assignForm.nominee_id} onChange={v => setAssignForm({ ...assignForm, nominee_id: v })} options={nominees.map(n => [n.id, n.full_name])} />
          <Submit disabled={saving}>Assign Nominee</Submit>
        </form>
      </Panel>

      <Panel title="Voting Links">
        <List items={nominations} render={n => (
          <>
            <div className="min-w-0">
              <h3 className="font-black truncate">{n.full_name}</h3>
              <p className="text-sm text-slate-500 truncate">{n.category_name}</p>
              <p className="text-xs text-blue-700 break-all">{APP_URL}/vote/{n.slug}</p>
            </div>
            <IconButton onClick={() => copyLink(n.slug)}><Copy size={16} /></IconButton>
          </>
        )} />
      </Panel>
    </section>
  )
}

function PaymentsTab({ transactions }) {
  return (
    <Panel title="Recent Payments">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="p-3">Reference</th>
              <th className="p-3">Status</th>
              <th className="p-3">Votes</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Supporter</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(t => (
              <tr key={t.id} className="border-t border-slate-200">
                <td className="p-3 font-bold">{t.payment_reference}</td>
                <td className="p-3">{t.payment_status}</td>
                <td className="p-3">{t.votes}</td>
                <td className="p-3">{currency(t.amount)}</td>
                <td className="p-3">{t.supporter_name || 'Anonymous'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

function Brand({ compact = false }) {
  return (
    <div className="flex items-center gap-3 px-2">
      <div className={`${compact ? 'h-10 w-10' : 'h-12 w-12'} rounded-2xl bg-blue-800 grid place-items-center text-yellow-300 font-black text-xl`}>V</div>
      <div>
        <h1 className={`${compact ? 'text-xl' : 'text-2xl'} font-black text-blue-800`}>VoteWave</h1>
        <p className="text-xs font-bold text-green-700">Admin Console</p>
      </div>
    </div>
  )
}

function Panel({ title, children }) {
  return <section className="rounded-[2rem] bg-white border border-slate-200 p-5 md:p-6 shadow-lg"><h2 className="text-xl md:text-2xl font-black text-slate-950 mb-5">{title}</h2>{children}</section>
}

function Stat({ title, value }) {
  return <div className="rounded-[1.5rem] bg-white border border-slate-200 p-5 shadow-lg"><p className="text-sm font-bold text-slate-500">{title}</p><p className="mt-2 text-2xl md:text-3xl font-black text-slate-950">{value}</p></div>
}

function Quick({ label, onClick }) {
  return <button onClick={onClick} className="rounded-2xl bg-blue-800 px-5 py-4 text-white font-black flex items-center justify-center gap-2"><Plus size={18} />{label}</button>
}

function Input({ label, value, onChange, type = 'text', required = false }) {
  return <label className="block"><span className="text-sm font-bold text-slate-600">{label}</span><input required={required} type={type} value={value || ''} onChange={e => onChange(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-800" /></label>
}

function Textarea({ label, value, onChange, placeholder = '' }) {
  return <label className="block"><span className="text-sm font-bold text-slate-600">{label}</span><textarea value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows="4" className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-800" /></label>
}

function Select({ label, value, onChange, options }) {
  return <label className="block"><span className="text-sm font-bold text-slate-600">{label}</span><select value={value || ''} onChange={e => onChange(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-800"><option value="">Select {label}</option>{options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
}

function FileInput({ label, file, onChange }) {
  return <label className="block"><span className="text-sm font-bold text-slate-600">{label}</span><div className="mt-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4"><div className="flex flex-col sm:flex-row sm:items-center gap-3"><Upload className="text-blue-800" size={20} /><input type="file" accept="image/*" onChange={e => onChange(e.target.files?.[0] || null)} className="text-sm max-w-full" /></div>{file && <p className="mt-2 text-xs font-bold text-green-700 break-all">{file.name}</p>}</div></label>
}

function Submit({ children, disabled }) {
  return <button disabled={disabled} className="w-full rounded-full bg-blue-800 px-6 py-4 text-white font-black shadow-lg disabled:opacity-60">{disabled ? 'Saving...' : children}</button>
}

function Badge({ children }) {
  return <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700 shrink-0">{children}</span>
}

function List({ items, render }) {
  return <div className="space-y-3 max-h-[660px] overflow-y-auto pr-1">{items.length === 0 ? <p className="text-slate-500 font-bold">No records yet.</p> : items.map(item => <div key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">{render(item)}</div>)}</div>
}

function PreviewImage({ src, icon: Icon = ImageIcon, circle = false }) {
  return <div className={`${circle ? 'rounded-full' : 'rounded-2xl'} h-14 w-14 bg-blue-800 overflow-hidden grid place-items-center text-yellow-300 shrink-0`}>{src ? <img src={src} className="h-full w-full object-cover" /> : <Icon size={24} />}</div>
}

function Toggle({ label, checked, onChange }) {
  return <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4"><span className="font-bold text-slate-700">{label}</span><input type="checkbox" checked={Boolean(checked)} onChange={e => onChange(e.target.checked)} /></label>
}

function IconButton({ children, onClick }) {
  return <button onClick={onClick} className="h-10 w-10 rounded-full bg-blue-800 text-white grid place-items-center shrink-0">{children}</button>
}

function WarnButton({ children, onClick }) {
  return <button onClick={onClick} className="h-10 w-10 rounded-full bg-yellow-100 text-yellow-700 grid place-items-center shrink-0">{children}</button>
}

function DangerButton({ children, onClick }) {
  return <button onClick={onClick} className="h-10 w-10 rounded-full bg-red-50 text-red-600 grid place-items-center shrink-0">{children}</button>
}

function Modal({ title, children, onClose }) {
  return <div className="fixed inset-0 z-[100] bg-black/50 p-4 grid place-items-center"><div className="w-full max-w-xl rounded-[2rem] bg-white p-5 md:p-6 shadow-2xl max-h-[90vh] overflow-y-auto"><div className="flex items-center justify-between gap-4 mb-6"><h2 className="text-2xl font-black text-slate-950">{title}</h2><button onClick={onClose} className="h-10 w-10 rounded-full bg-slate-100 grid place-items-center"><X size={20} /></button></div>{children}</div></div>
}
