import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase } from './lib/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = req.query.action as string;

  if (action === 'stats') {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const defaultStats = { downloads: 0, users: 0, stars: 0 };

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('counters')
        .select('id, count')
        .in('id', ['downloads', 'users', 'stars']);

      if (error) {
        console.error('[track/stats] Failed to fetch:', error.message);
        return res.json(defaultStats);
      }

      const stats = { ...defaultStats };

      for (const row of data || []) {
        if (row.id === 'downloads') {
          stats.downloads = Number(row.count);
        } else if (row.id === 'users') {
          stats.users = Number(row.count);
        } else if (row.id === 'stars') {
          stats.stars = Number(row.count);
        }
      }

      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
      return res.json(stats);
    } catch (err) {
      console.error('[track/stats] Unexpected error:', err);
      return res.json(defaultStats);
    }
  }

  if (action === 'download' || action === 'user') {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const counterId = action === 'download' ? 'downloads' : 'users';

    try {
      const supabase = getSupabase();
      const { error } = await supabase.rpc('increment_counter', { counter_id: counterId });

      if (error) {
        console.error(`[track/${action}] Failed to increment:`, error.message);
      } else {
        console.log(`[track/${action}] Incremented ${counterId} counter`);
      }
    } catch (err) {
      console.error(`[track/${action}] Unexpected error:`, err);
    }

    return res.json({ success: true });
  }

  return res.status(400).json({ error: 'Invalid action. Use ?action=stats|download|user' });
}
