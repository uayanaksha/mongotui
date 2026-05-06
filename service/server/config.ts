import * as fs from 'node:fs';
import * as path from 'node:path';
import type { MongoURIConfig } from '@/shared/types.js';

const CONFIG_FILE = path.join(process.cwd(), '.mongotui');

export function loadConfig(): MongoURIConfig | null {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('Failed to load config:', error);
  }
  return null;
}

export function saveConfig(config: MongoURIConfig): void {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save config:', error);
    throw new Error(`Failed to save MongoDB URI: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function validateMongoURI(uri: string): boolean {
  return uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://');
}
