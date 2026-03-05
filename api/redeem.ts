import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { getSupabase } from './lib/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const payload = req.body as { code?: string };
  const code = payload.code?.trim();

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('passcodes')
      .select('code,status,activation_token,expires_at')
      .eq('code', code)
      .maybeSingle();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Code not found' });
    }

    if (data.status === 'USED') {
      return res.status(400).json({ error: 'Code already used' });
    }

    const now = new Date();
    const existingExpiresAt = data.expires_at ? new Date(data.expires_at) : null;

    // Return existing valid activation
    if (
      data.status === 'ACTIVATED' &&
      existingExpiresAt &&
      existingExpiresAt > now &&
      data.activation_token
    ) {
      return res.json({
        activationToken: data.activation_token,
        expiresAt: existingExpiresAt.toISOString(),
      });
    }

    // Create new activation
    const activationToken = crypto.randomUUID();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes

    const { data: updated, error: updateError } = await supabase
      .from('passcodes')
      .update({
        status: 'ACTIVATED',
        activation_token: activationToken,
        activated_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .eq('code', code)
      .select('activation_token,expires_at')
      .maybeSingle();

    if (updateError || !updated) {
      console.error('Update error:', updateError);
      return res.status(500).json({ error: 'Failed to activate code' });
    }

    return res.json({
      activationToken: updated.activation_token,
      expiresAt: updated.expires_at,
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
