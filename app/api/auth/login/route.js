import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '../../../../lib/supabase';
import { createToken } from '../../../../lib/auth';

export async function POST(request) {
  const { username: rawUsername, password } = await request.json();
  const username = rawUsername?.trim();

  if (!username || !password) {
    return NextResponse.json({ error: 'Fyll inn brukernavn og passord' }, { status: 400 });
  }

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .ilike('username', username)
    .single();

  if (!user) {
    return NextResponse.json({ error: 'Feil brukernavn eller passord' }, { status: 401 });
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) {
    return NextResponse.json({ error: 'Feil brukernavn eller passord' }, { status: 401 });
  }

  const token = await createToken(user.id, user.username, user.is_admin);
  const response = NextResponse.json({ ok: true, username: user.username, isAdmin: user.is_admin });
  response.cookies.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  return response;
}
