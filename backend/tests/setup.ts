import path from 'node:path';
import dotenv from 'dotenv';

// Tests always run against the dedicated test database (see .env.test / TESTING.md).
dotenv.config({ path: path.resolve(__dirname, '../.env.test'), override: true });
