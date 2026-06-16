import bcrypt from 'bcryptjs';
import { query, pool } from '../db/pool.js';

const [email, password, displayName = 'WinRepo Admin'] = process.argv.slice(2);
if (!email || !password) {
  console.error('Usage: npm run seed:admin --workspace apps/api -- admin@example.com StrongPassword123! "Admin Name"');
  process.exit(1);
}

const passwordHash = bcrypt.hashSync(password, 12);
await query(
  `insert into users(email,password_hash,display_name,role)
   values($1,$2,$3,'admin')
   on conflict(email) do update set password_hash=excluded.password_hash, display_name=excluded.display_name, role='admin'`,
  [email, passwordHash, displayName]
);
await pool.end();
console.log(`Admin user ready: ${email}`);
