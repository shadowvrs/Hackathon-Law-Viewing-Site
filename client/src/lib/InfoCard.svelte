<script lang="ts">
    import type { ParliamentBill } from "@app/shared";

    interface Props {
        bill: ParliamentBill;
        userEmail?: string;
        closeInfoCard: () => void;
    }

    let { bill, userEmail, closeInfoCard }: Props = $props();
    let emailPopUp = $state(false);

    const displayTitle = $derived(
        bill.ShortTitleEn || bill.ShortTitle || bill.LongTitleEn || bill.LongTitle
    );

    const isHouse = $derived(
        bill.OriginatingChamberNameEn.toLowerCase().includes('house') || bill.IsHouseBill
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

    const formattedDate = $derived(
    bill.LatestCompletedBillStageDateTime
      ? new Date(bill.LatestCompletedBillStageDateTime).toLocaleDateString('en-CA', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : null
  );

  const supportUrl = $derived.by(() => userEmail ? encodeURI(
    `mailto:hackathonsender.exemplify724@passmail.net?subject=Support to ${displayTitle}&body=I am emailing you today to express my support for ${displayTitle}.`
  ): "/#login");
  const opposeUrl = $derived.by(() => userEmail ? encodeURI(
    `mailto:hackathonsender.exemplify724@passmail.net?subject=Opposition to ${displayTitle}&body=I am emailing you today to express my opposition for ${displayTitle}.`
  ): "/#login");

  function emailPromptToggle() {
    emailPopUp = !emailPopUp;
  }


</script>
<button class="black" onclick={closeInfoCard} title=""></button>
<div class="info-card">
    <div class="header">
      <h2><span class="code-badge {isHouse ? 'house-code' : 'senate-code'}">{bill.NumberCode}</span> - {displayTitle}</h2>
      <button class="close-button" onclick={closeInfoCard}>X</button>
    </div>
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
            <span class="status-pill">{bill.StatusNameEn || bill.StatusName}</span>
        </div>
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
        <span>45th Parliament, 1st Session</span><br>
        <span>Stage: {bill.OngoingStageNameEn || bill.OngoingStageName}</span>
      </div>
    {/if}
  </div>

  {#if bill.ShortTitle && bill.LongTitle && bill.ShortTitle !== bill.LongTitle}
    <p class="bill-long-title">
      {bill.LongTitle}
    </p>
  {:else}
    <p class="bill-long-title">Summary not found.</p>
  {/if}

  <div class="card-footer">
    <span class="options-title">What do you think of this legislation?</span>
    <div class="options">
      <a class="vote-options support-option text" href={supportUrl}>Support</a>
      <a class="vote-options oppose-option text" href={opposeUrl}>Oppose</a>
    </div>
  </div>
</div>

<style>
    h2 {
        font-size: 1.25em;
    }

    .black {
        position: fixed;
        top: 0;
        left: 0;
        background: black;
        opacity: 33%;
        transition: 1s;
        width: 100%;
        height: 100%;
    }

    .header {
      display: flex;
    }
    
    .close-button {
        width: 25px;
        margin-left: auto;
        padding: 0px;
        background: none;
        border: none;
        transform: translate(0, -40%);
    }

    .close-button:hover {
        border: none;
        cursor: pointer;
    }

    .code-badge {
        font-weight: 800;
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

    .card-top {
        display: flex;
        align-items: flex-start;
        flex-wrap: wrap;
        gap: 0.5rem;
        padding-top: 0.5rem;
        padding-bottom: 0.5rem;
    }

    .badges-row {
        font-size: 1.25rem;
    }

    .chamber-pill {
        font-size: 0.6em;
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
        font-size: 0.6em;
        padding: 0.25rem 0.5rem;
        font-weight: 500;
        border-radius: 6px;
        border: 1px groove #d3d6db;
    }

    .gov-pill {
        align-self: flex-start;
    }

    .status-pill {
        font-size: 0.6em;
        padding: 0.25rem 0.5rem;
        border-radius: 6px;
        font-weight: 500;
        border: 1px groove #d3d6db;
    }

    .meta-section {
        background: #ebeced;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        font-size: 0.8rem;
    }

    .meta-row {
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
        border-top: 1px solid #e2e8f0;
        padding-top: 0.35rem;
        margin-top: 0.2rem;
    }

    .bill-long-title {
        height: 100%;
        padding: 0.5rem;
        margin-top: 0.25rem;
        margin-bottom: 0.25rem;
        background: #ebeced;
        border-radius: 10px;
        font-size: 0.875rem;
        color: #475569;
        line-height: 1.5;
    }

    .card-footer {
        margin-top: auto;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding-top: 0.5rem;
        border-top: 1px solid #e2e8f0;
    }

    .options-title {
        font-size: 0.75rem;
        color: #64748b;
    }

    .options {
        display: flex;
        gap: 0.6rem;
    }

    .vote-options {
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
        text-decoration: none;
    }

    .vote-options:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .support-option {
        background: #16a34a;
        border: 1px solid #15803d;
        color: #ffffff;
    }

    .support-option:hover:not(:disabled) {
        background: #15803d;
        border-color: #166534;
    }

    .oppose-option {
        background: #dc2626;
        border: 1px solid #b91c1c;
        color: #ffffff;
    }

    .oppose-option:hover:not(:disabled) {
        background: #b91c1c;
        border-color: #991b1b;
    }

    .info-card {
      position: fixed;
      display: flex;
      flex-direction: column;
      transform: translate(50%, -170%);
      z-index: 999;
      width: 550px;
      height: 550px;
      background-color: #ffffff;
      border-radius: 14px;
      border: 1px solid #e2e8f0;
      gap: 0.85rem;
      padding: 1rem;
      padding-top: 1rem;
      margin: 20px;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04);
    }
</style>