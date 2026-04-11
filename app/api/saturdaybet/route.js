export const dynamic = 'force-dynamic';
import { supabase } from '../../../lib/supabase';
import { getSession } from '../../../lib/auth';

export async function GET() {
  const [{ data: bets }, { data: users }] = await Promise.all([
    supabase.from('saturday_bets').select('user_id, player_name, tiebreaker, created_at').order('created_at'),
    supabase.from('users').select('id, username'),
  ]);

  const userMap = Object.fromEntries((users || []).map(u => [u.id, u.username]));
  const result = (bets || []).map(b => ({
    name: userMap[b.user_id] || 'Ukjent',
    player: b.player_name,
    tiebreaker: b.tiebreaker,
  }));

  return new Response(JSON.stringify({ bets: result }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export async function POST(request) {
  const session = await getSession();
  if (!session) return new Response(JSON.stringify({ error: 'Ikke innlogget' }), { status: 401 });

  const { player, tiebreaker } = await request.json();
  if (!player || !tiebreaker) return new Response(JSON.stringify({ error: 'Mangler spiller eller tiebreaker' }), { status: 400 });

  const { data: user } = await supabase.from('users').select('id').eq('username', session.username).single();
  if (!user) return new Response(JSON.stringify({ error: 'Bruker ikke funnet' }), { status: 404 });

  const { error } = await supabase.from('saturday_bets').upsert(
    { user_id: user.id, player_name: player, tiebreaker: parseInt(tiebreaker) },
    { onConflict: 'user_id' }
  );

  if (error) return new Response(JSON.stringify({ error: 'Kunne ikke lagre' }), { status: 500 });
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
}
