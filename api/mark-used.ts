import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client directly - Vercel injects env vars automatically
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

  const payload = req.body as { activationToken?: string };
  const activationToken = payload.activationToken?.trim();

  if (!activationToken) {
    return res.status(400).json({ error: 'Activation token is required' });
  }

  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('passcodes')
      .select('code,status,activation_token,expires_at')
      .eq('activation_token', activationToken)
      .maybeSingle();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!data) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Check if already used (idempotent)
    if (data.status === 'USED') {
      return res.json({ ok: true, alreadyUsed: true });
    }

    const now = new Date();
    const expiresAt = data.expires_at ? new Date(data.expires_at) : null;
    const isExpired = !expiresAt || expiresAt <= now;

    if (data.status !== 'ACTIVATED' || isExpired) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Mark the code as used
    const { error: updateError } = await supabase
      .from('passcodes')
      .update({
        status: 'USED',
        used_at: now.toISOString(),
        activation_token: null,
      })
      .eq('code', data.code);

    if (updateError) {
      console.error('Update error:', updateError);
      return res.status(500).json({ error: 'Failed to mark code as used' });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
