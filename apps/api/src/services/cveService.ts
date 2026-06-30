import axios from 'axios';
import { query } from '../config/database';

export class CveService {
  private nvdBaseUrl = 'https://services.nvd.nist.gov/rest/json/cves/2.0';

  /**
   * 🟡 PARTIAL BUILD: This integrates with the real NIST NVD API.
   * To use this in production, you need an API key from NVD to avoid strict rate limits.
   * This function should ideally be run as a cron job to sync the latest vulnerabilities.
   */
  async syncRecentCVEs(days: number = 7) {
    try {
      const pubStartDate = new Date();
      pubStartDate.setDate(pubStartDate.getDate() - days);
      const pubEndDate = new Date();

      const url = `${this.nvdBaseUrl}?pubStartDate=${pubStartDate.toISOString()}&pubEndDate=${pubEndDate.toISOString()}`;
      
      const response = await axios.get(url, {
        headers: {
          // 'apiKey': process.env.NVD_API_KEY // Recommended for production
        }
      });

      const vulnerabilities = response.data.vulnerabilities || [];
      let added = 0;

      for (const item of vulnerabilities) {
        const cve = item.cve;
        const cveId = cve.id;
        const description = cve.descriptions?.find((d: any) => d.lang === 'en')?.value || '';
        const metrics = cve.metrics?.cvssMetricV31?.[0]?.cvssData || cve.metrics?.cvssMetricV30?.[0]?.cvssData;
        const baseScore = metrics?.baseScore || 0;
        const severity = metrics?.baseSeverity || 'UNKNOWN';
        const publishedDate = cve.published;
        const lastModifiedDate = cve.lastModified;

        const affectedSoftware = cve.configurations?.flatMap((config: any) => 
          config.nodes?.flatMap((node: any) => 
            node.cpeMatch?.map((cpe: any) => cpe.criteria)
          )
        ) || [];

        await query(
          `INSERT INTO cve_vulnerabilities (cve_id, description, base_score, severity, published_date, last_modified_date, affected_software)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (cve_id) DO UPDATE SET 
             base_score = EXCLUDED.base_score,
             severity = EXCLUDED.severity,
             last_modified_date = EXCLUDED.last_modified_date,
             affected_software = EXCLUDED.affected_software`,
          [cveId, description, baseScore, severity, publishedDate, lastModifiedDate, JSON.stringify(affectedSoftware)]
        );
        added++;
      }

      return { success: true, count: added };
    } catch (error) {
      console.error('NVD CVE Sync Error:', error);
      throw error;
    }
  }

  async analyzeSoftware(softwareId: string, softwareName: string, vendor: string) {
    // 🔴 ARCHITECTURE STUB:
    // This would fuzzy-match softwareName and vendor against the affected_software JSONB array (CPE strings)
    // in the cve_vulnerabilities table, and insert matches into software_cves.
    // Example: cpe:2.3:a:google:chrome:114.0.5735.90:*:*:*:*:*:*:*
    
    // Stub query to just link critical vulns for demo purposes
    await query(
      `INSERT INTO software_cves (software_id, cve_id)
       SELECT $1, cve_id FROM cve_vulnerabilities WHERE description ILIKE $2 LIMIT 5
       ON CONFLICT DO NOTHING`,
      [softwareId, `%${softwareName}%`]
    );
  }
}

export const cveService = new CveService();
