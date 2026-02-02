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
  // Only allow GET
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

    return res.json(stats);
  } catch (err) {
    console.error('[track/stats] Unexpected error:', err);
    return res.json(defaultStats);
  }
}
