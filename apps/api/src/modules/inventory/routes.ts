import { Router } from 'express';
import { query } from '../../db/pool.js';
export const inventoryRouter = Router();
inventoryRouter.post('/check-in', async (req, res) => {
  const { computerName, osVersion, installedSoftware = [], installedUpdates = [] } = req.body;
  const c = await query<{id:string}>(`insert into computers(computer_name,os_version,last_check_in) values($1,$2,now()) on conflict(computer_name) do update set os_version=excluded.os_version,last_check_in=now() returning id`, [computerName, osVersion]);
  for (const app of installedSoftware) await query('insert into computer_software(computer_id,name,version,vendor) values($1,$2,$3,$4) on conflict(computer_id,name) do update set version=excluded.version,vendor=excluded.vendor,detected_at=now()', [c.rows[0].id, app.name, app.version, app.vendor]);
  for (const kb of installedUpdates) await query('insert into computer_updates(computer_id,kb_id) values($1,$2) on conflict do nothing', [c.rows[0].id, kb]);
  res.json({ ok: true });
});
inventoryRouter.get('/', async (_req, res) => res.json((await query('select * from computers order by last_check_in desc')).rows));
inventoryRouter.get('/updates', async (_req, res) => {
  const rows = await query(`select c.computer_name, cs.name, cs.version installed_version, latest.version latest_version, (latest.version is distinct from cs.version) update_available
    from computer_software cs join computers c on c.id=cs.computer_id
    left join lateral (select s.name, v.version from software s join software_versions v on v.software_id=s.id where lower(s.name)=lower(cs.name) order by v.upload_date desc limit 1) latest on true`);
  res.json(rows.rows);
});
