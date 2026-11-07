import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  ParliamentBill,
  ApiResponse,
  HealthCheckResponse,
  User,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from '@app/shared';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory reaction counts keyed by bill Id
const reactionStore: Record<number, { support: number; oppose: number }> = {
  14310361: { support: 42, oppose: 11 },
  14297192: { support: 89, oppose: 14 },
  14268770: { support: 67, oppose: 23 },
  14209079: { support: 110, oppose: 35 },
  14279940: { support: 75, oppose: 82 },
  14252999: { support: 53, oppose: 4 },
};

function resolveTestInfoPath(): string {
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

function loadBills(): ParliamentBill[] {
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

// Health check endpoint
router.get('/health', (_req: Request, res: Response<HealthCheckResponse>) => {
  const bills = loadBills();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    billCount: bills.length,
  });
});

// List and search bills
const listBillsHandler = (req: Request, res: Response<ApiResponse<ParliamentBill[]>>) => {
  let bills = loadBills();
  const { search, chamber, documentType, status, isGovernment } = req.query;

  if (typeof search === 'string' && search.trim() !== '') {
    const q = search.toLowerCase().trim();
    bills = bills.filter(
      (b) =>
        b.NumberCode.toLowerCase().includes(q) ||
        (b.ShortTitle && b.ShortTitle.toLowerCase().includes(q)) ||
        (b.ShortTitleEn && b.ShortTitleEn.toLowerCase().includes(q)) ||
        (b.LongTitle && b.LongTitle.toLowerCase().includes(q)) ||
        (b.LongTitleEn && b.LongTitleEn.toLowerCase().includes(q)) ||
        (b.SponsorPersonName && b.SponsorPersonName.toLowerCase().includes(q)) ||
        (b.StatusNameEn && b.StatusNameEn.toLowerCase().includes(q))
    );
  }

  if (typeof chamber === 'string' && chamber.trim() !== '') {
    const ch = chamber.toLowerCase().trim();
    bills = bills.filter((b) => b.OriginatingChamberNameEn.toLowerCase() === ch);
  }

  if (typeof documentType === 'string' && documentType.trim() !== '') {
    const dt = documentType.toLowerCase().trim();
    bills = bills.filter((b) => b.BillDocumentTypeNameEn.toLowerCase().includes(dt));
  }

  if (typeof status === 'string' && status.trim() !== '') {
    const st = status.toLowerCase().trim();
    bills = bills.filter((b) => b.StatusNameEn.toLowerCase().includes(st));
  }

  if (typeof isGovernment === 'string') {
    const isGov = isGovernment === 'true';
    bills = bills.filter((b) => b.IsGovernmentBill === isGov);
  }

  res.json({
    success: true,
    total: bills.length,
    data: bills,
  });
};

router.get('/bills', listBillsHandler);
router.get('/laws', listBillsHandler);

// Get single bill by numeric Id or NumberCode (e.g., S-8, C-41, 14310361)
const getBillHandler = (req: Request, res: Response<ApiResponse<ParliamentBill | null>>) => {
  const { id } = req.params;
  const bills = loadBills();

  const found = bills.find(
    (b) => String(b.Id) === id || b.NumberCode.toLowerCase() === id.toLowerCase()
  );

  if (!found) {
    res.status(404).json({
      success: false,
      data: null,
      message: `Bill "${id}" not found`,
    });
    return;
  }

  res.json({
    success: true,
    data: found,
  });
};

router.get('/bills/:id', getBillHandler);
router.get('/laws/:id', getBillHandler);

// React to a bill (support or oppose)
const reactHandler = (
  req: Request<{ id: string }, ApiResponse<ParliamentBill>, { type: 'support' | 'oppose' }>,
  res: Response
) => {
  const { id } = req.params;
  const { type } = req.body;
  const bills = loadBills();

  const bill = bills.find(
    (b) => String(b.Id) === id || b.NumberCode.toLowerCase() === id.toLowerCase()
  );

  if (!bill) {
    res.status(404).json({
      success: false,
      data: null,
      message: `Bill "${id}" not found`,
    });
    return;
  }

  if (type !== 'support' && type !== 'oppose') {
    res.status(400).json({
      success: false,
      data: null,
      message: 'Invalid reaction type. Must be "support" or "oppose"',
    });
    return;
  }

  if (!reactionStore[bill.Id]) {
    reactionStore[bill.Id] = { support: 0, oppose: 0 };
  }

  reactionStore[bill.Id][type] += 1;
  bill.reactions = reactionStore[bill.Id];

  res.json({
    success: true,
    data: bill,
    message: `Reaction recorded for ${bill.NumberCode}`,
  });
};

router.post('/bills/:id/reactions', reactHandler);
router.post('/laws/:id/reactions', reactHandler);

// In-memory user store
interface StoredUser extends User {
  passwordHash: string;
}

const users: StoredUser[] = [
  {
    id: 'usr_1',
    name: 'Canadian Citizen',
    email: 'citizen@example.ca',
    passwordHash: 'password123',
    createdAt: new Date().toISOString(),
  },
];

// Helper to strip sensitive info
function toPublicUser(u: StoredUser): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    createdAt: u.createdAt,
  };
}

// User login endpoint
router.post(
  '/auth/login',
  (req: Request<Record<string, never>, ApiResponse<AuthResponse | null>, LoginRequest>, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        data: null,
        message: 'Email and password are required',
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = users.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!user || user.passwordHash !== password) {
      res.status(401).json({
        success: false,
        data: null,
        message: 'Invalid email or password',
      });
      return;
    }

    const publicUser = toPublicUser(user);
    res.json({
      success: true,
      data: {
        user: publicUser,
        token: `mock_jwt_token_${user.id}_${Date.now()}`,
      },
      message: 'Logged in successfully',
    });
  }
);

// User registration endpoint
router.post(
  '/auth/register',
  (req: Request<Record<string, never>, ApiResponse<AuthResponse | null>, RegisterRequest>, res: Response) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        data: null,
        message: 'Name, email, and password are required',
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      res.status(409).json({
        success: false,
        data: null,
        message: 'An account with this email address already exists',
      });
      return;
    }

    const newUser: StoredUser = {
      id: `usr_${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: password,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    const publicUser = toPublicUser(newUser);

    res.status(201).json({
      success: true,
      data: {
        user: publicUser,
        token: `mock_jwt_token_${newUser.id}_${Date.now()}`,
      },
      message: 'Account created successfully',
    });
  }
);

// Get current user endpoint
router.get('/auth/me', (req: Request, res: Response<ApiResponse<User | null>>) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      data: null,
      message: 'Not authenticated',
    });
    return;
  }

  const token = authHeader.replace('Bearer ', '').trim();
  // token format mock_jwt_token_{userId}_{timestamp}
  const match = token.match(/^mock_jwt_token_(usr_[^_]+)/);
  if (!match) {
    res.status(401).json({
      success: false,
      data: null,
      message: 'Invalid session token',
    });
    return;
  }

  const userId = match[1];
  const user = users.find((u) => u.id === userId);
  if (!user) {
    res.status(404).json({
      success: false,
      data: null,
      message: 'User session not found',
    });
    return;
  }

  res.json({
    success: true,
    data: toPublicUser(user),
  });
});

export default router;
