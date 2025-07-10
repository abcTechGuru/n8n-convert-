import type { NextApiRequest, NextApiResponse } from 'next';

const progressStore: Record<string, number> = {};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { scrapeId } = req.query;
  if (!scrapeId) return res.status(400).json({ error: "Missing scrapeId" });
  res.json({ scrapedCount: progressStore[scrapeId as string] || 0 });
}

export function updateScrapeProgress(scrapeId: string, count: number) {
  progressStore[scrapeId] = count;
} 