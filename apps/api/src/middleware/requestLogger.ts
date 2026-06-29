import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';
import { morganStream } from '../config/logger';

declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

export const requestLogger = [
  (req: Request, res: Response, next: NextFunction) => {
    req.id = uuidv4();
    res.setHeader('X-Request-ID', req.id);
    next();
  },
  morgan((tokens, req: any, res) => {
    return JSON.stringify({
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: tokens.status(req, res),
      content_length: tokens.res(req, res, 'content-length'),
      response_time: tokens['response-time'](req, res),
      request_id: req.id,
      user_agent: tokens['user-agent'](req, res),
      ip: tokens['remote-addr'](req, res)
    });
  }, { stream: morganStream })
];
