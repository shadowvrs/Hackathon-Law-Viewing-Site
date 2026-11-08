<script lang="ts">
  import type { ParliamentBill } from '@app/shared';
  
  interface Props {
    bill: ParliamentBill;
    userEmail?: string;
  }

  let { bill, userEmail }: Props = $props();
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

  const url = $derived.by(() => userEmail ? encodeURI(
    `mailto:hackathonsender.exemplify724@passmail.net?subject=Opposition to ${displayTitle}&body=I am emailing you today to show express my opposition to ${displayTitle}.`
  ): "/#login");

  function emailPromptToggle() {
    emailPopUp = !emailPopUp;
  }
</script>

<article class="bill-card">
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


  {#if bill.ShortTitle && bill.LongTitle && bill.ShortTitle !== bill.LongTitle}
    <p class="bill-long-title {expanded ? 'expanded' : 'clamped'}">
      {bill.LongTitle}
    </p>
    <!-- <button class="btn-toggle" onclick={() => (expanded = !expanded)}>
      {expanded ? '▲ Show less' : '▼ View full legislative description'}
    </button> -->
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
        onclick={emailPromptToggle}
        title="Support this legislation"
      >
        <span class="text">Support</span>
      </button>

      <button
        class="btn-react btn-oppose"
        onclick={emailPromptToggle}
        title="Oppose this legislation"
      >
        <span class="text">Oppose</span>
      </button>
    </div>
    <div class="email-link">
        {#if emailPopUp}
          <a class="text" href={url}>
            <span class = "text">Send an email?</span>
          </a>
        {/if}
    </div>
  </div>
</article>

<style>
  .bill-card {
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

  .bill-long-title {
    font-size: 0.875rem;
    color: #475569;
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

  .card-footer {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid #e2e8f0;
  }

  .reactions-title {
    font-size: 0.75rem;
    color: #64748b;
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
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-react:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-support {
    background: #16a34a;
    border: 1px solid #15803d;
    color: #ffffff;
  }

  .btn-support:hover:not(:disabled) {
    background: #15803d;
    border-color: #166534;
  }

  .btn-oppose {
    background: #dc2626;
    border: 1px solid #b91c1c;
    color: #ffffff;
  }

  .btn-oppose:hover:not(:disabled) {
    background: #b91c1c;
    border-color: #991b1b;
  }
</style>
