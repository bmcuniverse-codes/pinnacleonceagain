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

function cleanAmount(value: unknown) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) throw new Error('Enter a valid amount')
  if (amount <= 0) throw new Error('Amount must be greater than zero')
  return Math.floor(amount)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const {
      nomination_id,
      amount,
      supporter_name,
      supporter_message,
      voter_phone,
    } = await req.json()

    if (!nomination_id) throw new Error('Nomination is required')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY')
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:5173'

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase secrets are missing')
    }

    if (!paystackSecretKey) {
      throw new Error('Paystack secret key is missing')
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { data: nomination, error: nominationError } = await supabase
      .from('nominations_public')
      .select('*')
      .eq('id', nomination_id)
      .single()

    if (nominationError || !nomination) {
      throw new Error('Nomination not found')
    }

    if (!nomination.voting_open) {
      throw new Error('Voting is closed for this event')
    }

    const votePrice = Number(nomination.vote_price || 50)
    const paymentAmount = cleanAmount(amount)

    if (paymentAmount < votePrice) {
      throw new Error(`Minimum vote amount is ₦${votePrice}`)
    }

    if (paymentAmount % votePrice !== 0) {
      throw new Error(`Amount must be a multiple of ₦${votePrice}`)
    }

    const votes = paymentAmount / votePrice
    const reference = `VW-${crypto.randomUUID()}`
    const generatedEmail = `vote-${reference
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')}@bmcpinnacletech.com`

    const safeSupporterName = cleanText(supporter_name, 80)
    const safeSupporterMessage = cleanText(supporter_message, 180)
    const safePhone = cleanText(voter_phone, 30)

    const { error: txError } = await supabase.from('vote_transactions').insert({
      organization_id: nomination.organization_id,
      event_id: nomination.event_id,
      category_id: nomination.category_id,
      nominee_id: nomination.nominee_id,
      nomination_id,
      votes,
      amount: paymentAmount,
      payment_reference: reference,
      generated_email: generatedEmail,
      supporter_name: safeSupporterName,
      supporter_message: safeSupporterMessage,
      voter_phone: safePhone,
      payment_status: 'pending',
    })

    if (txError) throw txError

    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: generatedEmail,
        amount: paymentAmount * 100,
        reference,
        callback_url: `${frontendUrl}/success?reference=${reference}`,
        metadata: {
          nomination_id,
          organization_id: nomination.organization_id,
          event_id: nomination.event_id,
          category_id: nomination.category_id,
          nominee_id: nomination.nominee_id,
          votes,
          supporter_name: safeSupporterName || 'Anonymous',
          voter_phone: safePhone,
        },
      }),
    })

    const paystackData = await paystackRes.json()

    if (!paystackRes.ok || !paystackData.status) {
      await supabase
        .from('vote_transactions')
        .update({
          payment_status: 'failed',
          provider_response: paystackData,
        })
        .eq('payment_reference', reference)

      throw new Error(paystackData.message || 'Paystack initialization failed')
    }

    await supabase
      .from('vote_transactions')
      .update({
        access_code: paystackData.data.access_code,
        provider_response: paystackData,
      })
      .eq('payment_reference', reference)

    return new Response(
      JSON.stringify({
        authorization_url: paystackData.data.authorization_url,
        reference,
        votes,
        amount: paymentAmount,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Something went wrong',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})