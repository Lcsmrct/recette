import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X } from 'lucide-react';

const PWAInstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Vérifier si l'app est déjà installée
    const checkIfInstalled = () => {
      // PWA installée si elle fonctionne en mode standalone
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return;
      }
      
      // Ou si elle est lancée depuis l'écran d'accueil
      if (window.navigator && window.navigator.standalone) {
        setIsInstalled(true);
        return;
      }
    };

    // Détecter iOS
    const detectIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
      setIsIOS(isIOSDevice);
    };

    // Écouter l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      console.log('[PWA] beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    // Écouter l'événement appinstalled
    const handleAppInstalled = () => {
      console.log('[PWA] App installed successfully');
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    checkIfInstalled();
    detectIOS();

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      if (isIOS) {
        setShowIOSInstructions(true);
      }
      return;
    }

    try {
      const { outcome } = await deferredPrompt.prompt();
      console.log(`[PWA] Install prompt outcome: ${outcome}`);
      
      if (outcome === 'accepted') {
        setShowInstallPrompt(false);
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('[PWA] Error during installation:', error);
    }
  };

  const IOSInstructions = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-sm mx-auto shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Installer l'application
          </h3>
          <button 
            onClick={() => setShowIOSInstructions(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-3 text-sm text-gray-700">
          <div className="flex items-start space-x-3">
            <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
            <p>Appuyez sur le bouton "Partager" <span className="inline-block">📤</span> en bas de votre navigateur Safari</p>
          </div>
          
          <div className="flex items-start space-x-3">
            <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
            <p>Sélectionnez "Sur l'écran d'accueil" <span className="inline-block">➕</span></p>
          </div>
          
          <div className="flex items-start space-x-3">
            <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
            <p>Appuyez sur "Ajouter" pour installer l'application</p>
          </div>
        </div>
        
        <button 
          onClick={() => setShowIOSInstructions(false)}
          className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Compris !
        </button>
      </div>
    </div>
  );

  // Ne pas afficher si l'app est déjà installée
  if (isInstalled) {
    return null;
  }

  // Bouton compact pour les appareils qui supportent l'installation
  if (showInstallPrompt || isIOS) {
    return (
      <>
        <button
          onClick={handleInstallClick}
          className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
          title="Installer l'application sur votre appareil"
        >
          <Smartphone size={16} />
          <span className="hidden sm:inline">Installer</span>
        </button>
        
        {showIOSInstructions && <IOSInstructions />}
      </>
    );
  }

  return null;
};

export default PWAInstallButton;