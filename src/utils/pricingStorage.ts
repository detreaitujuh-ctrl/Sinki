// Utility to manage, persist, and calculate perfume pricing configuration
import { getOwnerToken } from './assetStorage';

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

export const savePricingToServer = async (
  pricing: PricingConfig
): Promise<boolean> => {
  try {
    localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(pricing));

    const token = getOwnerToken();
    const res = await fetch('/api/owner/update-pricing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ token, pricing }),
    });

    return res.ok;
  } catch (err) {
    console.error('Failed to save pricing to server:', err);
    return false;
  }
};

export const resetPricingToServer = async (): Promise<PricingConfig> => {
  try {
    localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(DEFAULT_PRICING));

    const token = getOwnerToken();
    await fetch('/api/owner/update-pricing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ token, pricing: DEFAULT_PRICING }),
    });
  } catch (err) {
    console.error('Failed to reset pricing on server:', err);
  }
  return DEFAULT_PRICING;
};
