import { Router } from 'express';
import { query } from '../../db/pool.js';
export const dashboardRouter = Router();
dashboardRouter.get('/', async (_req, res) => {
  const [total, latest, downloads, cats, storage, updates] = await Promise.all([
    query('select count(*)::int total from software'),
    query('select s.name,v.version,v.upload_date from software_versions v join software s on s.id=v.software_id order by v.upload_date desc limit 8'),
    query('select s.name,v.version,v.download_count from software_versions v join software s on s.id=v.software_id order by v.download_count desc limit 8'),
    query('select category,count(*)::int count from software group by category order by category'),
    query('select coalesce(sum(file_size),0)::bigint bytes from software_versions'),
    query('select count(*) filter (where latest.version is distinct from cs.version)::int update_available, count(*)::int checked from computer_software cs left join lateral (select v.version from software s join software_versions v on v.software_id=s.id where lower(s.name)=lower(cs.name) order by v.upload_date desc limit 1) latest on true')
  ]);
  res.json({ totalSoftware: total.rows[0].total, latestUploads: latest.rows, mostDownloaded: downloads.rows, categories: cats.rows, storageUsageBytes: storage.rows[0].bytes, updateStatistics: updates.rows[0] });
});
