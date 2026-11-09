import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DimensiSinkiScreen } from './components/DimensiSinkiScreen';
import { BottomNavBar, TabType } from './components/BottomNavBar';
import { HomeScreen } from './components/HomeScreen';
import { CollectionScreen } from './components/CollectionScreen';
import { AromaMatchScreen } from './components/AromaMatchScreen';
import { OrderScreen } from './components/OrderScreen';
import { ReviewScreen } from './components/ReviewScreen';
import { PinModal } from './components/PinModal';
import { DrawerMenu } from './components/DrawerMenu';
import { Toast } from './components/Toast';
import { DesktopDeviceFrame } from './components/DesktopDeviceFrame';
import { fetchPerfumesFromServer, getStoredPerfumes, PerfumeItem } from './utils/perfumeStorage';
import { CollectionCategoryKey } from './data/perfumes';
import {
  getStoredLogo,
  getStoredChibi,
  getStoredTop11,
  getStoredQris,
  getStoredMasterFlacon,
  getStoredHeroBottles,
  getStoredHeroStageEffect,
  getStoredHeroStageEnabled,
  getStoredHeroMediaType,
  getStoredHeroVideoUrl,
  getStoredHeroVideoPoster,
  getStoredHeroVideoFit,
  getStoredHeroVideoPosition,
  getStoredHeroHeightMode,
  HeroVideoFit,
  HeroVideoPosition,
  HeroHeightMode,
  HeroStageEffect,
  fetchServerAssets,
  getOwnerToken,
  clearOwnerToken,
} from './utils/assetStorage';
import { PricingConfig, getStoredPricing } from './utils/pricingStorage';
import { TickerConfig, getStoredTicker, fetchTickerFromServer } from './utils/tickerStorage';
import { recordVisit } from './utils/analyticsStorage';
import {
  SocialLinks,
  getStoredSocialLinks,
  fetchSocialLinksFromServer,
} from './utils/socialStorage';
import { fetchTopPerfumesFromServer } from './utils/topPerfumesStorage';
import { CartItem, getStoredCart, getCartTotalCount } from './utils/cartStorage';
import {
  LuxuryThemeConfig,
  getStoredTheme,
  fetchThemeFromServer,
  applyThemeToDocument,
} from './utils/themeStorage';
import { initSoundSystem, playInteractionSound } from './utils/soundEngine';

const TABS: TabType[] = ['home', 'collection', 'match', 'order', 'review'];

