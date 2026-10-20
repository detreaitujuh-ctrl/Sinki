import { DimensiSinkiScreen } from './components/DimensiSinkiScreen';
import React, { useState, useRef, useEffect } from 'react';
import { BottomNavBar, TabType } from './components/BottomNavBar';
import { HomeScreen } from './components/HomeScreen';
import { CollectionScreen } from './components/CollectionScreen';
import { Top11Screen } from './components/Top11Screen';
import { OrderScreen } from './components/OrderScreen';
import { ReviewScreen } from './components/ReviewScreen';
import { AssetUploadModal } from './components/AssetUploadModal';
import { PinModal } from './components/PinModal';
import { DrawerMenu } from './components/DrawerMenu';
import { Toast } from './components/Toast';
import {
  getStoredLogo,
  getStoredChibi,
  getStoredTop11,
  getStoredQris,
  fetchServerAssets,
} from './utils/assetStorage';
import { PricingConfig, getStoredPricing } from './utils/pricingStorage';
import { TickerConfig, getStoredTicker, fetchTickerFromServer } from './utils/tickerStorage';
import { recordVisit } from './utils/analyticsStorage';

const TABS: TabType[] = ['home', 'collection', 'top11', 'order', 'review'];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isDimensiRoute, setIsDimensiRoute] = useState(() => {
    return (
      window.location.pathname === '/dimensi-sinki' ||
      window.location.hash === '#/dimensi-sinki' ||
      window.location.search.includes('dimensi-sinki')
    );
  });

  // Listen to popstate or url change for /dimensi-sinki
  useEffect(() => {
    const handleUrlChange = () => {
      setIsDimensiRoute(
        window.location.pathname === '/dimensi-sinki' ||
        window.location.hash === '#/dimensi-sinki' ||
        window.location.search.includes('dimensi-sinki')
      );
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Custom User Assets, Pricing & Ticker Configuration
  const [customLogo, setCustomLogo] = useState<string | null>(getStoredLogo());
  const [customChibi, setCustomChibi] = useState<string | null>(getStoredChibi());
  const [customQris, setCustomQris] = useState<string | null>(getStoredQris());
  const [top11Photos, setTop11Photos] = useState<Record<string, string>>(getStoredTop11());
  const [pricing, setPricing] = useState<PricingConfig>(() => getStoredPricing());
  const [tickerConfig, setTickerConfig] = useState<TickerConfig>(() => getStoredTicker());

  // Modals & Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [collectionScrollTrigger, setCollectionScrollTrigger] = useState(0);
  const [selectedPerfumeForOrder, setSelectedPerfumeForOrder] = useState<{ name: string; category?: string } | null>(null);

  useEffect(() => {
    // Preload initial stored Top 11 photos immediately into browser cache
    Object.values(top11Photos).forEach((photoUrl) => {
      if (photoUrl && typeof photoUrl === 'string') {
        const preloadImg = new Image();
        preloadImg.src = photoUrl;
      }
    });

    // Sync ticker config from server immediately
    fetchTickerFromServer().then((cfg) => {
      if (cfg) setTickerConfig(cfg);
    });

    // Sync with server on initial load (includes ticker, logo, chibi, qris, pricing)
    fetchServerAssets().then((assets) => {
      if (assets.logo) setCustomLogo(assets.logo);
      if (assets.chibi) setCustomChibi(assets.chibi);
      if (assets.qrisImage) setCustomQris(assets.qrisImage);
      if (assets.top11) {
        setTop11Photos(assets.top11);
        // Preload all updated bottle images in background immediately into browser cache
        Object.values(assets.top11).forEach((photoUrl) => {
          if (photoUrl && typeof photoUrl === 'string') {
            const preloadImg = new Image();
            preloadImg.src = photoUrl;
          }
        });
      }
      if (assets.pricing) setPricing(assets.pricing);
      if (assets.ticker) setTickerConfig(assets.ticker);
    });

    // Auto-refresh running text when visitor returns to tab or every 30s
    const handleTickerRefresh = () => {
      if (!document.hidden) {
        fetchTickerFromServer().then((cfg) => {
          if (cfg) setTickerConfig(cfg);
        });
      }
    };
    window.addEventListener('focus', handleTickerRefresh);
    document.addEventListener('visibilitychange', handleTickerRefresh);
    const tickerInterval = setInterval(handleTickerRefresh, 30000);

    return () => {
      window.removeEventListener('focus', handleTickerRefresh);
      document.removeEventListener('visibilitychange', handleTickerRefresh);
      clearInterval(tickerInterval);
    };
  }, []);

  // Track real visitor and page traffic
  useEffect(() => {
    if (!isDimensiRoute) {
      const pageNames: Record<TabType, string> = {
        home: 'Beranda',
        collection: 'Katalog Koleksi',
        top11: 'Top 11 Bestseller',
        order: 'Order VIP',
        review: 'Review Pembeli',
      };
      recordVisit(pageNames[activeTab] || 'Beranda');
    }
  }, [activeTab, isDimensiRoute]);

  const handlePinSuccess = () => {
    setIsPinModalOpen(false);
    window.history.pushState({}, '', '/dimensi-sinki');
    setIsDimensiRoute(true);
  };

  // Touch Swipe Gesture State (Kalibrasi Cerdas: Jarak 85px & Kunci Sumbu Vertikal)
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);
  const minSwipeDistance = 85; // Ambang batas 85px: mantap & disengaja

  const activeIndex = TABS.indexOf(activeTab);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
    touchEndX.current = null;
    touchEndY.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (
      touchStartX.current === null ||
      touchEndX.current === null ||
      touchStartY.current === null ||
      touchEndY.current === null
    ) {
      return;
    }

    const distanceX = touchStartX.current - touchEndX.current;
    const distanceY = touchStartY.current - touchEndY.current;
    const absX = Math.abs(distanceX);
    const absY = Math.abs(distanceY);

    // KUNCI SUMBU VERTIKAL (ANTI-SALAH DETEKSI):
    // Swipe HANYA diproses jika:
    // 1. Jarak horizontal minimal 85px (benar-benar niat geser).
    // 2. Gerakan horizontal minimal 1.5x lebih dominan dibanding vertikal (tidak sedang scroll atas/bawah).
    if (absX >= minSwipeDistance && absX > absY * 1.5) {
      if (distanceX > 0 && activeIndex < TABS.length - 1) {
        // Geser ke kiri -> Halaman berikutnya
        setActiveTab(TABS[activeIndex + 1]);
      } else if (distanceX < 0 && activeIndex > 0) {
        // Geser ke kanan -> Halaman sebelumnya
        setActiveTab(TABS[activeIndex - 1]);
      }
    }

    // Reset koordinat
    touchStartX.current = null;
    touchStartY.current = null;
    touchEndX.current = null;
    touchEndY.current = null;
  };

  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const showToast = (message: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMessage(message);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // JIKA SEDANG MEMBUKA RUTE RAHASIA /dimensi-sinki: TAMPILKAN DASHBOARD DIMENSI-SINKI
  if (isDimensiRoute) {
    return (
      <div className="w-full h-screen bg-[#090b10] text-slate-100 flex justify-center items-center">
        <DimensiSinkiScreen
          onExitToPublic={() => {
            window.history.pushState({}, "", "/");
            setIsDimensiRoute(false);
          }}
          onShowToast={showToast}
          currentLogo={customLogo}
          currentChibi={customChibi}
          currentQris={customQris}
          top11Photos={top11Photos}
          pricing={pricing}
          tickerConfig={tickerConfig}
          onAssetsUpdated={(newLogo, newChibi) => {
            setCustomLogo(newLogo);
            setCustomChibi(newChibi);
          }}
          onQrisUpdated={(newQris) => {
            setCustomQris(newQris);
          }}
          onTop11PhotoUpdated={(variantId, newPhoto) => {
            setTop11Photos((prev) => ({ ...prev, [variantId]: newPhoto }));
          }}
          onPricingUpdated={(newPricing) => {
            setPricing(newPricing);
          }}
          onTickerUpdated={(newTicker) => {
            setTickerConfig(newTicker);
          }}
        />
        {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
      </div>
    );
  }

  return (
    <div className="relative w-full h-[100dvh] bg-[#0e1017] flex items-center justify-center overflow-hidden font-sans selection:bg-amber-500/25">
      {/* Desktop Ambient Subtle Boutique Glow - Dibuat jauh lebih tipis */}
      <div className="hidden md:block absolute -top-40 -left-40 w-96 h-96 bg-amber-500/[0.06] rounded-full blur-[140px] pointer-events-none" />
      <div className="hidden md:block absolute -bottom-40 -right-40 w-96 h-96 bg-amber-600/[0.05] rounded-full blur-[140px] pointer-events-none" />

      {/* Mobile App Container with Deep Charcoal Graphite Canvas (Cool Neutral Dark) */}
      <main
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative w-full max-w-md h-full md:h-[92dvh] md:max-h-[880px] bg-gradient-to-b from-[#181b26] via-[#141620] to-[#10121a] md:rounded-[36px] md:border md:border-amber-500/25 md:shadow-[0_20px_70px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden"
      >
        {/* Subtle Top Notch Line for App Realism on Desktop */}
        <div className="hidden md:flex justify-center pt-2 pb-1 shrink-0">
          <div className="w-20 h-1 rounded-full bg-white/15" />
        </div>

        {/* Horizontal Sliding Views Container */}
        <div className="relative flex-1 w-full overflow-hidden">
          <div
            className="flex h-full w-[500%] transition-transform duration-300 ease-out"
            style={{
              transform: `translateX(-${activeIndex * 20}%)`,
            }}
          >
            {/* View 1: Home Screen */}
            <div className="w-[20%] h-full shrink-0">
              <HomeScreen
                onShowToast={showToast}
                onNavigateToCollection={() => setActiveTab('collection')}
                onOpenDrawer={() => setIsDrawerOpen(true)}
                onOpenOwnerPin={() => setIsPinModalOpen(true)}
                customLogo={customLogo}
                customChibi={customChibi}
                tickerConfig={tickerConfig}
              />
            </div>

            {/* View 2: Collection (Grid 2x2 with all 68 variants) */}
            <div className="w-[20%] h-full shrink-0">
              <CollectionScreen
                onBackToHome={() => setActiveTab('home')}
                onShowToast={showToast}
                scrollToTopTrigger={collectionScrollTrigger}
                onSelectPerfumeToOrder={(perfume) => {
                  setSelectedPerfumeForOrder({ name: perfume.name, category: perfume.category });
                  setActiveTab('order');
                  showToast(`Varian "${perfume.name}" dipilih! Silakan tentukan ukuran botol`);
                }}
              />
            </div>

            {/* View 3: Top 11 (Clean showcase with NO owner mode badge or camera icons) */}
            <div className="w-[20%] h-full shrink-0">
              <Top11Screen
                isActive={activeTab === 'top11'}
                top11Photos={top11Photos}
                onBackToHome={() => setActiveTab('home')}
                onShowToast={showToast}
                pricing={pricing}
              />
            </div>

            {/* View 4: Order (Complete Checkout & WhatsApp Consultation) */}
            <div className="w-[20%] h-full shrink-0">
              <OrderScreen
                onBackToHome={() => setActiveTab('home')}
                onShowToast={showToast}
                pricing={pricing}
                customQris={customQris}
                selectedPerfumeFromCollection={selectedPerfumeForOrder}
              />
            </div>

            {/* View 5: Review (Authentic Ratings & Interactive User Reviews) */}
            <div className="w-[20%] h-full shrink-0">
              <ReviewScreen
                onBackToHome={() => setActiveTab('home')}
                onNavigateToOrder={() => setActiveTab('order')}
                onShowToast={showToast}
              />
            </div>
          </div>
        </div>

        {/* Hamburger Menu Drawer (Clean public links only) */}
        <DrawerMenu
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onNavigateToCollection={() => setActiveTab('collection')}
          onOpenDimensiSinki={() => {
            window.history.pushState({}, '', '/dimensi-sinki');
            setIsDimensiRoute(true);
          }}
        />

        {/* Secret Owner PIN Modal (Triggered strictly by tapping logo 5x, PIN: 1995) */}
        <PinModal
          isOpen={isPinModalOpen}
          onClose={() => setIsPinModalOpen(false)}
          onSuccess={handlePinSuccess}
          onShowToast={showToast}
        />

        {/* Secret Owner Panel (Manages Logo, Chibi, QRIS, 11 Bestseller Bottles, & Custom Pricing) */}
        <AssetUploadModal
          isOpen={isAssetModalOpen}
          onClose={() => setIsAssetModalOpen(false)}
          currentLogo={customLogo}
          currentChibi={customChibi}
          currentQris={customQris}
          top11Photos={top11Photos}
          pricing={pricing}
          onAssetsUpdated={(newLogo, newChibi) => {
            setCustomLogo(newLogo);
            setCustomChibi(newChibi);
          }}
          onQrisUpdated={(newQris) => {
            setCustomQris(newQris);
          }}
          onTop11PhotoUpdated={(variantId, newPhoto) => {
            setTop11Photos((prev) => {
              const updated = { ...prev };
              if (newPhoto) {
                updated[variantId] = newPhoto;
              } else {
                delete updated[variantId];
              }
              return updated;
            });
          }}
          onPricingUpdated={(newPricing) => {
            setPricing(newPricing);
          }}
          onShowToast={showToast}
        />

        {/* Global Toast Notification */}
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

        {/* Fixed 5-Tab Bottom Navigation Bar */}
        <BottomNavBar
          activeTab={activeTab}
          onTabChange={(tab) => {
            if (activeTab === 'collection' && tab === 'collection') {
              setCollectionScrollTrigger((prev) => prev + 1);
            }
            setActiveTab(tab);
          }}
          orderCount={0}
        />
      </main>
    </div>
  );
}
