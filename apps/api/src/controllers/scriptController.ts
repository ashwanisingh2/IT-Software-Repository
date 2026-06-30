import { Request, Response, NextFunction } from 'express';
import { scriptService } from '../services/scriptService';

export const listScripts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scripts = await scriptService.listScripts();
    res.json({ success: true, data: scripts });
  } catch (e) {
    next(e);
  }
};

export const createScript = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, scriptType, content } = req.body;
    const user = (req as any).user;
    const script = await scriptService.createScript({
      name,
      description,
      scriptType,
      content,
      createdBy: user?.id || '00000000-0000-0000-0000-000000000000'
    });
    res.json({ success: true, data: script });
  } catch (e) {
    next(e);
  }
};

export const executeScript = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { scriptId, endpointId } = req.body;
    const user = (req as any).user;
    const execution = await scriptService.executeScript(scriptId, endpointId, user?.id || '00000000-0000-0000-0000-000000000000');
    res.json({ success: true, data: execution });
  } catch (e) {
    next(e);
  }
};
