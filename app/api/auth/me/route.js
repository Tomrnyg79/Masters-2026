export const dynamic = 'force-dynamic';
import { getSession } from '../../../../lib/auth';

export async function GET() {
  const session = await getSession();
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  if (!session) {
    return new Response(JSON.stringify({ user: null }), { headers });
  }
  return new Response(JSON.stringify({ user: { username: session.username, isAdmin: session.isAdmin } }), { headers });
}
