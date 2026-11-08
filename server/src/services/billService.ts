import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { ParliamentBill } from '@app/shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory reaction counts keyed by bill Id

export function resolveTestInfoPath(): string {
  const candidates = [
    path.resolve(process.cwd(), 'testInfo.json'),
    path.resolve(process.cwd(), '../testInfo.json'),
    path.resolve(__dirname, '../../testInfo.json'),
    path.resolve(__dirname, '../../../testInfo.json'),
    '/home/gilbert/Documents/projects/hackathon/testInfo.json',
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error('testInfo.json could not be located in workspace paths.');
}

export function loadBills(): ParliamentBill[] {
  try {
    const filePath = resolveTestInfoPath();
    const rawContent = fs.readFileSync(filePath, 'utf-8');
    const rawBills = JSON.parse(rawContent) as ParliamentBill[];

    return rawBills;
  } catch (error) {
    console.error('Error reading testInfo.json:', error);
    return [];
  }
}
