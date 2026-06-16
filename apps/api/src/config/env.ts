import dotenv from 'dotenv';
import { z } from 'zod';
dotenv.config();
const schema = z.object({ DATABASE_URL: z.string().default('postgres://winrepo:winrepo@localhost:5432/winrepo'), JWT_SECRET: z.string().default('dev-secret-change-me'), GITHUB_TOKEN: z.string().optional(), GITHUB_OWNER: z.string().optional(), GITHUB_REPO: z.string().optional(), GITHUB_PRIVATE: z.coerce.boolean().default(true), PORT: z.coerce.number().default(4000), API_BASE_URL: z.string().default('http://localhost:4000') });
export const env = schema.parse(process.env);
