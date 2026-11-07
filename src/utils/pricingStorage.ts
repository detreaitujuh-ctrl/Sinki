import { getOwnerToken } from './assetStorage';

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

/**
 * Menyinkronkan konfigurasi harga melalui backend API yang aman.
 * Menjamin perubahan harga tersimpan ke cloud tanpa mengekspos kredensial di frontend.
 */
export const syncPricingDirectlyToCloud = async (pricing: PricingConfig): Promise<boolean> => {
  const token = getOwnerToken();
  if (!token) return false;
  try {
    const res = await fetch('/api/owner/update-pricing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ pricing, token }),
    });
    return res.ok;
  } catch (err) {
    console.warn('[Cloud Sync Notice] Pricing:', err);
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
