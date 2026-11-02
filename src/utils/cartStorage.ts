import { getStoredPricing } from './pricingStorage';

export const COLLECTION_BOTTLE_SIZES = [10, 20, 30, 50, 100] as const;
export type CollectionBottleSize = (typeof COLLECTION_BOTTLE_SIZES)[number];

export const COLLECTION_FIXED_PRICES: Record<CollectionBottleSize, number> = {
  10: 17000,
  20: 25000,
  30: 39000,
  50: 59000,
  100: 115000,
};

export function getPerfumeBottleUnitPrice(
  size: CollectionBottleSize,
  perfume?: { collectionCategories?: string[]; pricePerMl?: number } | null
): number {
  const cats = perfume?.collectionCategories || [];
  if (cats.includes('new_trending')) {
    const pricing = getStoredPricing();
    return size * (pricing.premiumRatePerMl || 4000);
  }
  if (cats.includes('viral_hits')) {
    const pricing = getStoredPricing();
    return size * (pricing.mykonosRatePerMl || 3000);
  }
  return COLLECTION_FIXED_PRICES[size];
}

export interface CartItem {
  id: string;
  perfumeId: string;
  name: string;
  size: CollectionBottleSize;
  unitPrice: number;
  quantity: number;
}

const CART_STORAGE_KEY = 'sinki_cart_items_v1';

export function getStoredCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item: any) =>
          item &&
          typeof item.name === 'string' &&
          COLLECTION_BOTTLE_SIZES.includes(Number(item.size) as CollectionBottleSize) &&
          Number(item.quantity) > 0
      )
      .map((item: any) => {
        const size = Number(item.size) as CollectionBottleSize;
        const storedUnitPrice = Number(item.unitPrice);
        const resolvedUnitPrice =
          storedUnitPrice > 0 ? storedUnitPrice : COLLECTION_FIXED_PRICES[size];
        return {
          id: String(item.id || `${item.perfumeId || item.name}-${size}`),
          perfumeId: String(item.perfumeId || item.name),
          name: item.name,
          size,
          unitPrice: resolvedUnitPrice,
          quantity: Math.max(1, Math.floor(Number(item.quantity))),
        };
      });
  } catch {
    return [];
  }
}

export function saveCartToStorage(items: CartItem[]): void {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('sinki_cart_updated', { detail: items }));
  } catch (err) {
    console.error('Failed to save cart:', err);
  }
}

export function addToCart(params: {
  perfumeId: string;
  name: string;
  size: CollectionBottleSize;
  quantity?: number;
  unitPrice?: number;
}): CartItem[] {
  const { perfumeId, name, size } = params;
  const qtyToAdd = Math.max(1, Math.floor(params.quantity ?? 1));
  const unitPrice =
    params.unitPrice && params.unitPrice > 0
      ? params.unitPrice
      : COLLECTION_FIXED_PRICES[size];
  const itemId = `${perfumeId}-${size}`;

  const current = getStoredCart();
  const existingIdx = current.findIndex((c) => c.id === itemId);

  let updated: CartItem[];
  if (existingIdx >= 0) {
    updated = current.map((item, idx) =>
      idx === existingIdx
        ? { ...item, unitPrice, quantity: item.quantity + qtyToAdd }
        : item
    );
  } else {
    updated = [
      ...current,
      {
        id: itemId,
        perfumeId,
        name,
        size,
        unitPrice,
        quantity: qtyToAdd,
      },
    ];
  }

  saveCartToStorage(updated);
  return updated;
}

export function updateCartItemQuantity(id: string, delta: number): CartItem[] {
  const current = getStoredCart();
  const updated = current
    .map((item) =>
      item.id === id ? { ...item, quantity: item.quantity + delta } : item
    )
    .filter((item) => item.quantity > 0);

  saveCartToStorage(updated);
  return updated;
}

export function removeFromCart(id: string): CartItem[] {
  const current = getStoredCart();
  const updated = current.filter((item) => item.id !== id);
  saveCartToStorage(updated);
  return updated;
}

export function clearCart(): CartItem[] {
  saveCartToStorage([]);
  return [];
}

export function getCartTotalCount(items: CartItem[]): number {
  return items.reduce((acc, item) => acc + item.quantity, 0);
}

export function getCartSubtotal(items: CartItem[]): number {
  return items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
}
