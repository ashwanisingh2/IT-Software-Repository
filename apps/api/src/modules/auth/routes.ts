import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../../db/pool.js';
import { env } from '../../config/env.js';
export const authRouter = Router();
authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const result = await query<{id:string;email:string;password_hash:string;role:'admin'|'engineer'|'viewer'}>('select * from users where email=$1', [email]);
  const user = result.rows[0];
  if (!user || !bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, env.JWT_SECRET, { expiresIn: '12h' });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});
