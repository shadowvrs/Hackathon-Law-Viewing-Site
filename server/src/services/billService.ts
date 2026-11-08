import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { ParliamentBill } from '@app/shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function loadBills(): ParliamentBill[] {
  try {
    const filePath = resolveJsonPath();
    const rawContent = fs.readFileSync(filePath, 'utf-8');
    const rawBills = JSON.parse(rawContent) as ParliamentBill[];

    return rawBills;
  } catch (error) {
    console.error('Error reading json file:', error);
    return [];
  }
}

function resolveJsonPath(): string {
  const serverDataPath = path.resolve(__dirname, '../../../client/data/testInfo.json');

  if (fs.existsSync(serverDataPath)) {
    return serverDataPath;
  } else {
    throw new Error('Json file could not be located in workspace paths.');
  }
}

