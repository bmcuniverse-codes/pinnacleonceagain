// Supabase Edge Function: paystack-webhook
// Required secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PAYSTACK_SECRET_KEY
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

async function hmacSHA512(message: string, secret: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('')
}

serve(async (req) => {
  try {
    const body = await req.text()
    const signature = req.headers.get('x-paystack-signature') || ''
    const expected = await hmacSHA512(body, Deno.env.get('PAYSTACK_SECRET_KEY')!)
    if (signature !== expected) return new Response('Invalid signature', { status: 401 })

    const event = JSON.parse(body)
    if (event.event !== 'charge.success') return new Response('Ignored', { status: 200 })

    const reference = event.data.reference
    const amountPaid = Number(event.data.amount || 0) / 100

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: tx, error: txError } = await supabase.from('vote_transactions').select('*').eq('payment_reference', reference).single()
    if (txError || !tx) throw new Error('Transaction not found')
    if (Number(tx.amount) !== amountPaid) throw new Error('Amount mismatch')

    const { error } = await supabase.rpc('confirm_vote_transaction', { ref: reference, payload: event })
    if (error) throw error
    return new Response('OK', { status: 200 })
  } catch (error) {
    return new Response(error.message, { status: 400 })
  }
})
