// pages/api/scrape-apollo.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { apollo_url, batch_limit, apify_key } = req.body;

  try {
    const apifyRes = await fetch(
      'https://api.apify.com/v2/acts/code_crafter~apollo-io-scraper/run-sync-get-dataset-items?format=json&clean=true',
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${apify_key}`,
        },
        body: JSON.stringify({
          getPersonalEmails: true,
          fileName: 'Apollo Prospects',
          getWorkEmails: true,
          totalRecords: batch_limit,
          url: apollo_url,
        }),
      }
    );

    if (!apifyRes.ok) {
      const error = await apifyRes.text();
      return res.status(500).json({ error });
    }

    const data = await apifyRes.json();
    // Optionally: Save to Supabase here

    res.status(200).json({ status: 'success', data });
  } catch (err: unknown) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred.' });
    }
  }
}