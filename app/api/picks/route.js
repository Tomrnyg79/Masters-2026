import { NextResponse } from 'next/server';
import { getSession } from '../../../lib/auth';
import { supabase } from '../../../lib/supabase';

// Hent egne picks
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Ikke innlogget' }, { status: 401 });

  const { data } = await supabase
    .from('picks')
    .select('*')
    .eq('user_id', session.userId)
    .single();

  return NextResponse.json({ picks: data || null });
}

// Lagre picks
export async function POST(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Ikke innlogget' }, { status: 401 });

  const { player1, player2, player3, player4, reserve } = await request.json();

  if (!player1 || !player2 || !player3 || !player4) {
    return NextResponse.json({ error: 'Du må velge 4 spillere' }, { status: 400 });
  }

  const players = [player1, player2, player3, player4];
  const unique = new Set(players);
  if (unique.size !== 4) {
    return NextResponse.json({ error: 'Du kan ikke velge samme spiller to ganger' }, { status: 400 });
  }

  // Upsert picks (oppdater hvis finnes, opprett hvis ikke)
  const { error } = await supabase
    .from('picks')
    .upsert({
      user_id: session.userId,
      player1, player2, player3, player4,
      reserve: reserve || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (error) {
    return NextResponse.json({ error: 'Kunne ikke lagre picks' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
