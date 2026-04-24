import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.eb331aad07b54cc3bf99bbebdb3eaf05',
  appName: 'Cosmos Explorer',
  webDir: 'dist',
  server: {
    url: 'https://eb331aad-07b5-4cc3-bf99-bbebdb3eaf05.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  ios: {
    contentInset: 'never',
    backgroundColor: '#0a0a0f',
  },
};

export default config;