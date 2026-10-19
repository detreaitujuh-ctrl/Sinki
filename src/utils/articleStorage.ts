// Storage utility to manage SINKI Articles & Scent Guides
export interface ArticleItem {
  id: string;
  title: string;
  category: 'tips' | 'men' | 'women' | 'promo' | 'story';
  categoryLabel: string;
  readTime: string;
  content: string;
  date: string;
  author: string;
}

export const INITIAL_ARTICLES: ArticleItem[] = [
  {
    id: 'art-1',
    title: '3 Titik Semprot Rahasia Agar Parfum Tahan 12+ Jam',
    category: 'tips',
    categoryLabel: 'Tips Perawatan',
    readTime: '2 mnt baca',
    content:
      'Semprotkan parfum pada titik denyut nadi yang hangat: kedua sisi leher, pergelangan tangan bagian dalam, dan belakang telinga. Untuk ketahanan ekstra, oleskan sedikit lotion atau pelembap tanpa aroma sebelum menyemprotkan SINKI Eau de Parfum.',
    date: '12 Okt 2026',
    author: 'SINKI Perfumer',
  },
  {
    id: 'art-2',
    title: 'Perbedaan Eau de Parfum (EDP) vs Extrait de Parfum',
    category: 'story',
    categoryLabel: 'Edukasi Aroma',
    readTime: '3 mnt baca',
    content:
      'Eau de Parfum (EDP) memiliki konsentrasi bibit wewangian 15-20% dengan proyeksi aroma segar yang kuat. Sedangkan Extrait de Parfum memiliki konsentrasi bibit hingga 30-40% yang menghasilkan jejak aroma lebih dalam, pekat, dan bertahan seharian penuh tanpa perlu semprot ulang.',
    date: '10 Okt 2026',
    author: 'SINKI Perfumer',
  },
  {
    id: 'art-3',
    title: 'Rekomendasi Parfum Pria Terbaik untuk Acara Malam & Kencan',
    category: 'men',
    categoryLabel: 'Panduan Pria',
    readTime: '2 mnt baca',
    content:
      'Untuk suasana malam hari yang elegan dan berkarisma, pilihlah varian dengan sentuhan Warm Amber, Woody, dan Vanilla seperti Baccarat Rouge 540, Dior Sauvage Elixir, atau Creed Aventus. Karakter aromanya meninggalkan jejak tak terlupakan bagi lawan bicara.',
    date: '08 Okt 2026',
    author: 'SINKI Perfumer',
  },
];

const ARTICLES_STORAGE_KEY = 'sinki_public_articles_list';

export const getStoredArticles = (): ArticleItem[] => {
  try {
    const raw = localStorage.getItem(ARTICLES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to read articles from localStorage:', err);
  }
  return INITIAL_ARTICLES;
};

export const saveArticlesToStorage = (articles: ArticleItem[]): void => {
  try {
    localStorage.setItem(ARTICLES_STORAGE_KEY, JSON.stringify(articles));
  } catch (err) {
    console.error('Failed to save articles to localStorage:', err);
  }
};
