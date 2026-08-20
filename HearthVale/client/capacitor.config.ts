import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hearthlightvale.hearthvale',
  appName: 'HearthVale',
  webDir: 'dist',
  backgroundColor: '#1a1520',
  ios: {
    allowsLinkPreview: false,
    backgroundColor: '#1a1520',
    contentInset: 'never',
    preferredContentMode: 'mobile',
    scrollEnabled: false,
  },
};

export default config;
