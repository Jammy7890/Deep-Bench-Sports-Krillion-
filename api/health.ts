export default function handler(_req: { method?: string }, res: {
  status: (code: number) => { json: (body: unknown) => void };
  setHeader?: (name: string, value: string) => void;
}) {
  if ((_req.method ?? 'GET').toUpperCase() !== 'GET') {
    res.setHeader?.('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed. Use GET.' });
  }

  const configured = Boolean(
    process.env.CLOUDFLARE_ACCOUNT_ID &&
    process.env.CLOUDFLARE_API_TOKEN &&
    process.env.CLOUDFLARE_ACCOUNT_ID !== 'YOUR_CLOUDFLARE_ACCOUNT_ID' &&
    process.env.CLOUDFLARE_API_TOKEN !== 'YOUR_CLOUDFLARE_API_TOKEN'
  );

  return res.status(configured ? 200 : 503).json({
    status: configured ? 'configured' : 'needs_setup',
    provider: 'Cloudflare Workers AI',
    model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
    credentialsPresent: configured,
    note: configured
      ? 'Cloudflare credentials are present. This check does not make a billable AI request.'
      : 'Add CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in Vercel environment variables.',
  });
}
