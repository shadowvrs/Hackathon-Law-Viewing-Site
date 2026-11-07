<script lang="ts">
  import type { ParliamentBill } from '@app/shared';

  interface Props {
    bill: ParliamentBill;
    reacting: boolean;
    onReact: (id: string, type: 'support' | 'oppose') => void;
  }

  let { bill, reacting, onReact }: Props = $props();

  let expanded = $state(false);

  const displayTitle = $derived(
    bill.ShortTitleEn || bill.ShortTitle || bill.LongTitleEn || bill.LongTitle
  );

  const isHouse = $derived(
    bill.OriginatingChamberNameEn.toLowerCase().includes('house') || bill.IsHouseBill
  );

  const formattedDate = $derived(
    bill.LatestCompletedBillStageDateTime
      ? new Date(bill.LatestCompletedBillStageDateTime).toLocaleDateString('en-CA', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : null
  );

  const sponsorDetails = $derived(() => {
    const parts: string[] = [];
    if (bill.SponsorPersonName && bill.SponsorPersonName.trim()) {
      parts.push(bill.SponsorPersonName.trim());
    }
    if (bill.SponsorAffiliationTitleEn) {
      parts.push(bill.SponsorAffiliationTitleEn);
    }
    if (bill.SponsorConstituencyName) {
      parts.push(`(${bill.SponsorConstituencyName})`);
    }
    return parts.join(' • ');
  });
</script>

<article class="bill-card">
  <div class="card-top">
    <div class="badges-row">
      <span class="code-badge {isHouse ? 'house-code' : 'senate-code'}">
        {bill.NumberCode}
      </span>
      <span class="chamber-pill {isHouse ? 'house-pill' : 'senate-pill'}">
        {isHouse ? '🏛 House of Commons' : '🏛 Senate'}
      </span>
      {#if bill.IsGovernmentBill}
        <span class="type-pill gov-pill">Government Bill</span>
      {:else}
        <span class="type-pill pub-pill">{bill.BillDocumentTypeNameEn}</span>
      {/if}
    </div>
    <span class="status-pill">{bill.StatusNameEn || bill.StatusName}</span>
  </div>

  <h2 class="bill-title">{displayTitle}</h2>

  {#if bill.ShortTitle && bill.LongTitle && bill.ShortTitle !== bill.LongTitle}
    <p class="bill-long-title {expanded ? 'expanded' : 'clamped'}">
      {bill.LongTitle}
    </p>
    <button class="btn-toggle" onclick={() => (expanded = !expanded)}>
      {expanded ? '▲ Show less' : '▼ View full legislative description'}
    </button>
  {/if}

  <div class="meta-section">
    {#if sponsorDetails()}
      <div class="meta-row">
        <span class="meta-label">Sponsor:</span>
        <span class="meta-value">{sponsorDetails()}</span>
      </div>
    {/if}

    <div class="meta-row">
      <span class="meta-label">Latest Activity:</span>
      <span class="meta-value">
        {bill.LatestBillEventTypeName || bill.LatestCompletedMajorStageNameEn}
        {#if formattedDate}
          <span class="meta-date">({formattedDate})</span>
        {/if}
      </span>
    </div>

    {#if bill.ParliamentNumber && bill.SessionNumber}
      <div class="meta-row meta-sub">
        <span>45th Parliament, 1st Session</span>
        <span>Stage: {bill.OngoingStageNameEn || bill.OngoingStageName}</span>
      </div>
    {/if}
  </div>

  <div class="card-footer">
    <span class="reactions-title">What do you think of this legislation?</span>
    <div class="reactions-buttons">
      <button
        class="btn-react btn-support"
        onclick={() => onReact(String(bill.Id), 'support')}
        disabled={reacting}
        title="Support this legislation"
      >
        <span class="icon">👍</span>
        <span class="count">{bill.reactions?.support ?? 0}</span>
        <span class="text">Support</span>
      </button>

      <button
        class="btn-react btn-oppose"
        onclick={() => onReact(String(bill.Id), 'oppose')}
        disabled={reacting}
        title="Oppose this legislation"
      >
        <span class="icon">👎</span>
        <span class="count">{bill.reactions?.oppose ?? 0}</span>
        <span class="text">Oppose</span>
      </button>
    </div>
  </div>
</article>

<style>
  .bill-card {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 14px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
  }

  .bill-card:hover {
    transform: translateY(-2px);
    border-color: #475569;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
  }

  .card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .badges-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
  }

  .code-badge {
    font-weight: 800;
    font-size: 0.85rem;
    padding: 0.25rem 0.6rem;
    border-radius: 6px;
    letter-spacing: 0.5px;
  }

  .house-code {
    background: #0284c7;
    color: #ffffff;
  }

  .senate-code {
    background: #b91c1c;
    color: #ffffff;
  }

  .chamber-pill {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    font-weight: 500;
  }

  .house-pill {
    background: #082f49;
    color: #38bdf8;
    border: 1px solid #0369a1;
  }

  .senate-pill {
    background: #450a0a;
    color: #f87171;
    border: 1px solid #991b1b;
  }

  .type-pill {
    font-size: 0.72rem;
    padding: 0.2rem 0.5rem;
    border-radius: 6px;
    color: #cbd5e1;
    background: #0f172a;
    border: 1px solid #334155;
  }

  .gov-pill {
    color: #fde047;
    border-color: #854d0e;
    background: #422006;
  }

  .status-pill {
    font-size: 0.75rem;
    padding: 0.25rem 0.65rem;
    border-radius: 9999px;
    font-weight: 500;
    background: #312e81;
    color: #c7d2fe;
    border: 1px solid #4338ca;
    align-self: flex-start;
  }

  .bill-title {
    font-size: 1.2rem;
    font-weight: 700;
    margin: 0;
    line-height: 1.35;
    color: #f8fafc;
  }

  .bill-long-title {
    font-size: 0.875rem;
    color: #94a3b8;
    margin: 0;
    line-height: 1.5;
  }

  .bill-long-title.clamped {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .btn-toggle {
    background: none;
    border: none;
    color: #60a5fa;
    font-size: 0.75rem;
    cursor: pointer;
    padding: 0;
    text-align: left;
    margin-top: -0.25rem;
  }

  .btn-toggle:hover {
    text-decoration: underline;
  }

  .meta-section {
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-size: 0.8rem;
  }

  .meta-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    align-items: baseline;
  }

  .meta-label {
    color: #64748b;
    font-weight: 600;
  }

  .meta-value {
    color: #e2e8f0;
  }

  .meta-date {
    color: #94a3b8;
    font-size: 0.75rem;
  }

  .meta-sub {
    font-size: 0.72rem;
    color: #64748b;
    display: flex;
    justify-content: space-between;
    border-top: 1px solid #1e293b;
    padding-top: 0.35rem;
    margin-top: 0.2rem;
  }

  .card-footer {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid #334155;
  }

  .reactions-title {
    font-size: 0.75rem;
    color: #94a3b8;
  }

  .reactions-buttons {
    display: flex;
    gap: 0.6rem;
  }

  .btn-react {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.55rem 0.75rem;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    border: 1px solid #334155;
    background: #0f172a;
    color: #e2e8f0;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-react:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-support:hover:not(:disabled) {
    background: #064e3b;
    border-color: #10b981;
    color: #a7f3d0;
  }

  .btn-oppose:hover:not(:disabled) {
    background: #7f1d1d;
    border-color: #ef4444;
    color: #fecaca;
  }

  .count {
    font-weight: 700;
  }
</style>
