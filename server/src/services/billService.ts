import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { ParliamentBill } from '@app/shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory reaction counts keyed by bill Id
export const reactionStore: Record<number, { support: number; oppose: number }> = {
  14310361: { support: 42, oppose: 11 },
  14297192: { support: 89, oppose: 14 },
  14268770: { support: 67, oppose: 23 },
  14209079: { support: 110, oppose: 35 },
  14279940: { support: 75, oppose: 82 },
  14252999: { support: 53, oppose: 4 },
};

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
    const rawBills = JSON.parse(rawContent) as Array<Omit<ParliamentBill, 'reactions'>>;

    return rawBills.map((bill) => {
      if (!reactionStore[bill.Id]) {
        reactionStore[bill.Id] = { support: 0, oppose: 0 };
      }
      return {
        ...bill,
        reactions: reactionStore[bill.Id],
      };
    });
  } catch (error) {
    console.error('Error reading testInfo.json:', error);
    return [];
  }
}
