import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';

dotenv.config();

const execPromise = promisify(exec);

async function setup() {
  try {
    console.log('🔧 Running database migrations...');
    
    // Run migrations - Windows compatible
    const { stdout, stderr } = await execPromise('npx node-pg-migrate up', {
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL
      }
    });
    
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    
    console.log('✅ Database setup complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    // Don't exit - let the server start anyway
  }
}

setup();