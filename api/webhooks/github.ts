import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
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

function verifySignature(payload: string, signature: string | undefined): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!secret || !signature) {
    console.warn('[webhooks/github] Missing secret or signature');
    return false;
  }

  const expected = `sha256=${crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')}`;

  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const signature = req.headers['x-hub-signature-256'] as string | undefined;
  const event = req.headers['x-github-event'] as string;
  const payload = JSON.stringify(req.body);

  // Verify signature
  if (!verifySignature(payload, signature)) {
    console.warn('[webhooks/github] Invalid signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  console.log(`[webhooks/github] Received event: ${event}`);

  // Always respond quickly
  res.json({ received: true });

  // Handle star events in background
  if (event === 'star') {
    const action = req.body.action as 'created' | 'deleted';

    try {
      const supabase = getSupabase();

      if (action === 'created') {
        const { error } = await supabase.rpc('increment_counter', { counter_id: 'stars' });
        if (error) {
          console.error('[webhooks/github] Failed to increment stars:', error.message);
        } else {
          console.log('[webhooks/github] Star added');
        }
      } else if (action === 'deleted') {
        const { error } = await supabase.rpc('decrement_counter', { counter_id: 'stars' });
        if (error) {
          console.error('[webhooks/github] Failed to decrement stars:', error.message);
        } else {
          console.log('[webhooks/github] Star removed');
        }
      }
    } catch (err) {
      console.error('[webhooks/github] Unexpected error:', err);
    }
  }
}
