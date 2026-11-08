<script lang="ts">
  import type { User, ApiResponse, AuthResponse } from '@app/shared';

  interface Props {
    onLoginSuccess: (user: User, token: string) => void;
    onBack: () => void;
  }

  let { onLoginSuccess, onBack }: Props = $props();

  let mode = $state<'login' | 'register'>('login');
  let name = $state('');
  let email = $state('');
  let password = $state('');
  let rememberMe = $state(true);
  let showPassword = $state(false);

  let loading = $state(false);
  let errorMessage = $state<string | null>(null);
  let successMessage = $state<string | null>(null);

  function resetForm() {
    errorMessage = null;
    successMessage = null;
  }

  function handleModeChange(newMode: 'login' | 'register') {
    mode = newMode;
    resetForm();
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    resetForm();

    if (!email.trim() || !password) {
      errorMessage = 'Please enter both your email and password.';
      return;
    }

    if (mode === 'register' && !name.trim()) {
      errorMessage = 'Please enter your full name.';
      return;
    }

    loading = true;

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload =
        mode === 'login'
          ? { email: email.trim(), password }
          : { name: name.trim(), email: email.trim(), password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data: ApiResponse<AuthResponse | null> = await res.json();

      if (!res.ok || !data.success || !data.data) {
        throw new Error(data.message || 'Authentication failed. Please check your credentials.');
      }

      successMessage = mode === 'login' ? 'Signed in successfully!' : 'Account created successfully!';
      
      const authData = data.data;
      setTimeout(() => {
        onLoginSuccess(authData.user, authData.token);
      }, 400);
    } catch (err: unknown) {
      errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
    } finally {
      loading = false;
    }
  }

  function fillDemoCredentials() {
    mode = 'login';
    email = 'citizen@example.ca';
    password = 'password123';
    resetForm();
  }
</script>

