import { Router } from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import multer from 'multer';
import { query } from '../../db/pool.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { uploadReleaseAsset, listReleaseAssets } from '../../github/releases.js';
import { audit } from '../audit/audit.js';
import { inferSilentInstall, installCommand, updateCommand, deploymentScript } from '../powershell/generator.js';
const upload = multer({ dest: path.join(os.tmpdir(), 'winrepo') });
export const softwareRouter = Router();
softwareRouter.get('/', async (req, res) => {
  const { search='', category='', vendor='', version='' } = req.query;
  const result = await query(`select s.*, coalesce(json_agg(v.* order by v.upload_date desc) filter (where v.id is not null),'[]') versions
    from software s left join software_versions v on v.software_id=s.id
    where ($1='' or s.name ilike '%'||$1||'%' or s.vendor ilike '%'||$1||'%') and ($2='' or s.category=$2) and ($3='' or s.vendor ilike '%'||$3||'%') and ($4='' or v.version=$4)
    group by s.id order by s.name`, [search, category, vendor, version]);
  res.json(result.rows.map((r:any) => ({ ...r, latestVersion: r.versions[0] ?? null, powershell: { install: installCommand(r.name), update: updateCommand(r.name) } })));
});
softwareRouter.post('/upload', requireAuth, requireRole('admin','engineer'), upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file is required' });
  const { name, version, category, vendor, description } = req.body;
  const ext = path.extname(req.file.originalname).slice(1).toLowerCase();
  if (!['exe','msi','zip','bat','ps1'].includes(ext)) return res.status(400).json({ error: 'Unsupported file type' });
  const sha256 = crypto.createHash('sha256').update(fs.readFileSync(req.file.path)).digest('hex');
  const sw = await query<{id:string}>(`insert into software(name,vendor,category,description) values($1,$2,$3,$4)
    on conflict(name,vendor) do update set category=excluded.category, description=coalesce(excluded.description, software.description) returning id`, [name, vendor, category, description]);
  const github = await uploadReleaseAsset(`${name}-v${version}`, req.file.originalname, req.file.path);
  const row = await query(`insert into software_versions(software_id,version,file_name,file_type,file_size,sha256,github_release_id,github_asset_id,download_url,silent_install_command,uploaded_by)
    values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning *`, [sw.rows[0].id, version, req.file.originalname, ext, req.file.size, sha256, github.releaseId, github.assetId, github.downloadUrl, inferSilentInstall(req.file.originalname), req.user!.id]);
  await audit(req.user!.id, 'software.upload', 'software_version', (row.rows[0] as any).id, { name, version, sha256 });
  res.status(201).json(row.rows[0]);
});
softwareRouter.get('/:id/download', async (req, res) => {
  const row = await query<{download_url:string}>('select download_url from software_versions where id=$1', [req.params.id]);
  if (!row.rows[0]) return res.status(404).json({ error: 'Not found' });
  await query('update software_versions set download_count=download_count+1 where id=$1', [req.params.id]);
  res.json({ downloadUrl: row.rows[0].download_url });
});
softwareRouter.get('/sync/github', requireAuth, requireRole('admin'), async (_req, res) => res.json({ assets: await listReleaseAssets() }));
softwareRouter.get('/powershell/package', (req, res) => res.type('text/plain').send(deploymentScript(String(req.query.apps ?? '').split(',').filter(Boolean))));
