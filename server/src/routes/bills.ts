import { Router, Request, Response } from 'express';
import type { ParliamentBill, ApiResponse } from '@app/shared';
import { loadBills } from '../services/billService.js';

const router = Router();

// GET /api/bills - List and search bills
router.get('/', (req: Request, res: Response<ApiResponse<ParliamentBill[]>>) => {
  let bills = loadBills();
  const { search, chamber, documentType, status, isGovernment } = req.query;

  if (typeof search === 'string' && search.trim() !== '') {
    const query = search.toLowerCase().trim();
    bills = bills.filter(
      (b) =>
        b.NumberCode.toLowerCase().includes(query) ||
        (b.ShortTitle && b.ShortTitle.toLowerCase().includes(query)) ||
        (b.ShortTitleEn && b.ShortTitleEn.toLowerCase().includes(query)) ||
        (b.LongTitle && b.LongTitle.toLowerCase().includes(query)) ||
        (b.LongTitleEn && b.LongTitleEn.toLowerCase().includes(query)) ||
        (b.SponsorPersonName && b.SponsorPersonName.toLowerCase().includes(query)) ||
        (b.StatusNameEn && b.StatusNameEn.toLowerCase().includes(query))
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
    req: Request<{ id: string }, ApiResponse<ParliamentBill>>,
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
      });
      return;
    }

    res.json({
      success: true,
      data: bill,
    });
  }
);

export default router;
