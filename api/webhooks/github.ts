import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { getSupabase } from '../lib/supabase.js';

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

  const senderLogin = req.body.sender?.login as string | undefined;

  // Handle star events - must complete BEFORE responding (Vercel terminates after response)
  if (event === 'star') {
    const action = req.body.action as 'created' | 'deleted';

    try {
      const supabase = getSupabase();

      if (action === 'created') {
        // Increment star counter
        await supabase.rpc('increment_counter', { counter_id: 'stars' });

        // Add GitHub username as invitation code
        if (senderLogin) {
          await supabase
            .from('passcodes')
            .upsert(
              { code: senderLogin, status: 'READY' },
              { onConflict: 'code', ignoreDuplicates: true }
            );
        }
      } else if (action === 'deleted') {
        // Decrement star counter
        await supabase.rpc('decrement_counter', { counter_id: 'stars' });

        // Mark passcode as USED (don't delete)
        if (senderLogin) {
          await supabase
            .from('passcodes')
            .update({ status: 'USED' })
            .eq('code', senderLogin);
        }
      }
    } catch (err) {
      console.error('[webhooks/github] Error:', err);
    }
  }

  // Respond after DB operation completes
  return res.json({ received: true });
}
