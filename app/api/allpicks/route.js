export const dynamic = 'force-dynamic';
import { supabase } from '../../../lib/supabase';

export async function GET() {
  const [{ data: picks, error: e1 }, { data: users, error: e2 }] = await Promise.all([
    supabase.from('picks').select('user_id, player1, player2, player3, player4, reserve'),
    supabase.from('users').select('id, username'),
  ]);

  if (e1 || e2) {
    return new Response(JSON.stringify({ participants: [], error: e1?.message || e2?.message }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }

  const userMap = Object.fromEntries((users || []).map(u => [u.id, u.username]));

  const participants = (picks || []).map(row => ({
    name: userMap[row.user_id] || 'Ukjent',
    picks: [row.player1, row.player2, row.player3, row.player4].filter(Boolean),
    reserve: row.reserve || null,
  }));

  return new Response(JSON.stringify({ participants }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store, no-cache, must-revalidate' },
  });
}
