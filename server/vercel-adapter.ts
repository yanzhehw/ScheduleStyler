/**
 * Adapts Vercel serverless functions to work with Express for local development.
 * This allows using `npm run dev` while keeping API logic centralized in /api/
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Request, Response, RequestHandler } from 'express';

type VercelHandler = (req: VercelRequest, res: VercelResponse) => unknown;

/**
 * Wraps a Vercel serverless handler to work as Express middleware
 */
export function adaptVercelHandler(handler: { default: VercelHandler }): RequestHandler {
  return async (req: Request, res: Response) => {
    // Vercel's req/res are compatible enough with Express for our use case
    await handler.default(req as unknown as VercelRequest, res as unknown as VercelResponse);
  };
}
