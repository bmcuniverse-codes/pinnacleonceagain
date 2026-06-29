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
  Crown,
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
  ['leaders', Crown, 'Leaders'],
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

  const [dashboardTotals, setDashboardTotals] = useState({
    successful_transactions: 0,
    total_revenue: 0,
    total_votes: 0,
  })

  const [eventPaymentTotals, setEventPaymentTotals] = useState([])

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
    organization_id: '',
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
  level: '',
  names: '',
})

  const [assignForm, setAssignForm] = useState({
    organization_id: '',
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

    const [orgRes, eventRes, catRes, nomineeRes, nominationRes, txRes, totalsRes, eventTotalsRes] = await Promise.all([
      supabase.from('organizations').select('*').order('created_at', { ascending: false }),
      supabase.from('events').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name'),
      supabase.from('nominees').select('*').order('full_name'),
      supabase.from('nominations_public').select('*'),
      supabase.from('vote_transactions').select('*').order('created_at', { ascending: false }).limit(150),
      supabase.from('admin_payment_totals').select('*').single(),
      supabase.from('admin_event_payment_totals').select('*'),
    ])

    if (orgRes.error) toast.error(orgRes.error.message)
    if (eventRes.error) toast.error(eventRes.error.message)
    if (catRes.error) toast.error(catRes.error.message)
    if (nomineeRes.error) toast.error(nomineeRes.error.message)
    if (nominationRes.error) toast.error(nominationRes.error.message)
    if (txRes.error) toast.error(txRes.error.message)
    if (totalsRes.error) toast.error(totalsRes.error.message)
    if (eventTotalsRes.error) toast.error(eventTotalsRes.error.message)

    const orgs = orgRes.data || []
    const evs = eventRes.data || []
    const cats = catRes.data || []
    const noms = nomineeRes.data || []
    const publicNoms = nominationRes.data || []
    const txs = txRes.data || []
    const totals = totalsRes.data || {
      successful_transactions: 0,
      total_revenue: 0,
      total_votes: 0,
    }
    const eventTotals = eventTotalsRes.data || []

    setOrganizations(orgs)
    setEvents(evs)
    setCategories(cats)
    setNominees(noms)
    setNominations(publicNoms)
    setTransactions(txs)
    setDashboardTotals(totals)
    setEventPaymentTotals(eventTotals)

    const firstOrg = orgs[0]?.id || ''
    const firstEvent = evs[0]?.id || ''

    setEventForm(prev => ({ ...prev, organization_id: prev.organization_id || firstOrg }))
    setNomineeForm(prev => ({ ...prev, organization_id: prev.organization_id || firstOrg }))
    setBulkForm(prev => ({ ...prev, organization_id: prev.organization_id || firstOrg, event_id: prev.event_id || firstEvent }))
    setCategoryForm(prev => ({
      ...prev,
      organization_id: prev.organization_id || firstOrg,
      event_id: prev.event_id || firstEvent,
    }))

    setAssignForm(prev => ({
      ...prev,
      organization_id: prev.organization_id || firstOrg,
      event_id: prev.event_id || firstEvent,
    }))

    setLoading(false)
  }

  const successfulTx = transactions.filter(t => t.payment_status === 'success')

  const stats = useMemo(() => ({
    votes: Number(dashboardTotals.total_votes || 0),
    revenue: Number(dashboardTotals.total_revenue || 0),
    successful_transactions: Number(dashboardTotals.successful_transactions || 0),
    organizations: organizations.length,
    events: events.length,
    nominees: nominees.length,
    categories: categories.length,
    nominations: nominations.length,
  }), [dashboardTotals, organizations, events, nominees, categories, nominations])

  const eventStats = useMemo(() => {
    return events.map(event => {
      const eventCategories = categories.filter(c => c.event_id === event.id)
      const eventNominations = nominations.filter(n => n.event_id === event.id)
      const eventTotal = eventPaymentTotals.find(item => item.event_id === event.id)

      const organization = organizations.find(o => o.id === event.organization_id)

      return {
        ...event,
        organization_name: organization?.name || 'Unknown Organization',
        category_count: eventCategories.length,
        nomination_count: eventNominations.length,
        total_votes: Number(eventTotal?.total_votes || 0),
        revenue: Number(eventTotal?.total_revenue || 0),
      }
    })
  }, [events, categories, nominations, eventPaymentTotals, organizations])

  const categoryStats = useMemo(() => {
    return categories.map(cat => {
      const catNominations = nominations.filter(n => n.category_id === cat.id)
      const event = events.find(e => e.id === cat.event_id)

      const organization = organizations.find(o => o.id === event?.organization_id)

      return {
        ...cat,
        organization_name: organization?.name || 'Unknown Organization',
        event_name: event?.name || 'Unknown Event',
        nominee_count: catNominations.length,
        total_votes: catNominations.reduce((sum, n) => sum + Number(n.total_votes || n.public_score || 0), 0),
      }
    })
  }, [categories, nominations, events, organizations])

const categoryLeaders = useMemo(() => {
  return categories.map(category => {
    const categoryNominations = nominations
      .filter(item => item.category_id === category.id)
      .sort(
        (a, b) =>
          Number(b.total_votes || b.public_score || 0) -
          Number(a.total_votes || a.public_score || 0)
      )

    const leader = categoryNominations[0] || null
    const event = events.find(item => item.id === category.event_id)

    return {
      category,
      event,
      leader,
      total_nominees: categoryNominations.length,
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
  const yes = window.confirm(
    `Reset all voting data for "${event.name}"?\n\nThis will clear all payments, revenue, vote records and reset nominee votes for this event to zero.\n\nCategories and nominees will remain.`
  )

  if (!yes) return

  setSaving(true)

  try {
    const { data: eventNominations, error: nominationFetchError } = await supabase
      .from('nominations')
      .select('id')
      .eq('event_id', event.id)

    if (nominationFetchError) throw nominationFetchError

    const nominationIds = (eventNominations || []).map(item => item.id)

    const deleteByEvent = await supabase
      .from('vote_transactions')
      .delete()
      .eq('event_id', event.id)

    if (deleteByEvent.error) throw deleteByEvent.error

    if (nominationIds.length > 0) {
      const deleteByNomination = await supabase
        .from('vote_transactions')
        .delete()
        .in('nomination_id', nominationIds)

      if (deleteByNomination.error) throw deleteByNomination.error
    }

    const resetVotes = await supabase
      .from('nominations')
      .update({ total_votes: 0 })
      .eq('event_id', event.id)

    if (resetVotes.error) throw resetVotes.error

    setTransactions(prev => prev.filter(tx => tx.event_id !== event.id))
    setNominations(prev =>
      prev.map(item =>
        item.event_id === event.id
          ? { ...item, total_votes: 0, public_score: 0 }
          : item
      )
    )

    toast.success('Event payments, revenue and votes have been reset')

    await loadAll()
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

    if (!categoryForm.organization_id) return toast.error('Select an organization')
    if (!categoryForm.event_id) return toast.error('Select an event under the organization')

    setSaving(true)

    try {
      const selectedEvent = events.find(e => e.id === categoryForm.event_id)
      if (!selectedEvent) throw new Error('Selected event not found')

      const coverUrl = await uploadMedia(categoryForm.cover_file, 'categories', categoryForm.name)

      const payload = {
        organization_id: selectedEvent.organization_id || categoryForm.organization_id,
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
      setCategoryForm({
        organization_id: categoryForm.organization_id,
        event_id: categoryForm.event_id,
        name: '',
        description: '',
        cover_file: null,
      })
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
      const selectedEvent = events.find(e => e.id === editingCategory.event_id)
      if (!selectedEvent) throw new Error('Selected event not found')

      let coverUrl = editingCategory.cover_url || null

      if (editingCategory.cover_file) {
        coverUrl = await uploadMedia(editingCategory.cover_file, 'categories', editingCategory.name)
      }

      const payload = {
        organization_id: selectedEvent.organization_id || editingCategory.organization_id,
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


  async function deleteCategory(category) {
    const yes = window.confirm(
      `Delete category "${category.name}"?\n\nThis will delete nominations and transactions linked to this category. Nominees will remain.`
    )

    if (!yes) return
    setSaving(true)

    try {
      const deleteTx = await supabase
        .from('vote_transactions')
        .delete()
        .eq('category_id', category.id)

      if (deleteTx.error) throw deleteTx.error

      const deleteNominations = await supabase
        .from('nominations')
        .delete()
        .eq('category_id', category.id)

      if (deleteNominations.error) throw deleteNominations.error

      const deleteCategoryRes = await supabase
        .from('categories')
        .delete()
        .eq('id', category.id)

      if (deleteCategoryRes.error) throw deleteCategoryRes.error

      toast.success('Category deleted')
      loadAll()
    } catch (error) {
      toast.error(error.message || 'Could not delete category')
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


  async function deleteNominee(nominee) {
    const yes = window.confirm(
      `Delete nominee "${nominee.full_name}"?\n\nThis will delete their nominations and related transactions.`
    )

    if (!yes) return
    setSaving(true)

    try {
      const deleteTx = await supabase
        .from('vote_transactions')
        .delete()
        .eq('nominee_id', nominee.id)

      if (deleteTx.error) throw deleteTx.error

      const deleteNominations = await supabase
        .from('nominations')
        .delete()
        .eq('nominee_id', nominee.id)

      if (deleteNominations.error) throw deleteNominations.error

      const deleteNomineeRes = await supabase
        .from('nominees')
        .delete()
        .eq('id', nominee.id)

      if (deleteNomineeRes.error) throw deleteNomineeRes.error

      toast.success('Nominee deleted')
      loadAll()
    } catch (error) {
      toast.error(error.message || 'Could not delete nominee')
    } finally {
      setSaving(false)
    }
  }

  async function createBulkNominees(e) {
    e.preventDefault()

    if (!bulkForm.organization_id) return toast.error('Select an organization')
    if (!bulkForm.event_id) return toast.error('Select an event under the organization')
    if (!bulkForm.category_id) return toast.error('Select a category to assign the nominees')

    const names = bulkForm.names
      .split(/[\n,;]+/)
      .map(name => name.replace(/["']/g, '').trim())
      .filter(Boolean)

    if (names.length === 0) return toast.error('Enter at least one nominee name')

    setSaving(true)

    try {
      const selectedEvent = events.find(e => e.id === bulkForm.event_id)
      const selectedCategory = categories.find(c => c.id === bulkForm.category_id)

      if (!selectedEvent || !selectedCategory) {
        throw new Error('Selected event or category was not found')
      }

      if (selectedEvent.organization_id !== bulkForm.organization_id) {
        throw new Error('Selected event does not belong to the selected organization')
      }

      const nomineePayload = names.map(name => ({
        organization_id: selectedEvent.organization_id,
        full_name: name,
        nickname: null,
        level: bulkForm.level || null,
        bio: null,
        image_url: null,
        is_active: true,
      }))

      const { data: createdNominees, error } = await supabase
        .from('nominees')
        .insert(nomineePayload)
        .select('*')

      if (error) throw error

      const nominationPayload = createdNominees.map((nominee, index) => ({
        organization_id: selectedEvent.organization_id,
        event_id: selectedEvent.id,
        category_id: selectedCategory.id,
        nominee_id: nominee.id,
        slug: `${slugify(nominee.full_name)}-${slugify(selectedCategory.name)}-${Date.now()}-${index}`,
        total_votes: 0,
        is_active: true,
      }))

      const nominationRes = await supabase
        .from('nominations')
        .insert(nominationPayload)

      if (nominationRes.error) throw nominationRes.error

      toast.success(`${createdNominees.length} nominees created and assigned`)

      setBulkForm({
        organization_id: organizations[0]?.id || '',
        event_id: events[0]?.id || '',
        category_id: '',
        level: '',
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

    if (!assignForm.organization_id) return toast.error('Select an organization')
    if (!assignForm.event_id) return toast.error('Select an event')
    if (!assignForm.category_id) return toast.error('Select a category')
    if (!assignForm.nominee_id) return toast.error('Select a nominee')

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

        <main className="w-full min-w-0 max-w-full overflow-hidden p-3 sm:p-4 md:p-8 space-y-5 md:space-y-6">
          <div className="lg:hidden sticky top-0 z-40 rounded-[1.25rem] bg-white/95 backdrop-blur border border-slate-200 p-3 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <Brand compact />
              <button onClick={logout} className="shrink-0 rounded-full bg-red-50 px-4 py-2 text-sm font-black text-red-600">Logout</button>
            </div>

            <div className="mt-4 -mx-1 overflow-x-auto pb-2 px-1">
              <div className="grid grid-flow-col auto-cols-max gap-2 min-w-max">
                {tabs.map(([key, Icon, label]) => (
                  <button key={key} onClick={() => setActive(key)} className={`flex items-center gap-2 rounded-full px-4 py-3 text-sm font-black whitespace-nowrap ${active === key ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <Icon size={18} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="min-w-0 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-green-700">Admin Panel</p>
              <h1 className="break-words text-2xl sm:text-3xl md:text-5xl font-black text-slate-950">{tabs.find(t => t[0] === active)?.[2] || 'Dashboard'}</h1>
            </div>

            <button onClick={loadAll} className="w-full md:w-auto rounded-full bg-white border border-slate-200 px-6 py-3 font-black text-blue-800">Refresh</button>
          </div>

          {loading && <p className="font-bold">Loading admin data...</p>}

          {active === 'overview' && <Overview stats={stats} eventStats={eventStats} setActive={setActive} />}
          {active === 'organizations' && <OrganizationsTab organizationForm={organizationForm} setOrganizationForm={setOrganizationForm} organizationStats={organizationStats} createOrganization={createOrganization} setEditingOrganization={setEditingOrganization} deleteOrganization={deleteOrganization} saving={saving} />}
          {active === 'events' && <EventsTab eventForm={eventForm} setEventForm={setEventForm} organizations={organizations} eventStats={eventStats} createEvent={createEvent} setEditingEvent={setEditingEvent} resetEventData={resetEventData} deleteEvent={deleteEvent} saving={saving} />}
          {active === 'categories' && <CategoriesTab categoryForm={categoryForm} setCategoryForm={setCategoryForm} organizations={organizations} events={events} categoryStats={categoryStats} createCategory={createCategory} setEditingCategory={setEditingCategory} deleteCategory={deleteCategory} saving={saving} />}
          {active === 'nominees' && <NomineesTab nomineeForm={nomineeForm} setNomineeForm={setNomineeForm} bulkForm={bulkForm} setBulkForm={setBulkForm} organizations={organizations} events={events} categories={categories} nominees={nominees} createNominee={createNominee} createBulkNominees={createBulkNominees} setEditingNominee={setEditingNominee} deleteNominee={deleteNominee} saving={saving} />}
          {active === 'nominations' && <NominationsTab assignForm={assignForm} setAssignForm={setAssignForm} organizations={organizations} events={events} categories={categories} nominees={nominees} nominations={nominations} assignNominee={assignNominee} copyLink={copyLink} saving={saving} />}
          {active === 'leaders' && (
  <section className="space-y-6">
    <Panel title="First Position in Every Category">
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {categoryLeaders.length === 0 ? (
          <p className="text-slate-500 font-bold">
            No categories available yet.
          </p>
        ) : (
          categoryLeaders.map(({ category, event, leader, total_nominees }) => (
            <div
              key={category.id}
              className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-green-700">
                    {event?.name || 'Event'}
                  </p>

                  <h3 className="mt-2 text-xl font-black text-slate-950 truncate">
                    {category.name}
                  </h3>

                  <p className="mt-1 text-sm font-bold text-slate-500">
                    {total_nominees} nominees
                  </p>
                </div>

                <div className="h-12 w-12 rounded-2xl bg-yellow-100 text-yellow-700 grid place-items-center shrink-0">
                  <Crown size={24} />
                </div>
              </div>

              {leader ? (
                <div className="mt-5 flex items-center gap-4 rounded-2xl bg-white border border-slate-200 p-4">
                  <PreviewImage src={leader.image_url} icon={Users} circle />

                  <div className="min-w-0">
                    <p className="text-sm font-black text-blue-800">
                      Current Leader
                    </p>

                    <h4 className="font-black text-slate-950 truncate">
                      {leader.full_name}
                    </h4>

                    <p className="text-sm text-slate-500 truncate">
                      {leader.nickname || 'No nickname'}
                    </p>

                    <p className="mt-1 text-xs font-black text-green-700">
                      {Number(leader.total_votes || leader.public_score || 0)} votes / score
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-2xl bg-white border border-slate-200 p-4 text-center">
                  <p className="font-black text-slate-700">
                    No nominee in this category yet
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </Panel>
  </section>
)}
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
      <div className="grid sm:grid-cols-2 xl:grid-cols-8 gap-4">
        <Stat title="Votes" value={stats.votes} />
        <Stat title="Revenue" value={currency(stats.revenue)} />
        <Stat title="Successful Payments" value={stats.successful_transactions} />
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
                <p className="text-sm text-slate-500 truncate">{event.organization_name} • {event.category_count} categories • {event.nomination_count} nominations</p>
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
    <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,430px)_minmax(0,1fr)] gap-4 md:gap-6">
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
    <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,430px)_minmax(0,1fr)] gap-4 md:gap-6">
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
                <p className="text-sm text-slate-500 truncate">{event.organization_name} • {event.category_count} categories • {event.nomination_count} nominations</p>
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

function CategoriesTab({
  categoryForm,
  setCategoryForm,
  organizations,
  events,
  categoryStats,
  createCategory,
  setEditingCategory,
  deleteCategory,
  saving,
}) {
  const filteredEvents = events.filter(
    event => event.organization_id === categoryForm.organization_id
  )

  return (
    <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,430px)_minmax(0,1fr)] gap-4 md:gap-6">
      <Panel title="Create Category">
        <form onSubmit={createCategory} className="space-y-4">
          <Select
            label="Organization"
            value={categoryForm.organization_id}
            onChange={v =>
              setCategoryForm({
                ...categoryForm,
                organization_id: v,
                event_id: '',
              })
            }
            options={organizations.map(o => [o.id, o.name])}
          />

          <Select
            label="Event"
            value={categoryForm.event_id}
            onChange={v => setCategoryForm({ ...categoryForm, event_id: v })}
            options={filteredEvents.map(e => [e.id, e.name])}
          />

          <Input
            label="Category Name"
            value={categoryForm.name}
            onChange={v => setCategoryForm({ ...categoryForm, name: v })}
            required
          />

          <Textarea
            label="Description"
            value={categoryForm.description}
            onChange={v => setCategoryForm({ ...categoryForm, description: v })}
          />

          <FileInput
            label="Category Cover Image"
            file={categoryForm.cover_file}
            onChange={file => setCategoryForm({ ...categoryForm, cover_file: file })}
          />

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
                <p className="text-sm text-slate-500 truncate">
                  {cat.organization_name} • {cat.event_name}
                </p>
                <p className="text-xs font-black text-blue-800">
                  {cat.nominee_count} nominees • {cat.total_votes} public score
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <IconButton onClick={() => setEditingCategory({ ...cat, cover_file: null })}>
                <Pencil size={16} />
              </IconButton>

              <DangerButton onClick={() => deleteCategory(cat)}>
                <Trash2 size={16} />
              </DangerButton>
            </div>
          </>
        )} />
      </Panel>
    </section>
  )
}

function NomineesTab({ nomineeForm, setNomineeForm, bulkForm, setBulkForm, organizations, events, categories, nominees, createNominee, createBulkNominees, setEditingNominee, deleteNominee, saving }) {
  return (
    <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,430px)_minmax(0,1fr)] gap-4 md:gap-6">
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
            <Select
              label="Organization"
              value={bulkForm.organization_id}
              onChange={v => setBulkForm({ ...bulkForm, organization_id: v, event_id: '', category_id: '' })}
              options={organizations.map(o => [o.id, o.name])}
            />
            <Select
              label="Event"
              value={bulkForm.event_id}
              onChange={v => setBulkForm({ ...bulkForm, event_id: v, category_id: '' })}
              options={events
                .filter(e => e.organization_id === bulkForm.organization_id)
                .map(e => [e.id, e.name])}
            />
            <Select
              label="Assign to Category"
              value={bulkForm.category_id}
              onChange={v => setBulkForm({ ...bulkForm, category_id: v })}
              options={categories
                .filter(c => c.event_id === bulkForm.event_id)
                .map(c => [c.id, c.name])}
            />
           
<Select
  label="Level Optional"
  value={bulkForm.level}
  onChange={v => setBulkForm({ ...bulkForm, level: v })}
  options={['100', '200', '300', '400', '500'].map(x => [x, x])}
/>

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
            <div className="flex items-center gap-2">
              <IconButton onClick={() => setEditingNominee({ ...n, image_file: null })}>
                <Pencil size={16} />
              </IconButton>

              <DangerButton onClick={() => deleteNominee(n)}>
                <Trash2 size={16} />
              </DangerButton>
            </div>
          </>
        )} />
      </Panel>
    </section>
  )
}

function NominationsTab({
  assignForm,
  setAssignForm,
  organizations,
  events,
  categories,
  nominees,
  nominations,
  assignNominee,
  copyLink,
  saving,
}) {
  const filteredEvents = events.filter(
    event => event.organization_id === assignForm.organization_id
  )

  const filteredCategories = categories.filter(
    category => category.event_id === assignForm.event_id
  )

  return (
    <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,430px)_minmax(0,1fr)] gap-4 md:gap-6">
      <Panel title="Assign Existing Nominee">
        <form onSubmit={assignNominee} className="space-y-4">
          <Select
            label="Organization"
            value={assignForm.organization_id}
            onChange={v =>
              setAssignForm({
                ...assignForm,
                organization_id: v,
                event_id: '',
                category_id: '',
              })
            }
            options={organizations.map(o => [o.id, o.name])}
          />

          <Select
            label="Event"
            value={assignForm.event_id}
            onChange={v =>
              setAssignForm({
                ...assignForm,
                event_id: v,
                category_id: '',
              })
            }
            options={filteredEvents.map(e => [e.id, e.name])}
          />

          <Select
            label="Category"
            value={assignForm.category_id}
            onChange={v => setAssignForm({ ...assignForm, category_id: v })}
            options={filteredCategories.map(c => [c.id, c.name])}
          />

          <Select
            label="Nominee"
            value={assignForm.nominee_id}
            onChange={v => setAssignForm({ ...assignForm, nominee_id: v })}
            options={nominees.map(n => [n.id, n.full_name])}
          />

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

            <IconButton onClick={() => copyLink(n.slug)}>
              <Copy size={16} />
            </IconButton>
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
  return <section className="min-w-0 overflow-hidden rounded-[1.25rem] sm:rounded-[2rem] bg-white border border-slate-200 p-4 sm:p-5 md:p-6 shadow-lg"><h2 className="break-words text-lg sm:text-xl md:text-2xl font-black text-slate-950 mb-5">{title}</h2>{children}</section>
}

function Stat({ title, value }) {
  return <div className="min-w-0 rounded-[1.25rem] sm:rounded-[1.5rem] bg-white border border-slate-200 p-4 sm:p-5 shadow-lg"><p className="text-xs sm:text-sm font-bold text-slate-500">{title}</p><p className="mt-2 break-words text-xl sm:text-2xl md:text-3xl font-black text-slate-950">{value}</p></div>
}

function Quick({ label, onClick }) {
  return <button onClick={onClick} className="rounded-2xl bg-blue-800 px-4 sm:px-5 py-4 text-white font-black flex items-center justify-center gap-2"><Plus size={18} />{label}</button>
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
  return <div className="min-w-0 space-y-3 max-h-[660px] overflow-y-auto overflow-x-hidden pr-0 sm:pr-1">{items.length === 0 ? <p className="text-slate-500 font-bold">No records yet.</p> : items.map(item => <div key={item.id} className="w-full min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">{render(item)}</div>)}</div>
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
  return <div className="fixed inset-0 z-[100] bg-black/50 p-3 sm:p-4 grid place-items-center"><div className="w-full max-w-xl rounded-[1.5rem] sm:rounded-[2rem] bg-white p-4 sm:p-5 md:p-6 shadow-2xl max-h-[92vh] overflow-y-auto"><div className="flex items-center justify-between gap-4 mb-6"><h2 className="break-words text-xl sm:text-2xl font-black text-slate-950">{title}</h2><button onClick={onClose} className="h-10 w-10 rounded-full bg-slate-100 grid place-items-center shrink-0"><X size={20} /></button></div>{children}</div></div>
}
