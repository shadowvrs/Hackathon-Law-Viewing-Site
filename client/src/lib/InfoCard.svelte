<script lang="ts">
    import type { ParliamentBill } from "@app/shared";

    interface Props {
        bill: ParliamentBill;
    }

    let { bill }: Props = $props();

    const displayTitle = $derived(
        bill.ShortTitleEn || bill.ShortTitle || bill.LongTitleEn || bill.LongTitle
    );
    const isHouse = $derived(
        bill.OriginatingChamberNameEn.toLowerCase().includes('house') || bill.IsHouseBill
    );
</script>

<div id="info-card">
    <h2 class="code-badge {isHouse ? 'house-code' : 'senate-code'}">{bill.NumberCode}  -  {displayTitle}</h2>
</div>

<!-- <style>
    #info-card {

    }
</style> -->