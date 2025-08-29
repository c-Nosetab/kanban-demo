import { Request, Response } from 'express';
import cronService from '../services/cronService';
import { SecurityStatus } from '../types';

class SystemController {
  // GET /api/cron/status - Get cron job status
  public getCronStatus(_req: Request, res: Response): void {
    res.json(cronService.getStatus());
  }

  // GET /api/security/status - Get security configuration status
  public getSecurityStatus(_req: Request, res: Response): void {
    const securityStatus: SecurityStatus = {
      cors: {
        enabled: true,
        allowedOrigin: process.env['FRONTEND_ORIGIN'] || 'http://localhost:4200',
        credentials: true
      },
      rateLimit: {
        enabled: true,
        windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'),
        maxRequests: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'),
        windowMinutes: Math.ceil((parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000') / 1000 / 60))
      },
      environment: process.env['NODE_ENV'] || 'development'
    };

    res.json(securityStatus);
  }
}

export default new SystemController();
