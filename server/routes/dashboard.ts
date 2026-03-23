import { Router, Request, Response } from 'express';
import { getRequests, getRequestById, saveSetting, getSetting } from '../services/storage.js';

const router: Router = Router();

// GET /api/requests
router.get('/requests', (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const requests = getRequests(limit, offset);
    res.json(requests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// GET /api/requests/:id
router.get('/requests/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid request ID' });
      return;
    }
    const request = getRequestById(id);
    if (!request) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }
    res.json(request);
  } catch (error) {
    console.error('Error fetching request:', error);
    res.status(500).json({ error: 'Failed to fetch request' });
  }
});

// PUT /api/settings
router.put('/settings', (req: Request, res: Response) => {
  try {
    const { targetUrl, targetApiKey } = req.body;

    if (targetUrl !== undefined) {
      saveSetting('TARGET_URL', targetUrl);
    }
    if (targetApiKey !== undefined) {
      saveSetting('TARGET_API_KEY', targetApiKey);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// GET /api/settings
router.get('/settings', (_: Request, res: Response) => {
  try {
    const targetUrl = getSetting('TARGET_URL') || process.env.TARGET_URL || '';
    const targetApiKey = getSetting('TARGET_API_KEY') || process.env.TARGET_API_KEY || '';

    res.json({
      targetUrl,
      targetApiKey: targetApiKey ? '***' : '' // Don't send actual key back to client
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

export default router;
