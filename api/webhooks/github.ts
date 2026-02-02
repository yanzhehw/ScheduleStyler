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

  const senderLogin = req.body.sender?.login as string | undefined;
  console.log(`[webhooks/github] Received event: ${event}, action: ${req.body.action}, sender: ${senderLogin}`);
  console.log('[webhooks/github] Full sender object:', JSON.stringify(req.body.sender, null, 2));

  // Handle star events - must complete BEFORE responding (Vercel terminates after response)
  if (event === 'star') {
    const action = req.body.action as 'created' | 'deleted';

    try {
      const supabase = getSupabase();

      if (action === 'created') {
        // Increment star counter
        console.log('[webhooks/github] Processing star created event...');
        const { error: counterError } = await supabase.rpc('increment_counter', { counter_id: 'stars' });
        if (counterError) {
          console.error('[webhooks/github] Failed to increment stars:', counterError.message, counterError);
        } else {
          console.log('[webhooks/github] ⭐ Star counter incremented');
        }

        // Add GitHub username as invitation code
        console.log(`[webhooks/github] senderLogin value: "${senderLogin}", type: ${typeof senderLogin}`);
        if (senderLogin) {
          console.log(`[webhooks/github] Attempting to upsert passcode for: ${senderLogin}`);
          const { data: passcodeData, error: passcodeError } = await supabase
            .from('passcodes')
            .upsert(
              { code: senderLogin, status: 'READY' },
              { onConflict: 'code', ignoreDuplicates: true }
            )
            .select();

          console.log('[webhooks/github] Upsert result:', { data: passcodeData, error: passcodeError });

          if (passcodeError) {
            console.error('[webhooks/github] Failed to create passcode:', passcodeError.message, passcodeError);
          } else {
            console.log(`[webhooks/github] ✅ Passcode upsert completed for ${senderLogin}, data:`, passcodeData);
          }
        } else {
          console.warn('[webhooks/github] senderLogin is empty/undefined, skipping passcode creation');
        }
      } else if (action === 'deleted') {
        // Decrement star counter
        const { error: counterError } = await supabase.rpc('decrement_counter', { counter_id: 'stars' });
        if (counterError) {
          console.error('[webhooks/github] Failed to decrement stars:', counterError.message);
        } else {
          console.log('[webhooks/github] Star counter decremented');
        }

        // Mark passcode as USED (don't delete)
        if (senderLogin) {
          const { error: passcodeError } = await supabase
            .from('passcodes')
            .update({ status: 'USED' })
            .eq('code', senderLogin);

          if (passcodeError) {
            console.error('[webhooks/github] Failed to mark passcode as used:', passcodeError.message);
          } else {
            console.log(`[webhooks/github] Passcode marked as USED for ${senderLogin}`);
          }
        }
      }
    } catch (err) {
      console.error('[webhooks/github] Unexpected error:', err);
    }
  }

  // Respond after DB operation completes
  return res.json({ received: true });
}
