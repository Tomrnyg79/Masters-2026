export const dynamic = 'force-dynamic';
import { supabase } from '../../../lib/supabase';

// Hent alle deltakere og picks for stillingslisten (public)
export async function GET() {
  const { data: picksOnly, error: e1 } = await supabase.from('picks').select('user_id');
  const { data, error } = await supabase
    .from('picks')
    .select(`
      player1, player2, player3, player4, reserve,
      users ( username )
    `);

  if (error) {
    return Response.json({ participants: [], error: error.message });
  }

  const participants = (data || []).map(row => ({
    name: row.users?.username || 'Ukjent',
    picks: [row.player1, row.player2, row.player3, row.player4].filter(Boolean),
    reserve: row.reserve || null,
  }));

  return new Response(JSON.stringify({ participants, _debug_raw: data?.length, _debug_picks_only: picksOnly?.length, _debug_error: e1?.message }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
