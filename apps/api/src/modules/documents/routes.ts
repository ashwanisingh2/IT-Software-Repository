import { Router } from 'express';
import { query } from '../../db/pool.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
export const documentsRouter = Router();
documentsRouter.get('/', async (_req, res) => res.json((await query('select * from documents order by updated_at desc')).rows));
documentsRouter.post('/', requireAuth, requireRole('admin','engineer'), async (req, res) => {
  const { title, type, category, bodyMd, fileUrl } = req.body;
  const row = await query('insert into documents(title,type,category,body_md,file_url,created_by) values($1,$2,$3,$4,$5,$6) returning *', [title, type, category, bodyMd, fileUrl, req.user!.id]);
  res.status(201).json(row.rows[0]);
});
