// Utility to manage, persist, and calculate perfume pricing configuration

export interface PricingConfig {
  nonPremium: Record<number, number>;
  premiumRatePerMl: number;
  mykonosRatePerMl: number;
  minFreeShipping: number;
}

export const DEFAULT_PRICING: PricingConfig = {
  nonPremium: {
    10: 17000,
    15: 25000,
    20: 30000,
    30: 39000,
    50: 59000,
    100: 115000,
  },
  premiumRatePerMl: 4000,
  mykonosRatePerMl: 3000,
  minFreeShipping: 150000,
};

const PRICING_STORAGE_KEY = 'sinki_custom_pricing_config';

export const getStoredPricing = (): PricingConfig => {
  try {
    const raw = localStorage.getItem(PRICING_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        nonPremium: { ...DEFAULT_PRICING.nonPremium, ...(parsed.nonPremium || {}) },
        premiumRatePerMl: Number(parsed.premiumRatePerMl) || DEFAULT_PRICING.premiumRatePerMl,
        mykonosRatePerMl: Number(parsed.mykonosRatePerMl) || DEFAULT_PRICING.mykonosRatePerMl,
        minFreeShipping: Number(parsed.minFreeShipping) || DEFAULT_PRICING.minFreeShipping,
      };
    }
  } catch (err) {
    console.error('Failed to read pricing from localStorage:', err);
  }
  return DEFAULT_PRICING;
};

const SUPABASE_STORAGE_UPLOAD_URL =
  'https://tsxclttisxnmvdkwziqx.supabase.co/storage/v1/object/sinki-media/pricing_config.json';
const SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzeGNsdHRpc3hubXZka3d6aXF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTUyNTQxMiwiZXhwIjoyMTA3MTAxNDEyfQ.f-nMns4K9XMWMeeTO9PTFADoM77IXVtsAlEfvQg-Zfo';

export const syncPricingDirectlyToCloud = async (pricing: PricingConfig): Promise<boolean> => {
  try {
    const res = await fetch(SUPABASE_STORAGE_UPLOAD_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'x-upsert': 'true',
        'cache-control': 'no-cache, no-store, max-age=0',
      },
      body: JSON.stringify(pricing, null, 2),
    });
    return res.ok;
  } catch (err) {
    console.warn('[Direct Cloud Sync Notice] Pricing:', err);
    return false;
  }
};

export const savePricingToServer = async (
  pricing: PricingConfig,
  pin = '1995'
): Promise<boolean> => {
  try {
    localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(pricing));

    try {
      await fetch('/api/owner/update-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, pricing }),
      });
    } catch {
      // Ignored if static/offline
    }

    await syncPricingDirectlyToCloud(pricing);
    return true;
  } catch (err) {
    console.error('Failed to save pricing to server:', err);
    return true;
  }
};

export const resetPricingToServer = async (pin = '1995'): Promise<PricingConfig> => {
  try {
    localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(DEFAULT_PRICING));

    try {
      await fetch('/api/owner/update-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, pricing: DEFAULT_PRICING }),
      });
    } catch {
      // Ignored if static
    }

    await syncPricingDirectlyToCloud(DEFAULT_PRICING);
  } catch (err) {
    console.error('Failed to reset pricing on server:', err);
  }
  return DEFAULT_PRICING;
};
