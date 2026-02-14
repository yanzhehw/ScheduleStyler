import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Await database operation BEFORE responding (Vercel terminates after response)
  try {
    const supabase = getSupabase();
    const { error } = await supabase.rpc('increment_counter', { counter_id: 'downloads' });

    if (error) {
      console.error('[track/download] Failed to increment:', error.message);
    } else {
      console.log('[track/download] Incremented downloads counter');
    }
  } catch (err) {
    console.error('[track/download] Unexpected error:', err);
  }

  // Always return success - tracking failures should not break the UX
  return res.json({ success: true });
}
