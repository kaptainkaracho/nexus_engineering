import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { Button, Input, Card, Container, Stack, Grid, Nav } from '@nexus-engineering/shared';
import { RouteLoadingSkeleton, type RouteLoadingSkeletonProps } from '@nexus-engineering/shared';
import { Sun, Moon, Send, Heart, Trash2, User, Mail, Eye, Check, BarChart3, CheckCircle, AlertTriangle } from 'lucide-react';
import { getCurrentSession, clearSession, logout as apiLogout, type AuthUser } from './api/auth';
import { ProtectedLayout, isAdmin } from './views/Auth/ProtectedRoute';
import { AuthPage } from './views/Auth';

// Design system demo views — lazy-loaded (previously sync, moved to chunk-design-system)
const OverviewPlaceholder = lazy(() => import('./views/OverviewPlaceholder').then(m => ({ default: m.OverviewPlaceholder })));
const ButtonsView = lazy(() => import('./views/ButtonsView').then(m => ({ default: m.ButtonsView })));
const FormsView = lazy(() => import('./views/FormsView').then(m => ({ default: m.FormsView })));
const CardsView = lazy(() => import('./views/CardsView').then(m => ({ default: m.CardsView })));

// Core views — most frequently accessed (chunk-core)
const ArtifactViewer = lazy(() => import('./views/ArtifactViewer').then(m => ({ default: m.ArtifactViewer })));
const RepositoryFileTree = lazy(() => import('./views/RepositoryTree').then(m => ({ default: m.RepositoryFileTree })));
const DiscoveryDashboard = lazy(() => import('./views/DiscoveryDashboard'));
const MultiRepoDashboard = lazy(() => import('./views/MultiRepoDashboard').then(m => ({ default: m.MultiRepoDashboard })));
const GraphBuilder = lazy(() => import('./views/GraphBuilder'));
const Templates = lazy(() => import('./views/Templates'));

// Admin views (chunk-admin)
const AdminDashboard = lazy(() => import('./views/AdminDashboard'));
const RoleManagement = lazy(() => import('./views/RoleManagement'));
const AuditLogViewer = lazy(() => import('./views/AuditLogViewer'));
const PrivateRegistries = lazy(() => import('./views/PrivateRegistries'));
const TacViewer = lazy(() => import('./views/TacViewer'));
const OrgAdmin = lazy(() => import('./views/OrgAdmin'));

// Analysis views (chunk-analysis)
const FeatureBrowser = lazy(() => import('./views/FeatureBrowser').then(m => ({ default: m.FeatureBrowser })));
const TraceGraph = lazy(() => import('./views/TraceGraph'));
const ImpactAnalysis = lazy(() => import('./views/ImpactAnalysis'));
const ImpactReport = lazy(() => import('./views/ImpactReport'));
const RecommendationsPanel = lazy(() => import('./views/RecommendationsPanel').then(m => ({ default: m.RecommendationsPanel })));
const NLTraceQuery = lazy(() => import('./views/NLTraceQuery'));
const QualityDashboard = lazy(() => import('./views/QualityDashboard').then(m => ({ default: m.QualityDashboard })));
const SSOSettings = lazy(() => import('./views/SSOSettings'));
const ScimSettings = lazy(() => import('./views/ScimSettings'));

// Auth + onboarding + landing — small bundles, grouped together
const LandingPage = lazy(() => import('./views/LandingPage').then(m => ({ default: m.LandingPage })));
const OnboardingFlow = lazy(() => import('./views/OnboardingFlow').then(m => ({ default: m.OnboardingFlow })));
const GateConfigPanel = lazy(() => import('./components/trace-gate').then(m => ({ default: m.GateConfigPanel })));

// Test results (chunk-analysis family)
const TestResultsDashboard = lazy(() => import('./views/TestResultsDashboard').then(m => ({ default: m.TestResultsDashboard })));

type Section =
  | 'overview'
  | 'buttons'
  | 'forms'
  | 'cards'
  | 'artefacts'
  | 'repository'
  | 'discovery'
  | 'multi-repo'
  | 'graph'
  | 'templates'
  | 'admin'
  | 'roles'
  | 'audit-log'
  | 'registries'
  | 'tac'
  | 'test-results'
  | 'features'
  | 'trace-graph'
  | 'impact-analysis'
  | 'impact-report'
  | 'recommendations'
  | 'nl-query'
  | 'quality-dashboard'
  | 'trace-gate'
  | 'sso'
  | 'scim'
  | 'org'
  | 'landing'
  | 'onboarding';