<div class="login-container">
  <button class="btn-back" onclick={onBack}>
    ← Back to Legislation
  </button>

  <div class="login-card">
    <div class="card-header">
      <span class="flag-icon">🍁</span>
      <h2 class="auth-title">
        {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
      </h2>
      <p class="auth-subtitle">
        {mode === 'login'
          ? 'Sign in to track bills, participate in polls, and customize your feed.'
          : 'Join LEGISinfo Canada Tracker to stay informed about Canadian federal legislation.'}
      </p>
    </div>

    <!-- Mode Switcher -->
    <div class="auth-tabs" role="tablist">
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'login'}
        class="tab-btn {mode === 'login' ? 'active' : ''}"
        onclick={() => handleModeChange('login')}
      >
        Sign In
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'register'}
        class="tab-btn {mode === 'register' ? 'active' : ''}"
        onclick={() => handleModeChange('register')}
      >
        Register
      </button>
    </div>

    {#if errorMessage}
      <div class="alert alert-error" role="alert">
        <span class="alert-icon">⚠️</span>
        <span>{errorMessage}</span>
      </div>
    {/if}

    {#if successMessage}
      <div class="alert alert-success" role="alert">
        <span class="alert-icon">✓</span>
        <span>{successMessage}</span>
      </div>
    {/if}

    <form class="auth-form" onsubmit={handleSubmit}>
      {#if mode === 'register'}
        <div class="form-group">
          <label for="reg-name">Full Name</label>
          <input
            id="reg-name"
            type="text"
            placeholder="e.g. Jane Doe"
            bind:value={name}
            required
            autocomplete="name"
          />
        </div>
      {/if}

      <div class="form-group">
        <label for="auth-email">Email Address</label>
        <input
          id="auth-email"
          type="email"
          placeholder="e.g. citizen@example.ca"
          bind:value={email}
          required
          autocomplete="email"
        />
      </div>

      <div class="form-group">
        <div class="label-row">
          <label for="auth-password">Password</label>
          {#if mode === 'login'}
            <button
              type="button"
              class="link-btn"
              onclick={() => alert('Password reset link demo: Use Demo Login or register a new account.')}
            >
              Forgot password?
            </button>
          {/if}
        </div>
        <div class="password-input-wrap">
          <input
            id="auth-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            bind:value={password}
            required
            autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
          <button
            type="button"
            class="btn-toggle-pw"
            onclick={() => (showPassword = !showPassword)}
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>
      </div>

      {#if mode === 'login'}
        <div class="form-row remember-row">
          <label class="checkbox-label">
            <input type="checkbox" bind:checked={rememberMe} />
            <span>Remember me for 30 days</span>
          </label>
        </div>
      {/if}

      <button type="submit" class="btn-submit" disabled={loading}>
        {#if loading}
          <span class="spinner-sm"></span>
          <span>{mode === 'login' ? 'Signing In...' : 'Creating Account...'}</span>
        {:else}
          <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
        {/if}
      </button>

      <div class="divider">
        <span>or</span>
      </div>

      <button
        type="button"
        class="btn-demo"
        onclick={fillDemoCredentials}
        disabled={loading}
      >
        <span>⚡ Quick Demo Login (citizen@example.ca)</span>
      </button>
    </form>
  </div>
</div>

<style>
  .login-container {
    max-width: 480px;
    margin: 2rem auto 4rem auto;
    padding: 0 1rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    
  }

  .btn-back {
    align-self: flex-start;
    background: none;
    border: none;
    color: #0284c7;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    padding: 0.4rem 0.6rem;
    border-radius: 6px;
    transition: background 0.15s ease;
    font-family: Georgia, 'Times New Roman', Times, serif;
  }

  .btn-back:hover {
    background: #e0f2fe;
  }

  .login-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 2.25rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
  }

  .card-header {
    text-align: center;
    margin-bottom: 1.75rem;
  }

  .flag-icon {
    font-size: 2.5rem;
    display: block;
    margin-bottom: 0.5rem;
  }

  .auth-title {
    font-size: 1.5rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 0.4rem 0;
  }

  .auth-subtitle {
    font-size: 0.88rem;
    color: #64748b;
    margin: 0;
    line-height: 1.45;
  }

  .auth-tabs {
    display: flex;
    background: #f1f5f9;
    border-radius: 10px;
    padding: 0.3rem;
    margin-bottom: 1.5rem;
    border: 1px solid #e2e8f0;
    
  }

  .tab-btn {
    flex: 1;
    padding: 0.6rem;
    font-size: 0.88rem;
    font-weight: 600;
    background: none;
    border: none;
    border-radius: 8px;
    color: #64748b;
    cursor: pointer;
    transition: all 0.15s ease;
    font-family: Georgia, 'Times New Roman', Times, serif;
  }

  .tab-btn.active {
    background: #ffffff;
    color: #0284c7;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }

  .alert {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    font-size: 0.85rem;
    margin-bottom: 1.25rem;
  }

  .alert-error {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #991b1b;
  }

  .alert-success {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: #166534;
  }

  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    text-align: left;
    
  }

  .label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  label {
    font-size: 0.85rem;
    font-weight: 600;
    color: #334155;
  }

  .link-btn {
    background: none;
    border: none;
    color: #0284c7;
    font-size: 0.78rem;
    cursor: pointer;
    padding: 0;
    font-family: Georgia, 'Times New Roman', Times, serif;
  }

  .link-btn:hover {
    text-decoration: underline;
  }

  input[type='text'],
  input[type='email'],
  input[type='password'] {
    width: 100%;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    border: 1px solid #cbd5e1;
    background: #ffffff;
    color: #0f172a;
    font-size: 0.95rem;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.15s, box-shadow 0.15s;
    font-family: Georgia, 'Times New Roman', Times, serif;  
  }

  input:focus {
    border-color: #0284c7;
    box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
  }

  .password-input-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }

  .password-input-wrap input {
    padding-right: 2.8rem;
  }

  .btn-toggle-pw {
    position: absolute;
    right: 0.75rem;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    opacity: 0.7;
    padding: 0.2rem;
  }

  .btn-toggle-pw:hover {
    opacity: 1;
  }

  .remember-row {
    display: flex;
    align-items: center;
  }

  .checkbox-label {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.82rem;
    color: #64748b;
    cursor: pointer;
    font-weight: 400;
  }

  .checkbox-label input[type='checkbox'] {
    cursor: pointer;
    accent-color: #0284c7;
  }

  .btn-submit {
    background: #0284c7;
    color: #ffffff;
    border: none;
    padding: 0.8rem;
    border-radius: 8px;
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: background 0.15s ease;
    font-family: Georgia, 'Times New Roman', Times, serif;
  }

  .btn-submit:hover:not(:disabled) {
    background: #0369a1;
  }

  .btn-submit:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  .spinner-sm {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.4);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .divider {
    display: flex;
    align-items: center;
    text-align: center;
    color: #94a3b8;
    font-size: 0.8rem;
  }

  .divider::before,
  .divider::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid #e2e8f0;
  }

  .divider span {
    padding: 0 0.75rem;
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.5px;
  }

  .btn-demo {
    background: #f8fafc;
    border: 1px dashed #cbd5e1;
    color: #475569;
    padding: 0.7rem;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    font-family: Georgia, 'Times New Roman', Times, serif;
  }

  .btn-demo:hover:not(:disabled) {
    background: #e0f2fe;
    border-color: #0284c7;
    color: #0284c7;
  }
</style>
