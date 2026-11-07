<script lang="ts">
  import { onMount } from 'svelte';
  import type { ParliamentBill, ApiResponse, HealthCheckResponse, User } from '@app/shared';
  import LawCard from './lib/LawCard.svelte';
  import LoginPage from './lib/LoginPage.svelte';

  let bills = $state<ParliamentBill[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let serverStatus = $state<'connecting' | 'online' | 'offline'>('connecting');
  let searchQuery = $state('');
  let selectedChamber = $state<'All' | 'House of Commons' | 'Senate'>('All');
  let selectedFilter = $state<'All' | 'Government' | 'Private/Public'>('All');
  let reactingId = $state<string | null>(null);

  // Authentication & Page View state
  let currentView = $state<'bills' | 'login'>('bills');
  let currentUser = $state<User | null>(null);
  let toastMessage = $state<string | null>(null);
  let toastTimeout: ReturnType<typeof setTimeout> | null = null;

  function showToast(msg: string) {
    if (toastTimeout) clearTimeout(toastTimeout);
    toastMessage = msg;
    toastTimeout = setTimeout(() => {
      toastMessage = null;
    }, 4000);
  }

  function navigateTo(view: 'bills' | 'login') {
    currentView = view;
    if (view === 'login') {
      window.location.hash = '#login';
    } else {
      window.location.hash = '';
    }
  }

  function handleLoginSuccess(user: User, token: string) {
    currentUser = user;
    try {
      localStorage.setItem('legisinfo_user', JSON.stringify(user));
      localStorage.setItem('legisinfo_token', token);
    } catch {
      // ignore
    }
    navigateTo('bills');
    showToast(`Welcome back, ${user.name}!`);
  }

  function handleLogout() {
    currentUser = null;
    try {
      localStorage.removeItem('legisinfo_user');
      localStorage.removeItem('legisinfo_token');
    } catch {
      // ignore
    }
    showToast('You have been signed out.');
  }

  const userInitials = $derived(() => {
    if (!currentUser?.name) return 'U';
    const parts = currentUser.name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  });

  async function checkServerHealth() {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data: HealthCheckResponse = await res.json();
        serverStatus = data.status === 'ok' ? 'online' : 'offline';
      } else {
        serverStatus = 'offline';
      }
    } catch {
      serverStatus = 'offline';
    }
  }

  async function fetchBills() {
    try {
      loading = true;
      error = null;
      const res = await fetch('/api/bills');
      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
      const json: ApiResponse<ParliamentBill[]> = await res.json();
      if (json.success) {
        bills = json.data;
      }
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : 'Failed to retrieve legislation records';
    } finally {
      loading = false;
    }
  }

  async function reactToBill(id: string, type: 'support' | 'oppose') {
    reactingId = id;
    try {
      const res = await fetch(`/api/bills/${id}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const data: ApiResponse<ParliamentBill> = await res.json();
      if (data.success && data.data) {
        bills = bills.map((b) => (String(b.Id) === id ? data.data : b));
      }
    } catch (err) {
      console.error('Failed to submit reaction:', err);
    } finally {
      reactingId = null;
    }
  }

  onMount(() => {
    checkServerHealth();
    fetchBills();

    // Restore user from localStorage
    try {
      const stored = localStorage.getItem('legisinfo_user');
      if (stored) {
        currentUser = JSON.parse(stored);
      }
    } catch {
      // ignore
    }

    const updateViewFromHash = () => {
      if (window.location.hash === '#login') {
        currentView = 'login';
      } else {
        currentView = 'bills';
      }
    };

    updateViewFromHash();
    window.addEventListener('hashchange', updateViewFromHash);

    return () => {
      window.removeEventListener('hashchange', updateViewFromHash);
    };
  });

  const filteredBills = $derived(
    bills.filter((bill) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        bill.NumberCode.toLowerCase().includes(q) ||
        (bill.ShortTitle && bill.ShortTitle.toLowerCase().includes(q)) ||
        (bill.ShortTitleEn && bill.ShortTitleEn.toLowerCase().includes(q)) ||
        (bill.LongTitle && bill.LongTitle.toLowerCase().includes(q)) ||
        (bill.LongTitleEn && bill.LongTitleEn.toLowerCase().includes(q)) ||
        (bill.SponsorPersonName && bill.SponsorPersonName.toLowerCase().includes(q)) ||
        (bill.StatusNameEn && bill.StatusNameEn.toLowerCase().includes(q));

      const matchesChamber =
        selectedChamber === 'All' ||
        bill.OriginatingChamberNameEn.toLowerCase() === selectedChamber.toLowerCase();

      const matchesType =
        selectedFilter === 'All' ||
        (selectedFilter === 'Government' && bill.IsGovernmentBill) ||
        (selectedFilter === 'Private/Public' && !bill.IsGovernmentBill);

      return matchesSearch && matchesChamber && matchesType;
    })
  );

  const senateCount = $derived(
    bills.filter((b) => b.OriginatingChamberNameEn === 'Senate').length
  );
  const houseCount = $derived(
    bills.filter((b) => b.OriginatingChamberNameEn === 'House of Commons').length
  );
</script>

<div class="app-layout">
  <header class="navbar">
    <div class="navbar-content">
      <button class="brand brand-clickable" onclick={() => navigateTo('bills')}>
        <span class="flag">🍁</span>
        <div>
          <h1>LEGISinfo Canada Tracker</h1>
          <p class="tagline">Real-time Canadian Parliament & Senate Legislation Monitor</p>
        </div>
      </button>

      <div class="header-right">
        <div class="status-indicator status-{serverStatus}">
          <span class="dot"></span>
          <span>Express API: {serverStatus}</span>
        </div>
        <div class="stats-badge">
          <span>{bills.length} Bills Loaded</span>
        </div>

        {#if currentUser}
          <div class="user-profile-wrap">
            <span class="user-avatar" title={currentUser.name}>
              {userInitials()}
            </span>
            <span class="user-name" title={currentUser.email}>{currentUser.name}</span>
            <button class="btn-sign-out" onclick={handleLogout} title="Sign Out">
              Sign Out
            </button>
          </div>
        {:else if currentView === 'login'}
          <button class="nav-btn" onclick={() => navigateTo('bills')}>
            Browse Legislation
          </button>
        {:else}
          <button class="nav-btn btn-sign-in" onclick={() => navigateTo('login')}>
            Sign In
          </button>
        {/if}
      </div>
    </div>
  </header>

  <main class="page-body">
    {#if toastMessage}
      <div class="toast-banner">
        <span>✓ {toastMessage}</span>
        <button class="toast-close" onclick={() => (toastMessage = null)}>✕</button>
      </div>
    {/if}

    {#if currentView === 'login'}
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onBack={() => navigateTo('bills')}
      />
    {:else}
      <div class="filter-bar">
        <div class="search-input-wrap">
          <span class="search-icon">🔍</span>
          <input
            type="search"
            placeholder="Search by Bill # (e.g., S-8, C-41), title, sponsor, or keyword..."
            bind:value={searchQuery}
          />
          {#if searchQuery}
            <button class="clear-btn" onclick={() => (searchQuery = '')}>✕</button>
          {/if}
        </div>

        <div class="filters-row">
          <div class="filter-group">
            <span class="filter-title">Chamber:</span>
            <div class="chips">
              <button
                class="chip {selectedChamber === 'All' ? 'active' : ''}"
                onclick={() => (selectedChamber = 'All')}
              >
                All ({bills.length})
              </button>
              <button
                class="chip {selectedChamber === 'Senate' ? 'active' : ''}"
                onclick={() => (selectedChamber = 'Senate')}
              >
                Senate ({senateCount})
              </button>
              <button
                class="chip {selectedChamber === 'House of Commons' ? 'active' : ''}"
                onclick={() => (selectedChamber = 'House of Commons')}
              >
                House of Commons ({houseCount})
              </button>
            </div>
          </div>

          <div class="filter-group">
            <span class="filter-title">Type:</span>
            <div class="chips">
              <button
                class="chip {selectedFilter === 'All' ? 'active' : ''}"
                onclick={() => (selectedFilter = 'All')}
              >
                All
              </button>
              <button
                class="chip {selectedFilter === 'Government' ? 'active' : ''}"
                onclick={() => (selectedFilter = 'Government')}
              >
                Government Bills
              </button>
              <button
                class="chip {selectedFilter === 'Private/Public' ? 'active' : ''}"
                onclick={() => (selectedFilter = 'Private/Public')}
              >
                Private & Public Bills
              </button>
            </div>
          </div>
        </div>
      </div>

      {#if loading}
        <div class="center-box">
          <div class="loading-spinner"></div>
          <p>Retrieving parliamentary records from backend API...</p>
        </div>
      {:else if error}
        <div class="error-banner">
          <p>⚠️ {error}</p>
          <button class="btn-primary" onclick={fetchBills}>Retry Connection</button>
        </div>
      {:else if filteredBills.length === 0}
        <div class="center-box">
          <p class="empty-title">No matching legislation found</p>
          <p class="empty-desc">Try clearing filters or searching for different keywords.</p>
          <button
            class="btn-primary"
            onclick={() => {
              searchQuery = '';
              selectedChamber = 'All';
              selectedFilter = 'All';
            }}
          >
            Reset Filters
          </button>
        </div>
      {:else}
        <div class="results-header">
          <span>Showing {filteredBills.length} of {bills.length} bills</span>
        </div>

        <div class="bills-grid">
          {#each filteredBills as bill (bill.Id)}
            <LawCard
              {bill}
              reacting={reactingId === String(bill.Id)}
              onReact={reactToBill}
            />
          {/each}
        </div>
      {/if}
    {/if}
  </main>
</div>

<style>
  :global(:root) {
    --bg-main: #f8fafc;
    --bg-card: #ffffff;
    --border-color: #e2e8f0;
    --text-primary: #0f172a;
    --text-muted: #64748b;
    --accent: #0284c7;
  }

  .app-layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: var(--bg-main);
    color: var(--text-primary);
  }

  .navbar {
    background: #ffffff;
    border-bottom: 1px solid var(--border-color);
    padding: 1.25rem 2rem;
    position: sticky;
    top: 0;
    z-index: 20;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  }

  .navbar-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 0.85rem;
  }

  .brand-clickable {
    cursor: pointer;
    background: none;
    border: none;
    padding: 0;
    text-align: left;
    font: inherit;
    color: inherit;
    transition: opacity 0.15s ease;
  }

  .brand-clickable:hover {
    opacity: 0.85;
  }

  .flag {
    font-size: 2.25rem;
  }

  h1 {
    font-size: 1.45rem;
    font-weight: 800;
    margin: 0;
    letter-spacing: -0.3px;
    color: #0f172a;
  }

  .tagline {
    margin: 0.15rem 0 0 0;
    font-size: 0.85rem;
    color: var(--text-muted);
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .status-indicator {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.35rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.78rem;
    font-weight: 600;
    background: #ffffff;
    border: 1px solid var(--border-color);
    color: #334155;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .status-online .dot {
    background-color: #10b981;
    box-shadow: 0 0 6px rgba(16, 185, 129, 0.4);
  }

  .status-connecting .dot {
    background-color: #f59e0b;
    box-shadow: 0 0 6px rgba(245, 158, 11, 0.4);
  }

  .status-offline .dot {
    background-color: #ef4444;
    box-shadow: 0 0 6px rgba(239, 68, 68, 0.4);
  }

  .stats-badge {
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    padding: 0.35rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.78rem;
    font-weight: 600;
    color: #0284c7;
  }

  .nav-btn {
    background: #ffffff;
    border: 1px solid var(--border-color);
    padding: 0.35rem 0.85rem;
    border-radius: 8px;
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--text-primary);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .nav-btn:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
  }

  .btn-sign-in {
    background: #0284c7;
    border: 1px solid #0284c7;
    color: #ffffff;
  }

  .btn-sign-in:hover {
    background: #0369a1;
    border-color: #0369a1;
  }

  .user-profile-wrap {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.25rem 0.6rem 0.25rem 0.25rem;
    background: #ffffff;
    border: 1px solid var(--border-color);
    border-radius: 9999px;
  }

  .user-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #0284c7;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.72rem;
    font-weight: 700;
  }

  .user-name {
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--text-primary);
    max-width: 140px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .btn-sign-out {
    background: none;
    border: none;
    color: #ef4444;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    transition: background 0.15s ease;
  }

  .btn-sign-out:hover {
    background: #fee2e2;
  }

  .toast-banner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: #166534;
    padding: 0.75rem 1.25rem;
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 500;
    margin-bottom: 1.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  }

  .toast-close {
    background: none;
    border: none;
    color: #166534;
    cursor: pointer;
    font-size: 0.9rem;
    padding: 0 0.25rem;
  }

  .page-body {
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
    padding: 2rem;
    box-sizing: border-box;
    flex: 1;
  }

  .filter-bar {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    margin-bottom: 1.75rem;
  }

  .search-input-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 1rem;
    font-size: 1rem;
    opacity: 0.7;
    pointer-events: none;
    color: #64748b;
  }

  .search-input-wrap input {
    width: 100%;
    padding: 0.9rem 2.8rem 0.9rem 2.75rem;
    border-radius: 10px;
    border: 1px solid var(--border-color);
    background: #ffffff;
    color: var(--text-primary);
    font-size: 1rem;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .search-input-wrap input:focus {
    border-color: #0284c7;
    box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
  }

  .clear-btn {
    position: absolute;
    right: 1rem;
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 1rem;
    cursor: pointer;
  }

  .filters-row {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    align-items: center;
  }

  .filter-group {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .filter-title {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .chips {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .chip {
    padding: 0.35rem 0.75rem;
    border-radius: 8px;
    font-size: 0.82rem;
    font-weight: 500;
    border: 1px solid var(--border-color);
    background: #ffffff;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .chip:hover {
    background: #f1f5f9;
    color: var(--text-primary);
  }

  .chip.active {
    background: #0284c7;
    border-color: #0284c7;
    color: #ffffff;
  }

  .results-header {
    margin-bottom: 1rem;
    font-size: 0.85rem;
    color: var(--text-muted);
  }

  .bills-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    gap: 1.5rem;
  }

  .center-box {
    text-align: center;
    padding: 5rem 1rem;
    color: var(--text-muted);
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    margin: 0 auto 1.25rem;
    border: 3px solid var(--border-color);
    border-top-color: #0284c7;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .empty-title {
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 0.5rem 0;
  }

  .empty-desc {
    margin: 0 0 1.5rem 0;
  }

  .error-banner {
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 10px;
    padding: 1.5rem;
    text-align: center;
    color: #991b1b;
  }

  .btn-primary {
    background: #0284c7;
    color: white;
    border: none;
    padding: 0.6rem 1.25rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .btn-primary:hover {
    background: #0369a1;
  }
</style>
