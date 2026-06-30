import { query } from '../config/database';
import axios from 'axios';

export class AutomationService {
  async triggerEvent(eventName: string, endpointId: string, eventData: any = {}) {
    try {
      const rulesRes = await query(
        'SELECT * FROM automation_rules WHERE trigger_event = $1 AND is_active = true',
        [eventName]
      );
      
      for (const rule of rulesRes.rows) {
        await this.executeAction(rule.action_type, rule.action_payload, endpointId, eventData);
      }
    } catch (error) {
      console.error(`Automation error for event ${eventName}:`, error);
    }
  }

  private async executeAction(actionType: string, payload: any, endpointId: string, eventData: any) {
    if (actionType === 'send_email') {
      try {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
          port: parseInt(process.env.SMTP_PORT || '2525'),
          auth: {
            user: process.env.SMTP_USER || 'user',
            pass: process.env.SMTP_PASS || 'pass'
          }
        });
        
        await transporter.sendMail({
          from: '"WinRepo Alerts" <alerts@winrepo.local>',
          to: payload.to,
          subject: payload.subject,
          text: `Event Data: ${JSON.stringify(eventData, null, 2)}`
        });
        console.log(`[EMAIL ALERT] Sent to: ${payload.to}`);
      } catch (err) {
        console.error('Failed to send email:', err);
      }
      
      // Also log as an internal alert
      await query(
        'INSERT INTO alerts (endpoint_id, severity, title, message) VALUES ($1, $2, $3, $4)',
        [endpointId, 'warning', payload.subject, JSON.stringify(eventData)]
      );
    } 
    else if (actionType === 'webhook') {
      // 🟢 Webhook support (Slack/Teams)
      if (payload.url) {
        await axios.post(payload.url, { text: `WinRepo Alert: ${payload.message}`, data: eventData }).catch(e => console.error('Webhook failed'));
      }
    }
    else if (actionType === 'deploy_software') {
      if (payload.softwareId) {
        await query(
          'INSERT INTO patch_deployments (endpoint_id, software_id, status) VALUES ($1, $2, $3)',
          [endpointId, payload.softwareId, 'pending']
        );
      }
    }
  }

  // Called via cron job
  async checkAlertThresholds() {
    // Check for endpoints offline > 24 hrs
    const offlineRes = await query(`
      SELECT id FROM endpoints 
      WHERE last_checkin < NOW() - INTERVAL '24 hours' AND status = 'active'
    `);
    
    for (const ep of offlineRes.rows) {
      await this.triggerEvent('offline_24h', ep.id);
      await query("UPDATE endpoints SET status = 'offline' WHERE id = $1", [ep.id]);
    }
    
    // Check for disk space < 10%
    const diskRes = await query(`
      SELECT id, free_disk_bytes, total_disk_bytes 
      FROM endpoints 
      WHERE total_disk_bytes > 0 AND (free_disk_bytes::float / total_disk_bytes::float) < 0.1
    `);
    for (const ep of diskRes.rows) {
      await this.triggerEvent('low_disk', ep.id, { free: ep.free_disk_bytes, total: ep.total_disk_bytes });
    }
  }
}

export const automationService = new AutomationService();
