import type { AppConfig } from './lib/types';

export const APP_CONFIG_DEFAULTS: AppConfig = {
  companyName: 'TechCo',
  pageTitle: 'Welcome Page',
  pageDescription: 'A modern digital experience platform',

  supportsChatInput: true,
  supportsVideoInput: true,
  supportsScreenShare: true,
  isPreConnectBufferEnabled: true,

  logo: '/lk-logo.svg',
  accent: '#4FC3F7',
  logoDark: '/lk-logo-dark.svg',
  accentDark: '#4DB6AC',
  startButtonText: 'Start call',

  agentName: undefined,
};
