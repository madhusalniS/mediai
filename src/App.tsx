import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DetectedFaceResult,
  LiveCounters,
  RegisteredPerson,
  SecurityAlert,
  ZoneId,
} from './types';
import { HOSPITAL_ZONES } from './constants/zones';
import {
  loadFaceApiModels,
  extractFaceDescriptorFromImage,
} from './services/faceApi';
import {
  getStoredPersons,
  savePersons,
  calculateLiveCounters,
  getStoredSessionUnknowns,
  setStoredSessionUnknowns,
  getStoredAlerts,
  addSecurityAlert,
  acknowledgeAlert,
  clearAlerts,
  getStoredTheme,
  setStoredTheme,
  deletePerson,
  addOrUpdatePerson,
} from './services/storage';

import { SplashScreen } from './components/SplashScreen';
import { Header, ActiveTab } from './components/Header';
import { ZoneSelector } from './components/ZoneSelector';
import { CountersRibbon } from './components/CountersRibbon';
import { AlertBanner } from './components/AlertBanner';
import { ScannerView } from './components/ScannerView';
import { RegisterModal } from './components/RegisterModal';
import { DirectoryView } from './components/DirectoryView';
import { AlertsLogView } from './components/AlertsLogView';
import { PrivacyNoticeModal } from './components/PrivacyNoticeModal';
import { Footer } from './components/Footer';

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(getStoredTheme);
  const [splashActive, setSplashActive] = useState<boolean>(true);
  const [modelsReady, setModelsReady] = useState<boolean>(false);
  const [modelProgressText, setModelProgressText] = useState<string>('Initializing neural networks...');
  const [modelError, setModelError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>('scanner');
  const [selectedZone, setSelectedZone] = useState<ZoneId>('icu');

  // True database of registered personnel
  const [registeredPersons, setRegisteredPersons] = useState<RegisteredPerson[]>(getStoredPersons);
  // Session unknown detections count
  const [sessionUnknowns, setSessionUnknowns] = useState<number>(getStoredSessionUnknowns);
  // Active alerts list
  const [alerts, setAlerts] = useState<SecurityAlert[]>(getStoredAlerts);
  const [activeAlert, setActiveAlert] = useState<SecurityAlert | null>(null);

  const [isRegisterOpen, setIsRegisterOpen] = useState<boolean>(false);
  const [registerInitialThumbnail, setRegisterInitialThumbnail] = useState<string | undefined>(undefined);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState<boolean>(false);

  // Synchronized dynamic live counters computed directly from real data
  const liveCounters = useMemo<LiveCounters>(() => {
    return calculateLiveCounters(registeredPersons, sessionUnknowns, alerts);
  }, [registeredPersons, sessionUnknowns, alerts]);

  // Sync theme with HTML root class
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    setStoredTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  /**
   * Pre-extract descriptors for initial staff and visitors if not yet computed
   */
  const precomputeInitialDescriptors = useCallback(async (persons: RegisteredPerson[]) => {
    let changed = false;
    const updated = await Promise.all(
      persons.map(async (person) => {
        if (person.descriptors.length === 0 && person.photos.length > 0) {
          try {
            const res = await extractFaceDescriptorFromImage(person.photos[0]);
            if (res && res.descriptor) {
              changed = true;
              return {
                ...person,
                descriptors: [res.descriptor],
              };
            }
          } catch (e) {
            console.warn(`Could not precompute descriptor for ${person.name}:`, e);
          }
        }
        return person;
      })
    );

    if (changed) {
      savePersons(updated);
      setRegisteredPersons(updated);
    }
  }, []);

  /**
   * Initialize face-api neural weights on startup
   */
  const initializeModels = useCallback(async () => {
    try {
      setModelError(null);
      await loadFaceApiModels((msg) => setModelProgressText(msg));
      setModelsReady(true);
      setModelProgressText('Neural networks online and ready.');

      // Extract initial descriptors in background
      precomputeInitialDescriptors(registeredPersons);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to initialize face recognition model';
      setModelError(msg);
      setModelsReady(false);
    }
  }, [precomputeInitialDescriptors, registeredPersons]);

  useEffect(() => {
    initializeModels();
  }, [initializeModels]);

  /**
   * Face Detection Handler triggered by ScannerView
   */
  const handleFaceDetected = useCallback(
    (results: DetectedFaceResult[], zoneId: ZoneId) => {
      const zone = HOSPITAL_ZONES.find((z) => z.id === zoneId) || HOSPITAL_ZONES[0];
      const unknownFaces = results.filter((f) => !f.isAuthorized);

      if (unknownFaces.length > 0) {
        setSessionUnknowns((prev) => {
          const next = prev + unknownFaces.length;
          setStoredSessionUnknowns(next);
          return next;
        });

        // If unknown face detected in a RESTRICTED zone (ICU, Operation Theatre, Pharmacy)
        if (zone.isRestricted) {
          const primaryUnknown = unknownFaces[0];
          const newAlert: SecurityAlert = {
            id: `alert-${Date.now()}`,
            timestamp: new Date().toISOString(),
            zoneId: zone.id,
            zoneName: zone.name,
            reason: `Unauthorized individual detected in restricted ${zone.name}`,
            faceThumbnail: primaryUnknown.thumbnailDataUrl,
            faceCount: unknownFaces.length,
            acknowledged: false,
          };

          setActiveAlert(newAlert);
          const updatedAlerts = addSecurityAlert(newAlert);
          setAlerts(updatedAlerts);
        }
      }
    },
    []
  );

  /**
   * Reset session detection counter (ideal for internship presentations)
   */
  const handleResetSession = () => {
    setSessionUnknowns(0);
    setStoredSessionUnknowns(0);
  };

  /**
   * Open Register Modal for unknown face
   */
  const handleRegisterUnknown = (thumbnail?: string) => {
    setRegisterInitialThumbnail(thumbnail);
    setIsRegisterOpen(true);
  };

  /**
   * On person successfully registered
   */
  const handlePersonRegistered = (newPerson: RegisteredPerson) => {
    const updated = addOrUpdatePerson(newPerson);
    setRegisteredPersons(updated);

    // If active alert matches this person, acknowledge it
    if (activeAlert) {
      handleAcknowledgeAlert(activeAlert.id);
    }
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    const updated = acknowledgeAlert(alertId);
    setAlerts(updated);
    if (activeAlert?.id === alertId) {
      setActiveAlert(null);
    }
  };

  const handleClearAlerts = () => {
    clearAlerts();
    setAlerts([]);
    setActiveAlert(null);
  };

  const handleDeletePerson = (id: string) => {
    const updated = deletePerson(id);
    setRegisteredPersons(updated);
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 relative flex flex-col ${
        theme === 'dark'
          ? 'bg-slate-950 text-slate-100'
          : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className={`absolute -top-32 left-1/4 w-[600px] h-[600px] rounded-full blur-[120px] transition-opacity duration-1000 ${
            theme === 'dark' ? 'bg-teal-600/10' : 'bg-teal-500/10'
          }`}
        />
        <div
          className={`absolute top-1/2 -right-40 w-[500px] h-[500px] rounded-full blur-[140px] transition-opacity duration-1000 ${
            theme === 'dark' ? 'bg-emerald-600/10' : 'bg-emerald-500/10'
          }`}
        />
      </div>

      {/* Splash Screen */}
      {splashActive && (
        <SplashScreen
          progressText={modelProgressText}
          isReady={modelsReady}
          error={modelError}
          onRetry={initializeModels}
          onEnter={() => setSplashActive(false)}
        />
      )}

      {/* Main Top Bar */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        alertCount={alerts.filter((a) => !a.acknowledged).length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 relative z-10">
        {/* Dynamic Live Counters Ribbon (100% Real Synchronized Data) */}
        <CountersRibbon
          counters={liveCounters}
          onResetSession={handleResetSession}
          theme={theme}
        />

        {/* Restricted Zone Sound-Free Alert Banner */}
        {activeAlert && (
          <AlertBanner
            alert={activeAlert}
            onAcknowledge={handleAcknowledgeAlert}
            onRegisterUnknown={handleRegisterUnknown}
            theme={theme}
          />
        )}

        {/* Tab 1: Live Scanner View */}
        {activeTab === 'scanner' && (
          <div className="space-y-6">
            {/* Zone Selector */}
            <ZoneSelector
              selectedZone={selectedZone}
              onSelectZone={setSelectedZone}
              theme={theme}
            />

            {/* Live Camera / Photo Scanner */}
            <ScannerView
              registeredPersons={registeredPersons}
              currentZone={selectedZone}
              onFaceDetected={handleFaceDetected}
              onRegisterFace={handleRegisterUnknown}
              theme={theme}
            />
          </div>
        )}

        {/* Tab 2: Register Personnel / Visitor */}
        {activeTab === 'register' && (
          <div className="space-y-6">
            <div
              className={`p-6 rounded-2xl border ${
                theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'
              }`}
            >
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h2 className="text-base font-bold font-display">
                    Personnel &amp; Visitor Biometric Enrollment
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Register authorized doctors, nursing staff, technicians, and approved patient attendants.
                  </p>
                </div>
                <button
                  onClick={() => setIsRegisterOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-md transition-all cursor-pointer"
                >
                  Open Registration Form
                </button>
              </div>

              <div className="text-center py-12">
                <p className="text-sm text-slate-400 mb-4 max-w-md mx-auto">
                  Enroll an individual by uploading 1–3 front-facing photos or using a captured face snapshot.
                </p>
                <button
                  onClick={() => setIsRegisterOpen(true)}
                  className="px-6 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 hover:brightness-110 shadow-lg cursor-pointer transition-all"
                >
                  Start New Enrollment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Directory */}
        {activeTab === 'directory' && (
          <DirectoryView
            persons={registeredPersons}
            onDeletePerson={handleDeletePerson}
            onOpenRegister={() => setIsRegisterOpen(true)}
            theme={theme}
          />
        )}

        {/* Tab 4: Security Alerts Log */}
        {activeTab === 'alerts' && (
          <AlertsLogView
            alerts={alerts}
            onAcknowledge={handleAcknowledgeAlert}
            onClearAll={handleClearAlerts}
            onRegisterFace={handleRegisterUnknown}
            theme={theme}
          />
        )}
      </main>

      {/* Registration Modal */}
      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => {
          setIsRegisterOpen(false);
          setRegisterInitialThumbnail(undefined);
        }}
        onPersonRegistered={handlePersonRegistered}
        initialThumbnail={registerInitialThumbnail}
        theme={theme}
      />

      {/* Privacy Guarantee Modal */}
      <PrivacyNoticeModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
        theme={theme}
      />

      {/* Footer with RK Hospital Endorsement */}
      <Footer onOpenPrivacy={() => setIsPrivacyOpen(true)} theme={theme} />
    </div>
  );
}
