import { config } from "dotenv";
import { resolve } from "node:path";

/** Load `.env` then `.env.local` (Next.js-style; latter wins). */
config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local") });
