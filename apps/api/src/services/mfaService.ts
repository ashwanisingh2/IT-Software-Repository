import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { query } from '../config/database';

export class MfaService {
  async generateMfaSecret(userId: string, email: string) {
    const secret = speakeasy.generateSecret({
      name: `WinRepo (${email})`
    });

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    // Save secret to database
    await query(
      'UPDATE users SET mfa_secret = $1 WHERE id = $2',
      [secret.base32, userId]
    );

    return {
      secret: secret.base32,
      qrCodeUrl
    };
  }

  async verifyMfaToken(userId: string, token: string) {
    const res = await query('SELECT mfa_secret FROM users WHERE id = $1', [userId]);
    const secret = res.rows[0]?.mfa_secret;

    if (!secret) return false;

    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 1 // Allow 30 seconds of drift
    });

    if (verified) {
      await query('UPDATE users SET mfa_enabled = true WHERE id = $1', [userId]);
    }

    return verified;
  }
}

export const mfaService = new MfaService();