const checkIsDimensi = () => {
  const p = window.location.pathname.toLowerCase();
  const h = window.location.hash.toLowerCase();
  const s = window.location.search.toLowerCase();
  return (
    p.includes('dimensi') ||
    h.includes('dimensi') ||
    s.includes('dimensi')
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isDimensiRoute, setIsDimensiRoute] = useState(checkIsDimensi);

  // Listen to popstate or url change for /dimensi-sinki
  useEffect(() => {
    const handleUrlChange = () => {
      setIsDimensiRoute(checkIsDimensi());
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Inisialisasi sistem audio interaksi SINKI (Soft Glass & Luxury Digital)
  useEffect(() => {
    const cleanupSound = initSoundSystem();
    return () => cleanupSound();
  }, []);

  // Custom User Assets, Pricing & Ticker Configuration
  const [customLogo, setCustomLogo] = useState<string | null>(getStoredLogo());
  const [customChibi, setCustomChibi] = useState<string | null>(getStoredChibi());
  const [customQris, setCustomQris] = useState<string | null>(getStoredQris());
  const [customMasterFlacon, setCustomMasterFlacon] = useState<string | null>(getStoredMasterFlacon());
  const [top11Photos, setTop11Photos] = useState<Record<string, string>>(getStoredTop11());
  const [heroBottles, setHeroBottles] = useState<string[]>(() => getStoredHeroBottles());
  const [heroStageEffect, setHeroStageEffect] = useState<HeroStageEffect>(() => getStoredHeroStageEffect());
  const [heroStageEnabled, setHeroStageEnabled] = useState<boolean>(() => getStoredHeroStageEnabled());
  const [heroMediaType, setHeroMediaType] = useState<'image' | 'video'>(() => getStoredHeroMediaType());
  const [heroVideoUrl, setHeroVideoUrl] = useState<string | null>(() => getStoredHeroVideoUrl());
  const [heroVideoPoster, setHeroVideoPoster] = useState<string | null>(() => getStoredHeroVideoPoster());
  const [heroVideoFit, setHeroVideoFit] = useState<HeroVideoFit>(() => getStoredHeroVideoFit());
  const [heroVideoPosition, setHeroVideoPosition] = useState<HeroVideoPosition>(() => getStoredHeroVideoPosition());
  const [heroHeightMode, setHeroHeightMode] = useState<HeroHeightMode>(() => getStoredHeroHeightMode());
  const [pricing, setPricing] = useState<PricingConfig>(() => getStoredPricing());
  const [tickerConfig, setTickerConfig] = useState<TickerConfig>(() => getStoredTicker());
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(() => getStoredSocialLinks());
  const [luxuryTheme, setLuxuryTheme] = useState<LuxuryThemeConfig>(() => {
    const stored = getStoredTheme();
    applyThemeToDocument(stored.id);
    return stored;
  });
  const [catalogPerfumes, setCatalogPerfumes] = useState<PerfumeItem[]>(() => getStoredPerfumes());
  const [cartItems, setCartItems] = useState<CartItem[]>(() => getStoredCart());

  useEffect(() => {
    applyThemeToDocument(luxuryTheme.id);
  }, [luxuryTheme.id]);

  useEffect(() => {
    const handleCartChange = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setCartItems(e.detail);
      } else {
        setCartItems(getStoredCart());
      }
    };
    window.addEventListener('sinki_cart_updated', handleCartChange);
    return () => window.removeEventListener('sinki_cart_updated', handleCartChange);
  }, []);

  // Modals & Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [collectionScrollTrigger, setCollectionScrollTrigger] = useState(0);
  const [collectionTargetCategory, setCollectionTargetCategory] = useState<
    CollectionCategoryKey | 'overview' | null
  >(null);
  const [selectedPerfumeForOrder, setSelectedPerfumeForOrder] = useState<{
    name: string;
    category?: string;
    pricePerMl?: number;
  } | null>(null);
  const [reviewTargetVariant, setReviewTargetVariant] = useState<string | null>(null);

  // Prioritas 100% Home di awal: Hanya render tab 'home' saat pertama kali masuk
  const [mountedTabs, setMountedTabs] = useState<Set<TabType>>(() => new Set<TabType>(['home']));

  // Langsung siapkan tab saat pengunjung menekan tombol navigasi
  useEffect(() => {
    setMountedTabs((prev) => {
      if (prev.has(activeTab)) return prev;
      const next = new Set(prev);
      next.add(activeTab);
      return next;
    });
  }, [activeTab]);

  useEffect(() => {
    // 1. Prioritaskan data Home dalam SATU batch sinkron (Hero assets, Theme, Social)
    // Menghilangkan re-render beruntun / layar berkedip berkali-kali
    Promise.allSettled([
      fetchServerAssets(),
      fetchSocialLinksFromServer(),
      fetchThemeFromServer(),
    ]).then(([assetsResult, socialResult, themeResult]) => {
      if (assetsResult.status === 'fulfilled' && assetsResult.value) {
        const assets = assetsResult.value;
        const logoVal = assets.logo;
        if (logoVal) setCustomLogo((prev) => (prev !== logoVal ? logoVal : prev));
        const chibiVal = assets.chibi;
        if (chibiVal) setCustomChibi((prev) => (prev !== chibiVal ? chibiVal : prev));
        const qrisVal = assets.qrisImage;
        if (qrisVal) setCustomQris((prev) => (prev !== qrisVal ? qrisVal : prev));
        const flaconVal = assets.masterFlacon;
        if (flaconVal) setCustomMasterFlacon((prev) => (prev !== flaconVal ? flaconVal : prev));
        if (assets.top11 && Object.keys(assets.top11).length > 0) {
          setTop11Photos((prev) => ({ ...prev, ...assets.top11 }));
        }
        if (assets.heroBottles && assets.heroBottles.length > 0) {
          setHeroBottles(assets.heroBottles);
        }
        if (assets.heroStageEffect) setHeroStageEffect(assets.heroStageEffect);
        if (assets.heroStageEnabled !== undefined) setHeroStageEnabled(assets.heroStageEnabled);
        if (assets.heroMediaType) setHeroMediaType(assets.heroMediaType);
        if (assets.heroVideoUrl) setHeroVideoUrl(assets.heroVideoUrl);
        if (assets.heroVideoPoster) setHeroVideoPoster(assets.heroVideoPoster);
        if (assets.heroVideoFit) setHeroVideoFit(assets.heroVideoFit);
        if (assets.heroVideoPosition) setHeroVideoPosition(assets.heroVideoPosition);
        if (assets.heroHeightMode) setHeroHeightMode(assets.heroHeightMode);
        if (assets.pricing) setPricing(assets.pricing);
        if (assets.ticker && assets.ticker.text) setTickerConfig(assets.ticker);
      }
      if (socialResult.status === 'fulfilled' && socialResult.value) {
        setSocialLinks(socialResult.value);
      }
      if (themeResult.status === 'fulfilled' && themeResult.value) {
        setLuxuryTheme(themeResult.value);
      }
    });

    // 2. Tunda muat 4 menu lain, katalog parfum, dan foto botol (Lazy Background Load setelah Home mulus)
    const lazyTimer = setTimeout(() => {
      // Siapkan 4 menu lain di background tanpa mengganggu Home
      setMountedTabs(new Set<TabType>(['home', 'collection', 'match', 'order', 'review']));

      // Muat katalog parfum dan bestseller di background
      fetchTopPerfumesFromServer().catch(() => {});
      fetchPerfumesFromServer()
        .then((list) => {
          if (Array.isArray(list) && list.length > 0) {
            setCatalogPerfumes(list);
          }
        })
        .catch(() => {});

      // Preload foto botol Top 11 yang valid saja (maksimal 11 botol, bukan 50 slot kosong)
      const currentTop11 = getStoredTop11();
      const validPhotos = Array.from(
        new Set(
          Object.values(currentTop11).filter(
            (url) => typeof url === 'string' && url.startsWith('http')
          )
        )
      ).slice(0, 11);

      validPhotos.forEach((photoUrl) => {
        const preloadImg = new Image();
        preloadImg.src = photoUrl;
      });

      // Preload background alam air terjun
      const preloadForest = new Image();
      preloadForest.src = '/assets/forest/sinki-forest-waterfall.jpg';
    }, 1200);

    // Auto-refresh running text every 60s without spamming on every iframe focus
    let lastRefreshTime = Date.now();
    const handleTickerRefresh = () => {
      const now = Date.now();
      // Debounce: don't refresh more often than once every 45s
      if (now - lastRefreshTime < 45000) return;
      lastRefreshTime = now;

      if (!document.hidden) {
        fetchTickerFromServer().then((cfg) => {
          if (cfg) setTickerConfig(cfg);
        });
        fetchSocialLinksFromServer().then((links) => {
          if (links) setSocialLinks(links);
        });
        fetchThemeFromServer().then((themeCfg) => {
          if (themeCfg) setLuxuryTheme(themeCfg);
        });
      }
    };
    window.addEventListener('focus', handleTickerRefresh);
    document.addEventListener('visibilitychange', handleTickerRefresh);
    const tickerInterval = setInterval(handleTickerRefresh, 60000);

    return () => {
      clearTimeout(lazyTimer);
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
        match: 'Racik Aroma',
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
  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMessage(message);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  }, []);

  const handleBackToHome = useCallback(() => {
    setActiveTab('home');
  }, []);

  const handleNavigateToOrder = useCallback((perfume: { name: string; category?: string; pricePerMl?: number }) => {
    setSelectedPerfumeForOrder({
      name: perfume.name,
      category: perfume.category,
      pricePerMl: perfume.pricePerMl,
    });
    setActiveTab('order');
  }, []);

  const activeVariantsCount = catalogPerfumes.filter((p) => p.isActive !== false).length || 68;

  return (
    <>
      <DesktopDeviceFrame
        activeVariantsCount={activeVariantsCount}
        whatsappUrl={socialLinks.whatsapp}
        themeId={luxuryTheme.id}
      >
        {/* Mobile App Container (True Smartphone View: 100% fullscreen di HP, dibungkus iPhone Pro di desktop) */}
        <main
          data-active-tab={activeTab}
          className="relative w-full h-full sinki-arch-canvas flex flex-col overflow-hidden pt-[env(safe-area-inset-top,0px)] lg:pt-0"
        >

        {/* Stable Tab Views Container (Bebas Efek Geser/Swipe Horizontal) */}
        <div className="relative z-10 flex-1 w-full h-full overflow-hidden">
          {/* View 1: Home Screen (Prioritas 100% pertama kali masuk) */}
          <div className={`w-full h-full ${activeTab === 'home' ? 'block' : 'hidden'}`}>
            <HomeScreen
              isActive={activeTab === 'home' && !isDrawerOpen && !isDimensiRoute}
              onShowToast={showToast}
              onNavigateToCollection={() => setActiveTab('collection')}
              onOpenDrawer={() => setIsDrawerOpen(true)}
              onOpenOwnerPin={() => setIsPinModalOpen(true)}
              customLogo={customLogo}
              customChibi={customChibi}
              heroBottles={heroBottles}
              heroStageEffect={heroStageEffect}
              heroStageEnabled={heroStageEnabled}
              heroMediaType={heroMediaType}
              heroVideoUrl={heroVideoUrl}
              heroVideoPoster={heroVideoPoster}
              heroVideoFit={heroVideoFit}
              heroVideoPosition={heroVideoPosition}
              heroHeightMode={heroHeightMode}
              tickerConfig={tickerConfig}
              socialLinks={socialLinks}
            />
          </div>

          {/* View 2: Collection (Lazy Background Mounted) */}
          {mountedTabs.has('collection') && (
            <div className={`w-full h-full ${activeTab === 'collection' ? 'block' : 'hidden'}`}>
              <CollectionScreen
                onBackToHome={() => setActiveTab('home')}
                onNavigateToReview={() => setActiveTab('review')}
                onShowToast={showToast}
                scrollToTopTrigger={collectionScrollTrigger}
                perfumes={catalogPerfumes}
                onCartUpdated={() => setCartItems(getStoredCart())}
                targetCategory={collectionTargetCategory}
                onClearTargetCategory={() => setCollectionTargetCategory(null)}
              />
            </div>
          )}

          {/* View 3: Aroma Match (Lazy Background Mounted) */}
          {mountedTabs.has('match') && (
            <div className={`w-full h-full ${activeTab === 'match' ? 'block' : 'hidden'}`}>
              <AromaMatchScreen
                isActiveTab={activeTab === 'match'}
                onBackToHome={handleBackToHome}
                onNavigateToOrder={handleNavigateToOrder}
                onShowToast={showToast}
                perfumes={catalogPerfumes}
                top11Photos={top11Photos}
                masterFlaconPhoto={customMasterFlacon}
              />
            </div>
          )}

          {/* View 4: Order (Lazy Background Mounted) */}
          {mountedTabs.has('order') && (
            <div className={`w-full h-full ${activeTab === 'order' ? 'block' : 'hidden'}`}>
              <OrderScreen
                onBackToHome={() => setActiveTab('home')}
                onNavigateToCollection={() => {
                  setCollectionTargetCategory('overview');
                  setActiveTab('collection');
                }}
                onNavigateToCategory={(cat) => {
                  setCollectionTargetCategory(cat);
                  setActiveTab('collection');
                }}
                onShowToast={showToast}
                pricing={pricing}
                customQris={customQris}
                cartItems={cartItems}
                selectedPerfumeFromCollection={selectedPerfumeForOrder}
                onClearSelectedPerfume={() => setSelectedPerfumeForOrder(null)}
              />
            </div>
          )}

          {/* View 5: Review (Lazy Background Mounted) */}
          {mountedTabs.has('review') && (
            <div className={`w-full h-full ${activeTab === 'review' ? 'block' : 'hidden'}`}>
              <ReviewScreen
                isActive={activeTab === 'review'}
                onBackToHome={() => setActiveTab('home')}
                onNavigateToOrder={() => setActiveTab('order')}
                onShowToast={showToast}
                initialVariant={reviewTargetVariant}
                onClearTargetVariant={() => setReviewTargetVariant(null)}
              />
            </div>
          )}
        </div>

        {/* Hamburger Menu Drawer (Clean public links only) */}
        <DrawerMenu
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onNavigateToCollection={() => setActiveTab('collection')}
          socialLinks={socialLinks}
          onOpenDimensiSinki={() => {
            const token = getOwnerToken();
            if (token) {
              window.history.pushState({}, '', '/dimensi-sinki');
              setIsDimensiRoute(true);
            } else {
              setIsPinModalOpen(true);
            }
          }}
        />

        {/* Secret Owner PIN Modal (Triggered by tapping logo 5x or via Dimensi Sinki menu, PIN: 1995) */}
        <PinModal
          isOpen={isPinModalOpen}
          onClose={() => setIsPinModalOpen(false)}
          onSuccess={handlePinSuccess}
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
          orderCount={getCartTotalCount(cartItems)}
        />
      </main>
    </DesktopDeviceFrame>

      {/* Secret Owner / Admin DimensiSinki Layer (Overlay di atas toko publik: Home & videonya tetap hidup di balik layar) */}
      {isDimensiRoute && (
        <div className="fixed inset-0 z-[60] w-full h-full bg-[#08080b] text-slate-100 flex justify-center items-center overflow-hidden">
          <DimensiSinkiScreen
            onExitToPublic={() => {
              clearOwnerToken();
              window.history.pushState({}, '', '/');
              setIsDimensiRoute(false);
            }}
            onShowToast={showToast}
            currentLogo={customLogo}
            currentChibi={customChibi}
            currentQris={customQris}
            masterFlacon={customMasterFlacon}
            top11Photos={top11Photos}
            pricing={pricing}
            tickerConfig={tickerConfig}
            perfumes={catalogPerfumes}
            socialLinks={socialLinks}
            luxuryTheme={luxuryTheme}
            heroBottles={heroBottles}
            heroStageEffect={heroStageEffect}
            heroStageEnabled={heroStageEnabled}
            heroMediaType={heroMediaType}
            heroVideoUrl={heroVideoUrl}
            heroVideoPoster={heroVideoPoster}
            heroVideoFit={heroVideoFit}
            heroVideoPosition={heroVideoPosition}
            heroHeightMode={heroHeightMode}
            onAssetsUpdated={(newLogo, newChibi) => {
              setCustomLogo(newLogo);
              setCustomChibi(newChibi);
            }}
            onQrisUpdated={(newQris) => {
              setCustomQris(newQris);
            }}
            onMasterFlaconUpdated={(url) => {
              setCustomMasterFlacon(url);
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
            onHeroVideoUpdated={(settings) => {
              if (settings.heroMediaType !== undefined) setHeroMediaType(settings.heroMediaType);
              if (settings.heroVideoUrl !== undefined) setHeroVideoUrl(settings.heroVideoUrl);
              if (settings.heroVideoPoster !== undefined) setHeroVideoPoster(settings.heroVideoPoster);
              if (settings.heroVideoFit !== undefined) setHeroVideoFit(settings.heroVideoFit);
              if (settings.heroVideoPosition !== undefined) setHeroVideoPosition(settings.heroVideoPosition);
              if (settings.heroHeightMode !== undefined) setHeroHeightMode(settings.heroHeightMode);
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
              setCatalogPerfumes(newList);
            }}
            onSocialLinksUpdated={(newLinks) => {
              setSocialLinks(newLinks);
            }}
            onThemeUpdated={(newTheme) => {
              setLuxuryTheme(newTheme);
            }}
          />
        </div>
      )}
    </>
  );
}
