// Utility to manage, calculate, and persist SINKI Sales & Profit Records
import { getOwnerToken } from './assetStorage';
import { PerfumeItem, getStoredPerfumes } from './perfumeStorage';
import { getStoredPricing } from './pricingStorage';

export type PerfumePriceGroup = 'regular' | 'viral_hits' | 'new_trending';

// Tabel Harga Modal Resmi (HPP) sesuai instruksi Owner SINKI
export const COST_PRICE_TABLE: Record<PerfumePriceGroup, Record<number, number>> = {
  // 1. Grup 4 Kategori (Daily Fresh, Professional, Attraction, Luxury)
  regular: {
    10: 12000,
    15: 18000,
    20: 22000,
    30: 30000,
    50: 45000,
    100: 90000,
  },
  // 2. Grup Viral Hits
  viral_hits: {
    10: 20000,
    15: 30000,
    20: 40000,
    30: 60000,
    50: 100000,
    100: 200000,
  },
  // 3. Grup New Trending
  new_trending: {
    10: 30000,
    15: 45000,
    20: 60000,
    30: 90000,
    50: 150000, // Disesuaikan proporsional dari 15.000 ke 150.000
    100: 300000,
  },
};

export interface SaleRecord {
  id: string;
  date: string; // ISO String: "2026-11-04T14:30:00.000Z"
  perfumeId: string;
  perfumeName: string;
  categoryGroup: PerfumePriceGroup;
  categoryLabel: string;
  volumeMl: number;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  totalSellingPrice: number;
  totalCostPrice: number;
  netProfit: number;
  channel: 'whatsapp' | 'web' | 'marketplace' | 'offline';
  customerName?: string;
  note?: string;
}

const SALES_STORAGE_KEY = 'sinki_sales_records_v1';
const SUPABASE_STORAGE_BASE = 'https://tsxclttisxnmvdkwziqx.supabase.co/storage/v1/object/public/sinki-media/';
const SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzeGNsdHRpc3hubXZka3d6aXF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTUyNTQxMiwiZXhwIjoyMTA3MTAxNDEyfQ.f-nMns4K9XMWMeeTO9PTFADoM77IXVtsAlEfvQg-Zfo';

/**
 * Mendeteksi kelompok harga dari suatu varian parfum
 */
export function resolvePerfumePriceGroup(perfume?: PerfumeItem | null): PerfumePriceGroup {
  if (!perfume) return 'regular';
  const cats = perfume.collectionCategories || [];
  if (cats.includes('new_trending')) return 'new_trending';
  if (cats.includes('viral_hits')) return 'viral_hits';
  return 'regular';
}

/**
 * Menghitung harga modal default (HPP) berdasarkan kelompok harga dan ukuran ml
 */
export function getCostPrice(group: PerfumePriceGroup, volumeMl: number): number {
  const table = COST_PRICE_TABLE[group] || COST_PRICE_TABLE.regular;
  if (table[volumeMl] !== undefined) {
    return table[volumeMl];
  }
  // Estimasi pro-rata jika ukuran kustom
  const ratePerMl =
    group === 'new_trending' ? 3000 : group === 'viral_hits' ? 2000 : 1000;
  return Math.round(volumeMl * ratePerMl);
}

/**
 * Menghitung harga jual default website berdasarkan kelompok harga dan ukuran ml
 */
export function getDefaultSellingPrice(group: PerfumePriceGroup, volumeMl: number): number {
  const pricing = getStoredPricing();
  if (group === 'new_trending') {
    const rate = pricing.premiumRatePerMl || 4000;
    return volumeMl * rate;
  }
  if (group === 'viral_hits') {
    const rate = pricing.mykonosRatePerMl || 3000;
    return volumeMl * rate;
  }
  // Regular fixed price table
  const regTable = pricing.nonPremium || {
    10: 17000,
    15: 25000,
    20: 30000,
    30: 39000,
    50: 59000,
    100: 115000,
  };
  if (regTable[volumeMl] !== undefined) {
    return regTable[volumeMl];
  }
  return volumeMl * 1300;
}

/**
 * Membaca data penjualan yang tersimpan di localStorage
 */
