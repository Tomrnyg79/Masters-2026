import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '../../../../lib/supabase';
import { createToken } from '../../../../lib/auth';

export async function POST(request) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return NextResponse.json({ error: 'Brukernavn og passord er påkrevd' }, { status: 400 });
  }
  if (username.length < 2) {
    return NextResponse.json({ error: 'Brukernavn må ha minst 2 tegn' }, { status: 400 });
  }
  if (password.length < 4) {
    return NextResponse.json({ error: 'Passord må ha minst 4 tegn' }, { status: 400 });
  }

  // Sjekk om brukernavnet er tatt
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .ilike('username', username)
    .single();

  if (existing) {
    return NextResponse.json({ error: 'Brukernavnet er allerede tatt' }, { status: 409 });
  }

  // Hash passord og opprett bruker
  const passwordHash = await bcrypt.hash(password, 10);
  const { data: user, error } = await supabase
    .from('users')
    .insert({ username: username.trim(), password_hash: passwordHash })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Kunne ikke opprette bruker' }, { status: 500 });
  }

  // Opprett session
  const token = await createToken(user.id, user.username, user.is_admin);
  const response = NextResponse.json({ ok: true, username: user.username });
  response.cookies.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 dager
    path: '/',
  });

  return response;
}
