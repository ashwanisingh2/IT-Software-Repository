import { getCache, setCache } from '../config/redis';
import { query } from '../config/database';
import { softwareRepository } from '../repositories/softwareRepository';

export class DashboardService {
  async getStats() {
    const cacheKey = 'dashboard:stats';
    const cached = await getCache<any>(cacheKey);
    if (cached) return cached;

    const res = await query('SELECT * FROM get_dashboard_stats()');
    const basicStats = res.rows[0].get_dashboard_stats;

    const topDownloaded = await softwareRepository.getMostDownloaded(5);
    const recentUploads = await softwareRepository.getRecentUploads(5);

    const fullStats = {
      ...basicStats,
      topDownloaded,
      recentUploads
    };

    await setCache(cacheKey, fullStats, 60); // 1 minute cache
    return fullStats;
  }
}

export const dashboardService = new DashboardService();
