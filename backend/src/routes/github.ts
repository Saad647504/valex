// backend/src/routes/github.ts
import { Router, Request, Response } from 'express';
import { GitHubService } from '../services/githubservice';

const router = Router();
const githubService = new GitHubService();

// Simple in-memory de-duplication of recent deliveries
const recentDeliveries = new Map<string, number>();
const DELIVERY_TTL_MS = 10 * 60 * 1000; // 10 minutes
function isDuplicateDelivery(id?: string | string[]) {
  if (!id) return false;
  const key = Array.isArray(id) ? id[0] : id;
  const now = Date.now();
  // purge
  for (const [k, t] of recentDeliveries.entries()) {
    if (now - t > DELIVERY_TTL_MS) recentDeliveries.delete(k);
  }
  if (recentDeliveries.has(key)) return true;
  recentDeliveries.set(key, now);
  return false;
}

// GitHub webhook endpoint
router.post('/webhook', async (req: Request, res: Response): Promise<void> => {
  try {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Webhook received!');
    console.log('Headers:', req.headers);
    console.log('Event type:', req.headers['x-github-event']);
  }
    const deliveryId = req.headers['x-github-delivery'];
    if (isDuplicateDelivery(deliveryId)) {
      if (process.env.NODE_ENV !== 'production') console.log('Duplicate delivery ignored:', deliveryId);
      res.status(200).json({ success: true, duplicate: true });
      return;
    }

    // Prefer sha256 header, fall back to legacy sha1
    const sigHeader = (req.headers['x-hub-signature-256'] || req.headers['x-hub-signature']) as string | string[] | undefined;
    const signature = Array.isArray(sigHeader) ? sigHeader[0] : sigHeader || '';
    const event = (Array.isArray(req.headers['x-github-event']) ? req.headers['x-github-event'][0] : req.headers['x-github-event']) as string;
    // Use the exact raw request body for signature verification
    const payload = (req as any).rawBody ? (req as any).rawBody.toString('utf8') : '';

    // Verify webhook signature
    if (!githubService.verifyWebhookSignature(payload, signature)) {
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    if (!event) {
      res.status(400).json({ error: 'Missing X-GitHub-Event header' });
      return;
    }

    // Handle different GitHub events
    switch (event) {
      case 'ping':
        res.status(200).json({ success: true, pong: true });
        return;
      case 'push':
        {
          // GitHub can send application/x-www-form-urlencoded if selected; support it
          let body: any = req.body;
          if (body && typeof body === 'object' && 'payload' in body && typeof (body as any).payload === 'string') {
            try { body = JSON.parse((body as any).payload); } catch { /* ignore */ }
          }
          await githubService.handlePushEvent(body);
        }
        break;
      case 'pull_request':
        {
          let body: any = req.body;
          if (body && typeof body === 'object' && 'payload' in body && typeof (body as any).payload === 'string') {
            try { body = JSON.parse((body as any).payload); } catch { /* ignore */ }
          }
          await githubService.handlePullRequestEvent(body);
        }
        break;
      default:
      if (process.env.NODE_ENV !== 'production') console.log(`Unhandled GitHub event: ${event}`);
    }

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('GitHub webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Simple status endpoint to indicate whether GitHub webhook is configured
router.get('/status', (req: Request, res: Response): void => {
  try {
    const connected = !!process.env.GITHUB_WEBHOOK_SECRET;
    res.json({ connected, webhookPath: '/api/github/webhook' });
  } catch (e) {
    res.json({ connected: false, webhookPath: '/api/github/webhook' });
  }
});

export default router;
