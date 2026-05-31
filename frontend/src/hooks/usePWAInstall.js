import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for PWA installation handling
 */
export const usePWAInstall = () => {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  /**
   * Handle beforeinstallprompt event
   */
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event for later use
      setInstallPrompt(e);
      setCanInstall(true);
      console.log('Install prompt available');
    };

    const handleAppInstalled = () => {
      console.log('PWA app installed');
      setIsInstalled(true);
      setCanInstall(false);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  /**
   * Install the app
   */
  const install = useCallback(async () => {
    if (!installPrompt) {
      console.warn('Install prompt not available');
      return false;
    }

    try {
      // Show the install prompt
      installPrompt.prompt();
      
      // Wait for user choice
      const { outcome } = await installPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA installation accepted');
        setCanInstall(false);
        return true;
      } else {
        console.log('PWA installation dismissed');
        return false;
      }
    } catch (error) {
      console.error('Error installing PWA:', error);
      return false;
    }
  }, [installPrompt]);

  /**
   * Check if PWA is installable
   */
  const isInstallable = () => {
    return canInstall && !isInstalled;
  };

  return {
    installPrompt,
    isInstalled,
    canInstall,
    install,
    isInstallable
  };
};

export default usePWAInstall;