const VALID_SECTIONS: Section[] = [
  'overview',
  'buttons',
  'forms',
  'cards',
  'artefacts',
  'repository',
  'discovery',
  'multi-repo',
  'graph',
  'templates',
  'admin',
  'sso',
  'scim',
  'org',
  'roles',
  'audit-log',
  'registries',
  'tac',
  'test-results',
  'features',
  'trace-graph',
  'impact-analysis',
  'impact-report',
  'recommendations',
  'nl-query',
  'quality-dashboard',
  'trace-gate',
  'landing',
  'onboarding',
];

const ADMIN_SUB_ROUTES: Record<string, Section> = {
  sso: 'sso',
  scim: 'scim',
  org: 'org',
  audit: 'audit-log',
};

const PRIORITY_1_HREFS = new Set(['#artefacts', '#repository', '#discovery', '#multi-repo', '#graph', '#templates']);

interface RouteState {
  section: Section;
  artifact: string | null;
}

function parseHash(hash: string): RouteState {
  const raw = hash.replace(/^#/, '');
  const [sectionPart, queryPart] = raw.split('?');
  const parts = sectionPart.split('/');
  const top = parts[0];
  const sub = parts[1];
  let section: Section;
  if (top === 'admin' && sub && ADMIN_SUB_ROUTES[sub]) {
    section = ADMIN_SUB_ROUTES[sub];
  } else if (VALID_SECTIONS.includes(top as Section)) {
    section = top as Section;
  } else {
    section = 'overview';
  }
  const artifact = queryPart ? new URLSearchParams(queryPart).get('artifact') : null;
  return { section, artifact };
}

const SKELETON_VARIANTS: Record<string, RouteLoadingSkeletonProps['variant']> = {
  'artefacts': 'grid',
  'repository': 'table',
  'discovery': 'grid',
  'multi-repo': 'grid',
  'graph': 'chart',
  'templates': 'grid',
  'admin': 'grid',
  'roles': 'table',
  'audit-log': 'table',
  'registries': 'table',
  'tac': 'table',
  'test-results': 'grid',
  'features': 'grid',
  'trace-graph': 'chart',
  'impact-analysis': 'form',
  'impact-report': 'form',
  'recommendations': 'grid',
  'nl-query': 'chart',
  'quality-dashboard': 'grid',
  'trace-gate': 'form',
  'sso': 'form',
  'scim': 'form',
  'org': 'form',
};

function SuspenseView({ children, section }: { children: React.ReactNode; section: Section }) {
  return (
    <Suspense
      fallback={
        <RouteLoadingSkeleton variant={SKELETON_VARIANTS[section] || 'default'} />
      }
    >
      {children}
    </Suspense>
  );
}

function useHoverPrefetch() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const prefetch = (href: string) => {
      const match = href.match(/^#(\w[\w-]*)$/);
      if (!match) return;
      const section = match[1] as Section;
      const sectionMap: Record<string, (() => Promise<any>) | null> = {
        artefacts: () => import('./views/ArtifactViewer').then(m => ({ default: m.ArtifactViewer })),
        repository: () => import('./views/RepositoryTree').then(m => ({ default: m.RepositoryFileTree })),
        discovery: () => import('./views/DiscoveryDashboard'),
        'multi-repo': () => import('./views/MultiRepoDashboard').then(m => ({ default: m.MultiRepoDashboard })),
        graph: () => import('./views/GraphBuilder'),
        templates: () => import('./views/Templates'),
      };
      const importer = sectionMap[section];
      if (!importer) return;
      timerRef.current = setTimeout(() => {
        importer().catch(() => {});
      }, 150);
    };

    const onMouseEnter = (e: MouseEvent) => {
      if (!(e.target instanceof Element)) return;
      const link = e.target.closest('a[href]') as HTMLAnchorElement | null;
      if (!link?.href) return;
      const href = link.getAttribute('href');
      if (!href || !PRIORITY_1_HREFS.has(href)) return;
      prefetch(href);
    };

    const onMouseLeave = (e: MouseEvent) => {
      if (!(e.target instanceof Element)) return;
      const link = e.target.closest('a[href]') as HTMLAnchorElement | null;
      if (!link?.href) return;
      const href = link.getAttribute('href');
      if (!href || !PRIORITY_1_HREFS.has(href)) return;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    document.addEventListener('mouseenter', onMouseEnter, true);
    document.addEventListener('mouseleave', onMouseLeave, true);
    return () => {
      document.removeEventListener('mouseenter', onMouseEnter, true);
      document.removeEventListener('mouseleave', onMouseLeave, true);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);
}

function App() {
  const [dark, setDark] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [deepLinkArtifact, setDeepLinkArtifact] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState<string | undefined>(undefined);
  const [rawHash, setRawHash] = useState(() => window.location.hash.replace(/^#/, ''));

  useHoverPrefetch();

  const toggleDark = () => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (e.target.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    }, 1500);
  };

  // Restore session on mount and check for reset-password token
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '');
    const [sectionPart, queryPart] = hash.split('?');
    if (sectionPart === 'reset-password' && queryPart) {
      const params = new URLSearchParams(queryPart);
      const token = params.get('token');
      if (token) {
        setResetToken(token);
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
    const session = getCurrentSession();
    if (session) {
      setUser(session.user);
    }
    setAuthReady(true);
  }, []);

  // Sync activeSection with URL hash on load and hash changes
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash;
      setRawHash(hash.replace(/^#/, ''));
      const route = parseHash(hash);
      setActiveSection(route.section);
      setDeepLinkArtifact(route.artifact);
    };
    onHashChange();
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleLogout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    window.location.hash = '';
  }, []);

  const handleAuthenticated = useCallback(() => {
    const session = getCurrentSession();
    if (session) {
      setUser(session.user);
    }
    window.location.hash = 'overview';
  }, []);

  const isUserAdmin = isAdmin();

  const navItems = [
    { label: 'Overview', href: '#overview', active: activeSection === 'overview' },
    { label: 'Buttons', href: '#buttons', active: activeSection === 'buttons' },
    { label: 'Forms', href: '#forms', active: activeSection === 'forms' },
    { label: 'Cards', href: '#cards', active: activeSection === 'cards' },
    { label: 'Artefacts', href: '#artefacts', active: activeSection === 'artefacts' },
    { label: 'Repository', href: '#repository', active: activeSection === 'repository' },
    { label: 'Discovery', href: '#discovery', active: activeSection === 'discovery' },
    { label: 'Multi-Repo', href: '#multi-repo', active: activeSection === 'multi-repo' },
    { label: 'Graph Builder', href: '#graph', active: activeSection === 'graph' },
    { label: 'Templates', href: '#templates', active: activeSection === 'templates' },
    { label: 'Audit Log', href: '#audit-log', active: activeSection === 'audit-log' },
    ...(isUserAdmin
      ? [
          { label: 'Organizations', href: '#admin', active: activeSection === 'admin' },
          { label: 'SSO Settings', href: '#admin/sso', active: activeSection === 'sso' },
          { label: 'SCIM Config', href: '#admin/scim', active: activeSection === 'scim' },
          { label: 'Org Admin', href: '#admin/org', active: activeSection === 'org' },
          { label: 'Roles', href: '#roles', active: activeSection === 'roles' },
          { label: 'Registries', href: '#registries', active: activeSection === 'registries' },
          { label: 'TAC', href: '#tac', active: activeSection === 'tac' },
          { label: 'Test Results', href: '#test-results', active: activeSection === 'test-results' },
        ]
      : []),
    { label: 'Features', href: '#features', active: activeSection === 'features' },
    { label: 'Trace Graph', href: '#trace-graph', active: activeSection === 'trace-graph' },
    { label: 'Impact Analysis', href: '#impact-analysis', active: activeSection === 'impact-analysis' },
    { label: 'Impact Report', href: '#impact-report', active: activeSection === 'impact-report' },
    { label: 'Recommendations', href: '#recommendations', active: activeSection === 'recommendations' },
    { label: 'NL Query', href: '#nl-query', active: activeSection === 'nl-query' },
    { label: 'Quality Dashboard', href: '#quality-dashboard', active: activeSection === 'quality-dashboard' },
    { label: 'Trace Gate', href: '#trace-gate', active: activeSection === 'trace-gate' },
  ];

  if (!authReady) {
    return (
      <div className="min-h-screen bg-surface-secondary">
        <header className="border-b border-border bg-surface-primary">
          <Container size="lg">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500 text-sm font-bold text-text-inverse">
                  B
                </div>
                <div>
                  <p className="text-lg font-bold text-text-primary">The Bike App</p>
                  <p className="text-sm text-text-tertiary">Design System v0.1</p>
                </div>
              </div>
            </div>
          </Container>
        </header>
        <Container size="lg">
          <p className="py-8 text-center text-text-tertiary">Loading...</p>
        </Container>
      </div>
    );
  }

  if (!user) {
    const hash = rawHash;
    if (hash === 'login' || hash === 'register' || hash.startsWith('reset-password') || hash.startsWith('forgot-password') || hash.startsWith('auth/')) {
      return <AuthPage onAuthenticated={handleAuthenticated} resetToken={resetToken} />;
    }
    return (
      <Suspense fallback={<RouteLoadingSkeleton variant="grid" />}>
        <LandingPage />
      </Suspense>
    );
  }

  if (activeSection === 'onboarding') {
    return (
      <Suspense fallback={<RouteLoadingSkeleton variant="form" />}>
        <OnboardingFlow />
      </Suspense>
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <Suspense fallback={<RouteLoadingSkeleton variant="grid" />}>
            <OverviewPlaceholder />
          </Suspense>
        );
      case 'buttons':
        return (
          <Suspense fallback={<RouteLoadingSkeleton variant="grid" />}>
            <ButtonsView />
          </Suspense>
        );
      case 'forms':
        return (
          <Suspense fallback={<RouteLoadingSkeleton variant="grid" />}>
            <FormsView />
          </Suspense>
        );
      case 'cards':
        return (
          <Suspense fallback={<RouteLoadingSkeleton variant="grid" />}>
            <CardsView />
          </Suspense>
        );
      case 'artefacts':
        return (
          <Suspense fallback={<RouteLoadingSkeleton variant="grid" />}>
            <ArtifactViewer />
          </Suspense>
        );
      case 'repository':
        return (
          <Suspense fallback={<RouteLoadingSkeleton variant="table" />}>
            <RepositoryFileTree />
          </Suspense>
        );
      case 'discovery':
        return (
          <Suspense fallback={<RouteLoadingSkeleton variant="grid" />}>
            <DiscoveryDashboard />
          </Suspense>
        );
      case 'multi-repo':
        return (
          <Suspense fallback={<RouteLoadingSkeleton variant="grid" />}>
            <MultiRepoDashboard />
          </Suspense>
        );
      case 'graph':
        return (
          <Suspense fallback={<RouteLoadingSkeleton variant="chart" />}>
            <GraphBuilder selectedId={deepLinkArtifact} />
          </Suspense>
        );
      case 'templates':
        return (
          <Suspense fallback={<RouteLoadingSkeleton variant="grid" />}>
            <Templates />
          </Suspense>
        );
      case 'admin':
        return (
          <ProtectedLayout allowedRoles={['admin']}>
            <Suspense fallback={<RouteLoadingSkeleton variant="grid" />}>
              <AdminDashboard />
            </Suspense>
          </ProtectedLayout>
        );
      case 'roles':
        return (
          <ProtectedLayout allowedRoles={['admin']}>
            <Suspense fallback={<RouteLoadingSkeleton variant="table" />}>
              <RoleManagement />
            </Suspense>
          </ProtectedLayout>
        );
      case 'audit-log':
        return (
          <Suspense fallback={<RouteLoadingSkeleton variant="table" />}>
            <AuditLogViewer />
          </Suspense>
        );
      case 'registries':
        return (
          <ProtectedLayout allowedRoles={['admin']}>
            <Suspense fallback={<RouteLoadingSkeleton variant="table" />}>
              <PrivateRegistries />
            </Suspense>
          </ProtectedLayout>
        );
      case 'tac':
        return (
          <Suspense fallback={<RouteLoadingSkeleton variant="table" />}>
            <TacViewer />
          </Suspense>
        );
      case 'test-results':
        return (
          <Suspense fallback={<RouteLoadingSkeleton variant="grid" />}>
            <TestResultsDashboard />
          </Suspense>
        );
      case 'features':
        return (
          <Suspense fallback={<RouteLoadingSkeleton variant="grid" />}>
            <FeatureBrowser />
          </Suspense>
        );
      case 'sso':
        return (
          <ProtectedLayout allowedRoles={['admin']}>
            <Suspense fallback={<RouteLoadingSkeleton variant="form" />}>
              <SSOSettings />
            </Suspense>
          </ProtectedLayout>
        );
      case 'scim':
        return (
          <ProtectedLayout allowedRoles={['admin']}>
            <Suspense fallback={<RouteLoadingSkeleton variant="form" />}>
              <ScimSettings />
            </Suspense>
          </ProtectedLayout>
        );
      case 'org':
        return (
          <ProtectedLayout allowedRoles={['admin']}>
            <Suspense fallback={<RouteLoadingSkeleton variant="form" />}>
              <OrgAdmin />
            </Suspense>
          </ProtectedLayout>
        );
      case 'trace-graph':
        return (
          <Suspense fallback={<RouteLoadingSkeleton variant="chart" />}>
            <TraceGraph />
          </Suspense>
        );
      case 'impact-analysis':
        return (
          <Suspense fallback={<RouteLoadingSkeleton variant="form" />}>
            <ImpactAnalysis />
          </Suspense>
        );
      case 'impact-report':
        return (
          <Suspense fallback={<RouteLoadingSkeleton variant="form" />}>
            <ImpactReport />
          </Suspense>
        );
      case 'recommendations':
        return (
          <Suspense fallback={<RouteLoadingSkeleton variant="grid" />}>
            <RecommendationsPanel />
          </Suspense>
        );
      case 'nl-query':
        return (
          <Suspense fallback={<RouteLoadingSkeleton variant="chart" />}>
            <NLTraceQuery />
          </Suspense>
        );
      case 'quality-dashboard':
        return (
          <Suspense fallback={<RouteLoadingSkeleton variant="grid" />}>
            <QualityDashboard />
          </Suspense>
        );
      case 'trace-gate':
        return (
          <Suspense fallback={<RouteLoadingSkeleton variant="form" />}>
            <GateConfigPanel />
          </Suspense>
        );
      default:
        return (
          <Suspense fallback={<RouteLoadingSkeleton variant="grid" />}>
            <OverviewPlaceholder />
          </Suspense>
        );
    }
  };

  const isDefaultRoute = ['overview', 'buttons', 'forms', 'cards'].includes(activeSection);

  return (
    <div className="min-h-screen bg-surface-secondary">
      <header className="border-b border-border bg-surface-primary">
        <Container size="lg">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500 text-sm font-bold text-text-inverse">
                B
              </div>
              <div>
                <p className="text-lg font-bold text-text-primary">The Bike App</p>
                <p className="text-sm text-text-tertiary">Design System v0.1</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-text-tertiary sm:inline">
                {user.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                icon={<Sun className="h-4 w-4" />}
                onClick={toggleDark}
                aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {dark ? 'Light' : 'Dark'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                aria-label="Sign out"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </Container>
      </header>

      <Container size="lg">
        {isDefaultRoute ? (
          <>
            <Nav
              items={navItems.map((item) => ({
                label: item.label,
                href: item.href,
                active: item.active,
              }))}
              variant="horizontal"
            />

            <Stack gap={12}>
              <Stack gap={4}>
                <h2 className="text-2xl font-bold text-text-primary">Button component</h2>
                <p className="text-text-secondary">
                  4 variants, 3 sizes, loading state, icon support. Uses semantic
                  tokens for dark mode compatibility.
                </p>
              </Stack>

              <Card padding="lg">
                <Stack gap={6}>
                  <Stack gap={3}>
                    <p className="text-sm font-medium text-text-tertiary uppercase tracking-wide">
                      Variants
                    </p>
                    <Stack direction="row" gap={3} wrap>
                      <Button variant="primary">Primary</Button>
                      <Button variant="secondary">Secondary</Button>
                      <Button variant="ghost">Ghost</Button>
                      <Button variant="danger">Danger</Button>
                    </Stack>
                  </Stack>

                  <Stack gap={3}>
                    <p className="text-sm font-medium text-text-tertiary uppercase tracking-wide">
                      Sizes
                    </p>
                    <Stack direction="row" gap={3} align="center">
                      <Button size="sm">Small</Button>
                      <Button size="md">Medium</Button>
                      <Button size="lg">Large</Button>
                    </Stack>
                  </Stack>

                  <Stack gap={3}>
                    <p className="text-sm font-medium text-text-tertiary uppercase tracking-wide">
                      With icons
                    </p>
                    <Stack direction="row" gap={3} wrap>
                      <Button icon={<Send className="h-4 w-4" />}>Send</Button>
                      <Button variant="secondary" icon={<Heart className="h-4 w-4" />} iconPosition="right">
                        Like
                      </Button>
                      <Button variant="ghost" icon={<Trash2 className="h-4 w-4" />}>
                        Delete
                      </Button>
                    </Stack>
                  </Stack>

                  <Stack gap={3}>
                    <p className="text-sm font-medium text-text-tertiary uppercase tracking-wide">
                      States
                    </p>
                    <Stack direction="row" gap={3} wrap>
                      <Button variant="primary" loading>
                        Loading
                      </Button>
                      <Button variant="primary" disabled>
                        Disabled
                      </Button>
                      <Button variant="secondary" disabled>
                        Disabled
                      </Button>
                      <Button variant="ghost" disabled>
                        Disabled
                      </Button>
                    </Stack>
                  </Stack>
                </Stack>
              </Card>

              <Stack gap={4}>
                <h2 className="text-2xl font-bold text-text-primary">Form components</h2>
                <p className="text-text-secondary">
                  Input with label, helper text, error state, icons, and ARIA
                  attributes. Inline validation on blur.
                </p>
              </Stack>

              <Card padding="lg">
                <Stack gap={6}>
                  <Stack gap={4}>
                    <Input
                      label="Full Name"
                      placeholder="Enter your name"
                      leftIcon={<User className="h-4 w-4" />}
                      fullWidth
                    />

                    <Input
                      label="Email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={handleEmailChange}
                      error={emailError}
                      leftIcon={<Mail className="h-4 w-4" />}
                      fullWidth
                    />

                    <Input
                      label="Password"
                      type="password"
                      placeholder="Create a password"
                      helperText="At least 8 characters"
                      rightIcon={<Eye className="h-4 w-4" />}
                      fullWidth
                    />

                    <Input
                      label="Bio"
                      placeholder="Tell us about yourself..."
                      helperText="Brief description for your profile"
                      fullWidth
                    />

                    <Input
                      label="Team (disabled)"
                      placeholder="You cannot edit this field"
                      disabled
                      fullWidth
                    />
                  </Stack>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="primary"
                      onClick={handleSubmit}
                      loading={loading}
                      disabled={submitted}
                      icon={submitted ? <Check className="h-4 w-4" /> : undefined}
                    >
                      {submitted ? 'Saved' : 'Save Profile'}
                    </Button>
                    <Button variant="ghost">Cancel</Button>
                  </div>
                </Stack>
              </Card>

              <Stack gap={4}>
                <h2 className="text-2xl font-bold text-text-primary">Card component</h2>
                <p className="text-text-secondary">
                  Three card variants: default (bordered), elevated (shadow), and outlined
                  (transparent). Use with Container, Stack, and Grid for layout.
                </p>
              </Stack>

              <Grid cols={3} gap={6}>
                <Card variant="default" padding="lg">
                  <Stack gap={3}>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-300">
                      <BarChart3 className="h-6 w-6" />
                    </div>
                    <h3 className="text-base font-semibold text-text-primary">Default</h3>
                    <p className="text-sm text-text-tertiary">
                      Bordered card with surface background. Use for standard content containers.
                    </p>
                  </Stack>
                </Card>

                <Card variant="elevated" padding="lg">
                  <Stack gap={3}>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary-50 text-secondary-600 dark:bg-secondary-950 dark:text-secondary-300">
                      <CheckCircle className="h-6 w-6" />
                    </div>
                    <h3 className="text-base font-semibold text-text-primary">Elevated</h3>
                    <p className="text-sm text-text-tertiary">
                      Shadowed card that lifts above the surface. Use for dialogs and feature highlights.
                    </p>
                  </Stack>
                </Card>

                <Card variant="outlined" padding="lg">
                  <Stack gap={3}>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning-50 text-warning-600 dark:bg-warning-950 dark:text-warning-300">
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                    <h3 className="text-base font-semibold text-text-primary">Outlined</h3>
                    <p className="text-sm text-text-tertiary">
                      Transparent background with border. Use for secondary content and sidebar sections.
                    </p>
                  </Stack>
                </Card>
              </Grid>
            </Stack>
          </>
        ) : (
          renderContent()
        )}
      </Container>
    </div>
  );
}

export default App;
