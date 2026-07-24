import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy API calls to the backend during dev and E2E so the SPA can reach
    // /api/* without setting VITE_API_URL. The API client uses a relative BASE.
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks (always shared)
          if (id.includes('node_modules')) {
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/react/index') || id.includes('/react-dom/index')) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-lucide';
            }
            if (id.includes('/d3') || id.includes('/d3-') || id.includes('/d3.')) {
              return 'vendor-d3';
            }
            // Fallback: group all other vendor modules together
            return 'vendor-all';
          }

          // Shared design system components — extracted to avoid duplication
          if (id.includes('@nexus-engineering/shared') &&
              (id.includes('design-system/components') || id.includes('design-system/components/'))) {
            return 'shared-components';
          }

          // Route-based chunk grouping
          if (id.includes('/views/')) {
            const path = id.split('/views/')[1];
            if (!path) return;

            // Core views (most frequently accessed)
            if (/^(ArtifactViewer|RepositoryTree|DiscoveryDashboard|MultiRepoDashboard|GraphBuilder|Templates)/.test(path)) {
              return 'chunk-core';
            }

            // Admin views
            if (/^(AdminDashboard|RoleManagement|AuditLogViewer|PrivateRegistries|TacViewer|OrgAdmin)/.test(path)) {
              return 'chunk-admin';
            }

            // Analysis views
            if (/^(FeatureBrowser|TraceGraph|ImpactAnalysis|ImpactReport|RecommendationsPanel|NLTraceQuery|QualityDashboard|SSOSettings)/.test(path)) {
              return 'chunk-analysis';
            }

            // Auth views
            if (/^(Auth\/(Login|Register|ForgotPassword|ResetPassword)Form)/.test(path)) {
              return 'chunk-auth';
            }

            // Onboarding
            if (/^OnboardingFlow/.test(path)) {
              return 'chunk-onboarding';
            }

            // Design system demo views
            if (/^(ButtonsView|FormsView|CardsView|OverviewPlaceholder)/.test(path)) {
              return 'chunk-design-system';
            }
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
  },
});
