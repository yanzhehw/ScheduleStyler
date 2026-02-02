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

/**
 * Wraps a Vercel handler with dynamic route params (e.g., [type]/[filename])
 * Maps Express req.params to Vercel req.query for compatibility
 */
export function adaptVercelHandlerWithParams(handler: { default: VercelHandler }): RequestHandler {
  return async (req: Request, res: Response) => {
    // Merge Express params into query to match Vercel's dynamic route behavior
    const vercelReq = req as unknown as VercelRequest;
    vercelReq.query = { ...req.params } as VercelRequest['query'];
    await handler.default(vercelReq, res as unknown as VercelResponse);
  };
}
