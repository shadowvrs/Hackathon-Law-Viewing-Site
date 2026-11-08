<script lang="ts">
  import { onMount } from 'svelte';
  import type { ParliamentBill, ApiResponse, HealthCheckResponse, User } from '@app/shared';
  import LawCard from './lib/LawCard.svelte';
  import LoginPage from './lib/LoginPage.svelte';
  import InfoCard from './lib/InfoCard.svelte';

  let currentBill: ParliamentBill | undefined = $state();
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
  let isUserMenuOpen = $state(false);
  let userMenuRef = $state<HTMLElement | null>(null);
  let toastMessage = $state<string | null>(null);
  let toastTimeout: ReturnType<typeof setTimeout> | null = null;

  function toggleUserMenu(event?: MouseEvent) {
    if (event) event.stopPropagation();
    isUserMenuOpen = !isUserMenuOpen;
  }

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
      localStorage.setItem('legisinfo_token', token);
    } catch {
      // ignore
    }
    navigateTo('bills');
    showToast(`Welcome back, ${user.name}!`);
  }

  function handleLogout() {
    isUserMenuOpen = false;
    currentUser = null;
    try {
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
      const response = await fetch('/api/health');
      if (response.ok) {
        const data: HealthCheckResponse = await response.json();
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
      const response = await fetch('/api/bills');
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      const json: ApiResponse<ParliamentBill[]> = await response.json();
      if (json.success) {
        bills = json.data;
      }
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : 'Failed to retrieve legislation records';
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    checkServerHealth();
    fetchBills();

    // Restore user session via API using stored token
    // Clean up legacy user key if still present
    localStorage.removeItem('legisinfo_user');
    (async () => {
      try {
        const token = localStorage.getItem('legisinfo_token');
        if (token) {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data: ApiResponse<User | null> = await res.json();
            if (data.success && data.data) {
              currentUser = data.data;
            } else {
              // Token invalid/expired — clear it
              localStorage.removeItem('legisinfo_token');
            }
          } else {
            localStorage.removeItem('legisinfo_token');
          }
        }
      } catch {
        // ignore network errors during session restore
      }
    })();

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

<svelte:window
  onclick={(e) => {
    if (isUserMenuOpen && userMenuRef && !userMenuRef.contains(e.target as Node)) {
      isUserMenuOpen = false;
    }
  }}
  onkeydown={(e) => {
    if (e.key === 'Escape' && isUserMenuOpen) {
      isUserMenuOpen = false;
    }
  }}
/>

<div class="app-layout">
  <header class="navbar">
    <div class="navbar-content">
      <button class="brand brand-clickable" onclick={() => navigateTo('bills')}>
        <span class="flag">🍁</span>
        <div>
          <h1>Accessible Politics Canada</h1>
          <p class="tagline">Live Data on Current Bills</p>
        </div>
      </button>

      <div class="header-right">
        {#if currentUser}
          <div class="user-menu-container" bind:this={userMenuRef}>
            <button
              type="button"
              class="user-profile-btn {isUserMenuOpen ? 'active' : ''}"
              onclick={toggleUserMenu}
              aria-expanded={isUserMenuOpen}
              aria-haspopup="true"
              aria-label="Account menu"
            >
              <span class="user-avatar" title={currentUser.name}>
                {userInitials()}
              </span>
              <span class="user-name" title={currentUser.email}>{currentUser.name}</span>
              <span class="chevron-arrow {isUserMenuOpen ? 'rotated' : ''}" aria-hidden="true">▼</span>
            </button>

            {#if isUserMenuOpen}
              <div class="user-dropdown-menu" role="menu">
                <div class="dropdown-user-header">
                  <div class="dropdown-avatar">
                    {userInitials()}
                  </div>
                  <div class="dropdown-user-info">
                    <span class="dropdown-user-name" title={currentUser.name}>{currentUser.name}</span>
                    <span class="dropdown-user-email" title={currentUser.email}>{currentUser.email}</span>
                  </div>
                </div>

                <div class="dropdown-divider"></div>

                <button
                  type="button"
                  class="dropdown-item dropdown-item-danger"
                  role="menuitem"
                  onclick={handleLogout}
                >
                  <svg class="dropdown-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  <span>Sign Out</span>
                </button>
              </div>
            {/if}
          </div>
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
              userEmail={currentUser?.email}
              modifyInfoCard={(id) => {
                currentBill = bills.find((b) => b.Id == id);
              }}
            />
          {/each}
        </div>

        {#if currentBill != undefined}
          <div>
          <InfoCard
            bill = {currentBill}
          />
        </div>
        {/if}
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
    background: #D80621;
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
    color:  #ffffff;
  }

  .tagline {
    margin: 0.15rem 0 0 0;
    font-size: 0.85rem;
    color: #dbdada;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
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
    background: #f0586c;
    box-shadow: 1px #890b0b;
    border: none;
    color: #ffffff;
  }

  .btn-sign-in:hover {
    background: #ffffff;
    color: #d5394e;
    transition: background-color 0.5s;
  }

  .user-menu-container {
    position: relative;
    display: inline-block;
  }

  .user-profile-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.65rem 0.25rem 0.25rem;
    background: #ffffff;
    border: 1px solid var(--border-color);
    border-radius: 9999px;
    cursor: pointer;
    font-family: inherit;
    color: var(--text-primary);
    transition: all 0.15s ease;
  }

  .user-profile-btn:hover,
  .user-profile-btn.active {
    background: #f8fafc;
    border-color: #cbd5e1;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }

  .user-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #c70202;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.72rem;
    font-weight: 700;
    flex-shrink: 0;
  }

  .user-name {
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--text-primary);
    max-width: 130px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .chevron-arrow {
    font-size: 0.55rem;
    color: var(--text-muted);
    transition: transform 0.2s ease;
    margin-left: 0.1rem;
    margin-right: 0.15rem;
    display: inline-block;
  }

  .chevron-arrow.rotated {
    transform: rotate(180deg);
  }

  .user-dropdown-menu {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    min-width: 210px;
    background: #ffffff;
    border: 1px solid var(--border-color);
    border-radius: 12px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
    padding: 0.5rem;
    z-index: 100;
    animation: dropdownFadeIn 0.15s ease-out;
  }

  @keyframes dropdownFadeIn {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .dropdown-user-header {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.4rem 0.5rem 0.55rem;
  }

  .dropdown-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #c70202;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: 700;
    flex-shrink: 0;
  }

  .dropdown-user-info {
    min-width: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .dropdown-user-name {
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dropdown-user-email {
    font-size: 0.73rem;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dropdown-divider {
    height: 1px;
    background: var(--border-color);
    margin: 0.3rem 0;
  }

  .dropdown-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.55rem;
    padding: 0.5rem 0.65rem;
    border: none;
    border-radius: 7px;
    background: transparent;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    transition: background 0.15s ease, color 0.15s ease;
  }

  .dropdown-item-danger {
    color: #ef4444;
  }

  .dropdown-item-danger:hover {
    background: #fef2f2;
    color: #dc2626;
  }

  .dropdown-icon {
    flex-shrink: 0;
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
