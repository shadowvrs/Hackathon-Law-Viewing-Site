<script lang="ts">
  import type { ParliamentBill } from '@app/shared';
  
  interface Props {
    bill: ParliamentBill;
    userEmail?: string;
    modifyInfoCard: (id: number) => void;
  }

  let { bill, modifyInfoCard }: Props = $props();
  let expanded = $state(false);
  let emailPopUp = $state(false);
  
  
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

<button class="bill-card" onclick={ () => modifyInfoCard(bill.Id)}>
  <span class="code-badge {isHouse ? 'house-code' : 'senate-code'}">
        {bill.NumberCode}
  </span>
  <h2 class="bill-title">{displayTitle}</h2>
  <div class="card-top">
    <div class="badges-row">
      <span class="chamber-pill {isHouse ? 'house-pill' : 'senate-pill'}">
        {isHouse ? 'House of Commons' : 'Senate'}
      </span>
      {#if bill.IsGovernmentBill}
        <span class="type-pill gov-pill">Government Bill</span>
      {:else}
        <span class="type-pill pub-pill">{bill.BillDocumentTypeNameEn}</span>
      {/if}
    </div>
    <span class="status-pill">{bill.StatusNameEn || bill.StatusName}</span>
  </div>

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
</button>

<style>
  .bill-card {
    text-align: left;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04);
  }

  .bill-card:hover {
    transform: translateY(-2px);
    border-color: #cbd5e1;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08);
    cursor: pointer;
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
    background: #D80621;
    color: #ffffff;
  }

  .chamber-pill {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    border: 1px groove #d3d6db;
    font-weight: 500;
  }

  .house-pill {
    align-self: flex-start;
  }

  .senate-pill {
    align-self: flex-start;
  }

  .type-pill {
    font-size: 0.75rem;
    padding: 0.2rem 0.5rem;
    font-weight: 500;
    border-radius: 6px;
    border: 1px groove #d3d6db;
  }

  .gov-pill {
    align-self: flex-start;
  }

  .status-pill {
    font-size: 0.75rem;
    padding: 0.25rem 0.65rem;
    border-radius: 6px;
    font-weight: 500;
    align-self: flex-start;
    border: 1px groove #d3d6db;
  }

  .bill-title {
    font-size: 1.2rem;
    font-weight: 700;
    margin: 0;
    line-height: 1.35;
    color: #0f172a;
  }

  .meta-section {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
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
    color: #1e293b;
  }

  .meta-date {
    color: #64748b;
    font-size: 0.75rem;
  }

  .meta-sub {
    font-size: 0.72rem;
    color: #64748b;
    display: flex;
    justify-content: space-between;
    border-top: 1px solid #e2e8f0;
    padding-top: 0.35rem;
    margin-top: 0.2rem;
  }
</style>
