'use client';

import { FloatingBot } from '@/components/floating-bot';
import { Welcome } from '@/components/welcome';
import { VoiceSelector } from '@/components/voice-selector';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AppConfig, TTSVoice } from '@/lib/types';
import { useState } from 'react';

interface LandingPageProps {
  appConfig: AppConfig;
}

export function LandingPage({ appConfig }: LandingPageProps) {
  const [sessionStarted, setSessionStarted] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(appConfig.defaultTTSVoice || '');

  const handleStartCall = () => {
    setSessionStarted(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Welcome Screen */}
      <Welcome
        disabled={sessionStarted}
        startButtonText="Start Voice Chat"
        onStartCall={handleStartCall}
        ttsVoices={appConfig.ttsVoices}
        selectedVoice={selectedVoice}
        onVoiceChange={setSelectedVoice}
      />

      {/* Floating Bot */}
      <FloatingBot appConfig={appConfig} />
    </div>
  );
}
