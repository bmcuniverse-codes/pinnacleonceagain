import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function cleanText(value: unknown, max = 120) {
  if (!value) return null
  return String(value).trim().slice(0, max) || null
}

function ticketCode() {
  return `TKT-${crypto.randomUUID().replace(/-/g, '').slice(0, 18).toUpperCase()}`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { buyer_name, buyer_phone, buyer_email, ticket_type } = await req.json()

    const buyerName = cleanText(buyer_name, 100)
    const buyerPhone = cleanText(buyer_phone, 30)
    const buyerEmail = cleanText(buyer_email, 120)
    const selectedType = ticket_type === 'couple' ? 'couple' : 'single'

    if (!buyerName) throw new Error('Full name is required')
    if (!buyerPhone) throw new Error('Phone number is required')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY')
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:5173'

    if (!supabaseUrl || !serviceRoleKey) throw new Error('Supabase secrets are missing')
    if (!paystackSecretKey) throw new Error('Paystack secret key is missing')

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { data: settings, error: settingsError } = await supabase
      .from('ticket_settings')
      .select('*')
      .eq('id', 1)
      .single()

    if (settingsError || !settings) throw new Error('Ticket settings not found')
    if (!settings.ticket_sales_open) throw new Error('Ticket sales are closed')

    const earlyEndsAt = settings.early_bird_ends_at ? new Date(settings.early_bird_ends_at).getTime() : 0
    const isEarly = earlyEndsAt && Date.now() <= earlyEndsAt
    const ticketPhase = isEarly ? 'early_bird' : 'regular'
    const amount = Number(
      isEarly
        ? selectedType === 'couple' ? settings.early_couple_price : settings.early_single_price
        : selectedType === 'couple' ? settings.regular_couple_price : settings.regular_single_price
    )

    if (!Number.isFinite(amount) || amount <= 0) throw new Error('Ticket price is invalid')

    const code = ticketCode()
    const reference = `VTK-${crypto.randomUUID()}`
    const email = buyerEmail || `ticket-${reference.toLowerCase().replace(/[^a-z0-9]/g, '')}@bmcpinnacletech.com`

    const { error: ticketError } = await supabase.from('tickets').insert({
      ticket_code: code,
      buyer_name: buyerName,
      buyer_phone: buyerPhone,
      buyer_email: buyerEmail,
      ticket_phase: ticketPhase,
      ticket_type: selectedType,
      amount,
      payment_reference: reference,
      payment_status: 'pending',
      ticket_status: 'pending',
    })

    if (ticketError) throw ticketError

    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: Math.floor(amount) * 100,
        reference,
        callback_url: `${frontendUrl}/ticket/success?code=${encodeURIComponent(code)}&reference=${encodeURIComponent(reference)}`,
        metadata: {
          payment_type: 'ticket',
          ticket_code: code,
          buyer_name: buyerName,
          buyer_phone: buyerPhone,
          ticket_phase: ticketPhase,
          ticket_type: selectedType,
        },
      }),
    })

    const paystackData = await paystackRes.json()

    if (!paystackRes.ok || !paystackData.status) {
      await supabase
        .from('tickets')
        .update({ payment_status: 'failed' })
        .eq('payment_reference', reference)

      throw new Error(paystackData.message || 'Paystack initialization failed')
    }

    return new Response(
      JSON.stringify({
        authorization_url: paystackData.data.authorization_url,
        reference,
        ticket_code: code,
        amount,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Something went wrong' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
