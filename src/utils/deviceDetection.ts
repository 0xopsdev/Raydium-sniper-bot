// Extend Window interface for wallet detection
declare global {
  interface Window {
    phantom?: {
      solana?: {
        isPhantom?: boolean;
      };
    };
    solflare?: {
      isSolflare?: boolean;
    };
    solana?: any;
  }
}

export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;

  const userAgent =
    navigator.userAgent || navigator.vendor || (window as any).opera;
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    userAgent.toLowerCase()
  );
};

export const isPWA = (): boolean => {
  if (typeof window === 'undefined') return false;

  let isInstalled: boolean = false;
  let standalone;

  if ('standalone' in window.navigator) {
    standalone = window.navigator.standalone;
  }

  if (
    window.matchMedia('(display-mode: standalone)').matches ||
    standalone === true
  ) {
    isInstalled = true;
  } else {
    // User is navigating in browser
    window.addEventListener('beforeinstallprompt', () => {
      isInstalled = false;
    });
    window.addEventListener('onappinstalled', () => {
      isInstalled = true;
    });
  }

  return isInstalled;
};

export const hasSolanaWallet = (): boolean => {
  if (typeof window === 'undefined') return false;

  // Check for Extension Wallets
  const hasExtensionWallet = !!(
    window.solana ||
    window.phantom?.solana?.isPhantom ||
    window.solflare?.isSolflare
  );

  // Check for Mobile App Wallets
  const isMobileDevice =
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
      navigator.userAgent.toLowerCase()
    );
  const hasMobileWallet =
    isMobileDevice && ('phantom' in window || 'solflare' in window);

  return hasExtensionWallet || hasMobileWallet;
};

export const getWalletType = (): 'phantom' | 'solflare' | 'other' | null => {
  if (typeof window === 'undefined') return null;

  // Check for Extension Wallets first
  if (window.phantom?.solana?.isPhantom) return 'phantom';
  if (window.solflare?.isSolflare) return 'solflare';
  if (window.solana) return 'other';

  // Check for Mobile App Wallets
  const isMobileDevice =
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
      navigator.userAgent.toLowerCase()
    );
  if (isMobileDevice) {
    if ('phantom' in window) return 'phantom';
    if ('solflare' in window) return 'solflare';
  }

  return null;
};

export const getWalletInfo = (): {
  hasExtensionWallet: boolean;
  hasMobileWallet: boolean;
  extensionWallets: string[];
  mobileWallets: string[];
  isMobile: boolean;
} => {
  if (typeof window === 'undefined') {
    return {
      hasExtensionWallet: false,
      hasMobileWallet: false,
      extensionWallets: [],
      mobileWallets: [],
      isMobile: false,
    };
  }

  const isMobileDevice =
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
      navigator.userAgent.toLowerCase()
    );

  // Check Extension Wallets
  const extensionWallets = [];
  if (window.phantom?.solana?.isPhantom) extensionWallets.push('phantom');
  if (window.solflare?.isSolflare) extensionWallets.push('solflare');
  if (window.solana) extensionWallets.push('solana');

  // Check Mobile App Wallets
  const mobileWallets = [];
  if (isMobileDevice) {
    if ('phantom' in window) mobileWallets.push('phantom');
    if ('solflare' in window) mobileWallets.push('solflare');
  }

  return {
    hasExtensionWallet: extensionWallets.length > 0,
    hasMobileWallet: mobileWallets.length > 0,
    extensionWallets,
    mobileWallets,
    isMobile: isMobileDevice,
  };
};

export const getDeepLinkUrl = (
  walletType: 'phantom' | 'solflare',
  currentUrl: string
): string => {
  const encodedUrl = encodeURIComponent(currentUrl);

  if (walletType === 'phantom') {
    return `https://phantom.app/ul/browse/${encodedUrl}`;
  } else if (walletType === 'solflare') {
    return `https://solflare.com/ul/browse/${encodedUrl}`;
  }

  return '';
};
