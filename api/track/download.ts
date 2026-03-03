import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase } from '../lib/supabase';

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
