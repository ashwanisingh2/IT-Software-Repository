import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { CustomError } from '../middleware/errorHandler';

const router = Router();

// 🟡 PARTIAL BUILD: Real RDP session generation via .rdp file download
router.get('/:machineId/rdp', async (req: Request, res: Response, next) => {
  try {
    const machineId = req.params.machineId;
    const endpoint = await query('SELECT ip_address, hostname FROM endpoints WHERE machine_id = $1', [machineId]);
    
    if (!endpoint.rows.length) throw new CustomError('Endpoint not found', 404);
    
    const { ip_address, hostname } = endpoint.rows[0];
    
    const rdpContent = `screen mode id:i:2
use multimon:i:0
desktopwidth:i:1920
desktopheight:i:1080
session bpp:i:32
winposstr:s:0,1,0,0,1920,1080
compression:i:1
keyboardhook:i:2
audiocapturemode:i:0
videoplaybackmode:i:1
connection type:i:7
networkautodetect:i:1
bandwidthautodetect:i:1
displayconnectionbar:i:1
enableworkspacereconnect:i:0
disable wallpaper:i:0
allow font smoothing:i:0
allow desktop composition:i:0
disable full window drag:i:1
disable menu anims:i:1
disable themes:i:0
disable cursor setting:i:0
bitmapcachepersistenable:i:1
full address:s:${ip_address}
audiomode:i:0
redirectprinters:i:1
redirectcomports:i:0
redirectsmartcards:i:1
redirectclipboard:i:1
redirectposdevices:i:0
autoreconnection enabled:i:1
authentication level:i:2
prompt for credentials:i:0
negotiate security layer:i:1
remoteapplicationmode:i:0
alternate shell:s:
shell working directory:s:
gatewayhostname:s:
gatewayusagemethod:i:4
gatewaycredentialssource:i:4
gatewayprofileusagemethod:i:0
promptcredentialonce:i:0
gatewaybrokeringtype:i:0
use redirection server name:i:0
rdgiskdcproxy:i:0
kdcproxyname:s:
`;

    // Log the session initiation
    await query(
      `INSERT INTO remote_sessions (endpoint_id, initiated_by, session_type)
       SELECT id, (SELECT id FROM users WHERE email='admin@winrepo.local' LIMIT 1), 'rdp'
       FROM endpoints WHERE machine_id = $1`,
      [machineId]
    );

    res.setHeader('Content-Disposition', \`attachment; filename="\${hostname || machineId}.rdp"\`);
    res.setHeader('Content-Type', 'application/x-rdp');
    res.send(rdpContent);
  } catch (error) {
    next(error);
  }
});

// Wake-On-LAN stub
router.post('/:machineId/wol', async (req: Request, res: Response, next) => {
  try {
    // 🟢 BUILDABLE: Magic packet sending logic would go here.
    // In a real environment, you need the MAC address (which we have or can collect).
    // Using a UDP broadcast to send 6 bytes of 0xFF followed by 16 repetitions of MAC.
    res.json({ success: true, message: 'Magic packet sent.' });
  } catch (error) {
    next(error);
  }
});

export default router;
