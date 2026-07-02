import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-verifier-code',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function publicTicket(ticket: Record<string, unknown>) {
  return {
    id: ticket.id,
    ticket_code: ticket.ticket_code,
    buyer_name: ticket.buyer_name,
    buyer_phone: ticket.buyer_phone,
    ticket_phase: ticket.ticket_phase,
    ticket_type: ticket.ticket_type,
    amount: ticket.amount,
    payment_status: ticket.payment_status,
    ticket_status: ticket.ticket_status,
    used_at: ticket.used_at,
    created_at: ticket.created_at,
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })

  try {
    if (req.method !== 'POST') throw new Error('Method not allowed')

    const requiredCode = Deno.env.get('VERIFIER_ACCESS_CODE') || ''
    const suppliedCode = req.headers.get('x-verifier-code') || ''

    if (!requiredCode) throw new Error('Verifier access code is not configured')
    if (suppliedCode !== requiredCode) throw new Error('Unauthorized verifier')

    const { ticket_code, action } = await req.json()
    const ticketCode = String(ticket_code || '').trim()
    const selectedAction = action === 'use' ? 'use' : 'check'

    if (!ticketCode) throw new Error('Ticket code is required')

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: ticket, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('ticket_code', ticketCode)
      .maybeSingle()

    if (error) throw error

    if (!ticket) {
      return new Response(JSON.stringify({ status: 'invalid', message: 'Ticket not found' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (ticket.payment_status !== 'success') {
      return new Response(JSON.stringify({ status: 'invalid', message: 'Payment has not been confirmed', ticket: publicTicket(ticket) }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (ticket.ticket_status === 'used') {
      return new Response(JSON.stringify({ status: 'used', message: 'This ticket has already been used', ticket: publicTicket(ticket) }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (ticket.ticket_status !== 'valid') {
      return new Response(JSON.stringify({ status: 'invalid', message: 'Ticket is not valid for entry', ticket: publicTicket(ticket) }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (selectedAction === 'use') {
      const { data: updated, error: updateError } = await supabase
        .from('tickets')
        .update({
          ticket_status: 'used',
          used_at: new Date().toISOString(),
          used_by: 'gate-verifier',
        })
        .eq('id', ticket.id)
        .eq('ticket_status', 'valid')
        .select('*')
        .single()

      if (updateError || !updated) throw new Error('Ticket could not be marked as used')

      return new Response(JSON.stringify({ status: 'used', message: 'Ticket confirmed and marked as used', ticket: publicTicket(updated) }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ status: 'valid', message: 'Ticket is valid for entry', ticket: publicTicket(ticket) }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Something went wrong' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
