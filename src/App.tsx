import React, { useState, useRef, useEffect } from 'react';
import { DimensiSinkiScreen } from './components/DimensiSinkiScreen';
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
  getStoredHeroBottles,
  getStoredHeroStageEffect,
  getStoredHeroStageEnabled,
  HeroStageEffect,
  fetchServerAssets,
} from './utils/assetStorage';
import { PricingConfig, getStoredPricing } from './utils/pricingStorage';
import { TickerConfig, getStoredTicker, fetchTickerFromServer } from './utils/tickerStorage';
import { recordVisit } from './utils/analyticsStorage';
import {
  SocialLinks,
  getStoredSocialLinks,
  fetchSocialLinksFromServer,
} from './utils/socialStorage';
import {
  Top11Item,
  getStoredTopPerfumes,
  fetchTopPerfumesFromServer,
} from './utils/topPerfumesStorage';
import {
  PerfumeItem,
  getStoredPerfumes,
  fetchPerfumesFromServer,
} from './utils/perfumeStorage';
import { fetchArticlesFromServer } from './utils/articleStorage';

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
  const [heroBottles, setHeroBottles] = useState<string[]>(() => getStoredHeroBottles());
  const [heroStageEffect, setHeroStageEffect] = useState<HeroStageEffect>(() => getStoredHeroStageEffect());
  const [heroStageEnabled, setHeroStageEnabled] = useState<boolean>(() => getStoredHeroStageEnabled());
  const [pricing, setPricing] = useState<PricingConfig>(() => getStoredPricing());
  const [tickerConfig, setTickerConfig] = useState<TickerConfig>(() => getStoredTicker());
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(() => getStoredSocialLinks());
  const [perfumes, setPerfumes] = useState<PerfumeItem[]>(() => getStoredPerfumes());
  const [topPerfumes, setTopPerfumes] = useState<Top11Item[]>(() => getStoredTopPerfumes());

  // Modals & Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [collectionScrollTrigger, setCollectionScrollTrigger] = useState(0);
  const [selectedPerfumeForOrder, setSelectedPerfumeForOrder] = useState<{ name: string; category?: string } | null>(null);
  const [reviewTargetVariant, setReviewTargetVariant] = useState<string | null>(null);

  useEffect(() => {
    // Preload initial stored Top 11 photos immediately into browser cache
    Object.values(top11Photos).forEach((photoUrl) => {
      if (photoUrl && typeof photoUrl === 'string') {
        const preloadImg = new Image();
        preloadImg.src = photoUrl;
      }
    });

    // Preload hero 3D bottles
    heroBottles.forEach((bottleUrl) => {
      if (bottleUrl && typeof bottleUrl === 'string') {
        const preloadImg = new Image();
        preloadImg.src = bottleUrl;
      }
    });

    // Sync ticker config from server immediately
    fetchTickerFromServer().then((cfg) => {
      if (cfg) setTickerConfig(cfg);
    });

    // Sync social links from server immediately
    fetchSocialLinksFromServer().then((links) => {
      if (links) setSocialLinks(links);
    });

    // Sync top bestseller perfumes from server/cloud immediately
    fetchTopPerfumesFromServer()
      .then((items) => {
        if (Array.isArray(items) && items.length > 0) {
          setTopPerfumes(items);
        }
      })
      .catch(() => {});

    // Sync full perfumes catalog from server/cloud immediately
    fetchPerfumesFromServer()
      .then((items) => {
        if (Array.isArray(items) && items.length > 0) {
          setPerfumes(items);
        }
      })
      .catch(() => {});

    // Sync articles from server/cloud immediately
    fetchArticlesFromServer().catch(() => {});

    // Sync with server on initial load (includes ticker, logo, chibi, qris, pricing, hero bottles & stage effect)
    fetchServerAssets().then((assets) => {
      if (assets.logo) setCustomLogo(assets.logo);
      if (assets.chibi) setCustomChibi(assets.chibi);
      if (assets.qrisImage) setCustomQris(assets.qrisImage);
      if (assets.top11) {
        setTop11Photos(assets.top11);
        Object.values(assets.top11).forEach((photoUrl) => {
          if (photoUrl && typeof photoUrl === 'string') {
            const preloadImg = new Image();
            preloadImg.src = photoUrl;
          }
        });
      }
      if (assets.heroBottles && assets.heroBottles.length > 0) {
        setHeroBottles(assets.heroBottles);
        assets.heroBottles.forEach((bottleUrl) => {
          if (bottleUrl && typeof bottleUrl === 'string') {
            const preloadImg = new Image();
            preloadImg.src = bottleUrl;
          }
        });
      }
      if (assets.heroStageEffect) setHeroStageEffect(assets.heroStageEffect);
      if (typeof assets.heroStageEnabled === 'boolean') setHeroStageEnabled(assets.heroStageEnabled);
      if (assets.pricing) setPricing(assets.pricing);
      if (assets.ticker) setTickerConfig(assets.ticker);
    });

    const handleTopPerfumesEvent = (e: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setTopPerfumes(e.detail);
      } else {
        setTopPerfumes(getStoredTopPerfumes());
      }
    };

    const handlePerfumesEvent = (e: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setPerfumes(e.detail);
      } else {
        setPerfumes(getStoredPerfumes());
      }
    };

    window.addEventListener('sinki_top_perfumes_updated', handleTopPerfumesEvent);
    window.addEventListener('sinki_perfumes_updated', handlePerfumesEvent);

    // Auto-refresh public data when visitor returns to tab or every 30s
    const handleLiveRefresh = () => {
      if (!document.hidden) {
        fetchTickerFromServer().then((cfg) => {
          if (cfg) setTickerConfig(cfg);
        });
        fetchSocialLinksFromServer().then((links) => {
          if (links) setSocialLinks(links);
        });
        fetchPerfumesFromServer().then((items) => {
          if (Array.isArray(items) && items.length > 0) setPerfumes(items);
        });
        fetchTopPerfumesFromServer().then((items) => {
          if (Array.isArray(items) && items.length > 0) setTopPerfumes(items);
        });
      }
    };
    window.addEventListener('focus', handleLiveRefresh);
    document.addEventListener('visibilitychange', handleLiveRefresh);
    const tickerInterval = setInterval(handleLiveRefresh, 30000);

    return () => {
      window.removeEventListener('sinki_top_perfumes_updated', handleTopPerfumesEvent);
      window.removeEventListener('sinki_perfumes_updated', handlePerfumesEvent);
      window.removeEventListener('focus', handleLiveRefresh);
      document.removeEventListener('visibilitychange', handleLiveRefresh);
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
          perfumes={perfumes}
          socialLinks={socialLinks}
          heroBottles={heroBottles}
          heroStageEffect={heroStageEffect}
          heroStageEnabled={heroStageEnabled}
          onAssetsUpdated={(newLogo, newChibi) => {
            setCustomLogo(newLogo);
            setCustomChibi(newChibi);
          }}
          onQrisUpdated={(newQris) => {
            setCustomQris(newQris);
          }}
          onHeroBottlesUpdated={(updatedBottles) => {
            setHeroBottles(updatedBottles);
          }}
          onHeroStageEffectUpdated={(effect) => {
            setHeroStageEffect(effect);
          }}
          onHeroStageEnabledUpdated={(enabled) => {
            setHeroStageEnabled(enabled);
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
          onPerfumesUpdated={(newList) => {
            setPerfumes(newList);
          }}
          onSocialLinksUpdated={(newLinks) => {
            setSocialLinks(newLinks);
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
        className="relative w-full max-w-md h-full md:h-[92dvh] md:max-h-[880px] bg-gradient-to-b from-[#181b26] via-[#141620] to-[#10121a] md:rounded-[36px] md:border md:border-amber-500/25 md:shadow-[0_20px_70px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden"
      >
        {/* Subtle Top Notch Line for App Realism on Desktop */}
        <div className="hidden md:flex justify-center pt-2 pb-1 shrink-0">
          <div className="w-20 h-1 rounded-full bg-white/15" />
        </div>

        {/* Stable Tab Views Container (Bebas Efek Geser/Swipe Horizontal) */}
        <div className="relative flex-1 w-full h-full overflow-hidden">
          {/* View 1: Home Screen */}
          <div className={`w-full h-full ${activeTab === 'home' ? 'block' : 'hidden'}`}>
            <HomeScreen
              onShowToast={showToast}
              onNavigateToCollection={() => setActiveTab('collection')}
              onOpenDrawer={() => setIsDrawerOpen(true)}
              onOpenOwnerPin={() => setIsPinModalOpen(true)}
              customLogo={customLogo}
              customChibi={customChibi}
              heroBottles={heroBottles}
              heroStageEffect={heroStageEffect}
              heroStageEnabled={heroStageEnabled}
              tickerConfig={tickerConfig}
              socialLinks={socialLinks}
            />
          </div>

          {/* View 2: Collection (Grid 2x2 with all active variants) */}
          <div className={`w-full h-full ${activeTab === 'collection' ? 'block' : 'hidden'}`}>
            <CollectionScreen
              onBackToHome={() => setActiveTab('home')}
              onShowToast={showToast}
              scrollToTopTrigger={collectionScrollTrigger}
              perfumes={perfumes}
              onSelectPerfumeToOrder={(perfume) => {
                setSelectedPerfumeForOrder({ name: perfume.name, category: perfume.category });
                setActiveTab('order');
                showToast(`Varian "${perfume.name}" dipilih! Silakan tentukan ukuran botol`);
              }}
            />
          </div>

          {/* View 3: Top 11 (Clean showcase with NO owner mode badge or camera icons) */}
          <div className={`w-full h-full ${activeTab === 'top11' ? 'block' : 'hidden'}`}>
            <Top11Screen
              isActive={activeTab === 'top11'}
              top11Photos={top11Photos}
              onBackToHome={() => setActiveTab('home')}
              onShowToast={showToast}
              pricing={pricing}
            />
          </div>

          {/* View 4: Order (Complete Checkout & WhatsApp Consultation) */}
          <div className={`w-full h-full ${activeTab === 'order' ? 'block' : 'hidden'}`}>
            <OrderScreen
              onBackToHome={() => setActiveTab('home')}
              onShowToast={showToast}
              pricing={pricing}
              customQris={customQris}
              topPerfumes={topPerfumes}
              selectedPerfumeFromCollection={selectedPerfumeForOrder}
            />
          </div>

          {/* View 5: Review (Authentic Ratings & Interactive User Reviews) */}
          <div className={`w-full h-full ${activeTab === 'review' ? 'block' : 'hidden'}`}>
            <ReviewScreen
              onBackToHome={() => setActiveTab('home')}
              onNavigateToOrder={() => setActiveTab('order')}
              onShowToast={showToast}
              initialVariant={reviewTargetVariant}
              onClearTargetVariant={() => setReviewTargetVariant(null)}
            />
          </div>
        </div>

        {/* Hamburger Menu Drawer (Clean public links only) */}
        <DrawerMenu
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onNavigateToCollection={() => setActiveTab('collection')}
          socialLinks={socialLinks}
          onOpenDimensiSinki={() => {
            window.history.pushState({}, '', '/dimensi-sinki');
            setIsDimensiRoute(true);
          }}
        />

        {/* Secret Owner PIN Modal (Triggered strictly by tapping logo 5x) */}
        <PinModal
          isOpen={isPinModalOpen}
          onClose={() => setIsPinModalOpen(false)}
          onSuccess={handlePinSuccess}
          onShowToast={showToast}
        />

        {/* Secret Owner Panel (Manages Logo, Backdrop, 3D Bottles, QRIS, Top 11, & Custom Pricing) */}
        <AssetUploadModal
          isOpen={isAssetModalOpen}
          onClose={() => setIsAssetModalOpen(false)}
          currentLogo={customLogo}
          currentChibi={customChibi}
          currentQris={customQris}
          top11Photos={top11Photos}
          heroBottles={heroBottles}
          heroStageEffect={heroStageEffect}
          pricing={pricing}
          onAssetsUpdated={(newLogo, newChibi) => {
            setCustomLogo(newLogo);
            setCustomChibi(newChibi);
          }}
          onQrisUpdated={(newQris) => {
            setCustomQris(newQris);
          }}
          onHeroBottlesUpdated={(updatedBottles) => {
            setHeroBottles(updatedBottles);
          }}
          onHeroStageEffectUpdated={(effect) => {
            setHeroStageEffect(effect);
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
