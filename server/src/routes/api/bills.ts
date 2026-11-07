import { Router, Request, Response } from 'express';
import type { ParliamentBill, ApiResponse } from '@app/shared';
import { loadBills, reactionStore } from '../../services/billService.js';

const router = Router();

// GET /api/bills - List and search bills
router.get('/', (req: Request, res: Response<ApiResponse<ParliamentBill[]>>) => {
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
});

// GET /api/bills/:id - Get single bill by numeric Id or NumberCode
router.get('/:id', (req: Request, res: Response<ApiResponse<ParliamentBill | null>>) => {
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
});

// POST /api/bills/:id/reactions - React to a bill (support or oppose)
router.post(
  '/:id/reactions',
  (
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
  }
);

export default router;