export function getStoredSales(): SaleRecord[] {
  try {
    const raw = localStorage.getItem(SALES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Menyimpan data penjualan ke localStorage & broadcast event
 */
export function saveSalesToLocalStorage(sales: SaleRecord[]): void {
  try {
    localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(sales));
    window.dispatchEvent(new CustomEvent('sinki_sales_updated', { detail: sales }));
  } catch (err) {
    console.error('Failed saving sales locally:', err);
  }
}

/**
 * Mengambil data penjualan terbaru dari server dan Supabase
 */
export async function fetchSalesFromServer(): Promise<SaleRecord[]> {
  try {
    const res = await fetch(`/api/sales?t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        saveSalesToLocalStorage(data);
        return data;
      }
    }
  } catch {
    // Fallback jika offline
  }

  // Coba langsung dari Supabase Storage public CDN jika backend server sedang sibuk
  try {
    const cloudRes = await fetch(`${SUPABASE_STORAGE_BASE}sales_records.json?t=${Date.now()}`, {
      cache: 'no-store',
    });
    if (cloudRes.ok) {
      const data = await cloudRes.json();
      if (Array.isArray(data)) {
        saveSalesToLocalStorage(data);
        return data;
      }
    }
  } catch {}

  return getStoredSales();
}

/**
 * Mencatat transaksi penjualan baru ke server & cloud
 */
export async function recordSaleToServer(
  sale: Omit<SaleRecord, 'id' | 'date'>,
  pin = '1995'
): Promise<{ success: boolean; sales: SaleRecord[]; error?: string }> {
  const newSale: SaleRecord = {
    ...sale,
    id: `sale-${Date.now()}`,
    date: new Date().toISOString(),
  };

  const current = getStoredSales();
  const updated = [newSale, ...current];
  saveSalesToLocalStorage(updated);

  const token = getOwnerToken();

  try {
    const res = await fetch('/api/owner/record-sale', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ pin, token, sale: newSale }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.sales && Array.isArray(json.sales)) {
        saveSalesToLocalStorage(json.sales);
        return { success: true, sales: json.sales };
      }
    }
  } catch (err) {
    console.warn('Notice syncing sale to server:', err);
  }

  // Direct Supabase Storage Cloud Backup
  try {
    await fetch(`https://tsxclttisxnmvdkwziqx.supabase.co/storage/v1/object/sinki-media/sales_records.json`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'x-upsert': 'true',
      },
      body: JSON.stringify(updated, null, 2),
    });
  } catch (syncErr) {
    console.warn('Notice syncing sales to Supabase cloud:', syncErr);
  }

  return { success: true, sales: updated };
}

/**
 * Menghapus satu data transaksi penjualan
 */
export async function deleteSaleFromServer(
  saleId: string,
  pin = '1995'
): Promise<{ success: boolean; sales: SaleRecord[] }> {
  const current = getStoredSales();
  const updated = current.filter((s) => s.id !== saleId);
  saveSalesToLocalStorage(updated);

  const token = getOwnerToken();

  try {
    const res = await fetch('/api/owner/delete-sale', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ pin, token, id: saleId }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.sales && Array.isArray(json.sales)) {
        saveSalesToLocalStorage(json.sales);
        return { success: true, sales: json.sales };
      }
    }
  } catch (err) {
    console.warn('Notice deleting sale on server:', err);
  }

  // Sync update ke Supabase Storage
  try {
    await fetch(`https://tsxclttisxnmvdkwziqx.supabase.co/storage/v1/object/sinki-media/sales_records.json`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'x-upsert': 'true',
      },
      body: JSON.stringify(updated, null, 2),
    });
  } catch {}

  return { success: true, sales: updated };
}

/**
 * Mengunduh laporan penjualan dalam format CSV yang kompatibel 100% dengan Microsoft Excel & Google Sheets
 */
export function exportSalesToCsv(sales: SaleRecord[], filterMonthKey?: string): void {
  let targetSales = sales;
  let filename = 'Laporan_Penjualan_SINKI_Semua_Periode.csv';

  if (filterMonthKey) {
    targetSales = sales.filter((s) => s.date.startsWith(filterMonthKey));
    filename = `Laporan_Penjualan_SINKI_${filterMonthKey}.csv`;
  }

  if (targetSales.length === 0) {
    alert('Tidak ada data penjualan pada periode ini untuk diunduh.');
    return;
  }

  const headers = [
    'No',
    'Tanggal',
    'Waktu',
    'Nama Varian Parfum',
    'Kategori',
    'Ukuran (ml)',
    'Jumlah (Botol)',
    'Harga Jual Satuan (Rp)',
    'Modal Satuan (Rp)',
    'Total Penjualan / Omzet (Rp)',
    'Total Modal / HPP (Rp)',
    'Laba Bersih (Rp)',
    'Saluran / Channel',
    'Nama Pembeli',
    'Catatan',
  ];

  const rows = targetSales.map((s, idx) => {
    const d = new Date(s.date);
    const dateFormatted = d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const timeFormatted = d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const clean = (val: any) => `"${String(val || '').replace(/"/g, '""')}"`;

    return [
      idx + 1,
      clean(dateFormatted),
      clean(timeFormatted),
      clean(s.perfumeName),
      clean(s.categoryLabel),
      s.volumeMl,
      s.quantity,
      s.unitPrice,
      s.unitCost,
      s.totalSellingPrice,
      s.totalCostPrice,
      s.netProfit,
      clean(s.channel === 'whatsapp' ? 'WhatsApp Order' : s.channel),
      clean(s.customerName || '-'),
      clean(s.note || '-'),
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
