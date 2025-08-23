// backend/src/routes/github.ts
import { Router, Request, Response } from 'express';
import { GitHubService } from '../services/githubservice';

const router = Router();
const githubService = new GitHubService();

// GitHub webhook endpoint
router.post('/webhook', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Webhook received!');
    console.log('Headers:', req.headers);
    console.log('Event type:', req.headers['x-github-event']);
    const signature = req.headers['x-hub-signature-256'] as string;
    const event = req.headers['x-github-event'] as string;
    const payload = JSON.stringify(req.body);

    // Verify webhook signature
    if (!githubService.verifyWebhookSignature(payload, signature)) {
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    // Handle different GitHub events
    switch (event) {
      case 'push':
        await githubService.handlePushEvent(req.body);
        break;
      case 'pull_request':
        await githubService.handlePullRequestEvent(req.body);
        break;
      default:
        console.log(`Unhandled GitHub event: ${event}`);
    }

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('GitHub webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;