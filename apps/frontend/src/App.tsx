import { useState, useEffect, useCallback } from 'react';
import { Button, Input, Card, Container, Stack, Grid, Nav } from '@nexus-engineering/shared';
import { ArtifactViewer } from './views/ArtifactViewer';
import { RepositoryFileTree } from './views/RepositoryTree';
import { DiscoveryDashboard } from './views/DiscoveryDashboard';
import { MultiRepoDashboard } from './views/MultiRepoDashboard';
import { GraphBuilder } from './views/GraphBuilder';
import { Templates } from './views/Templates';
import { AuthPage } from './views/Auth';
import { ProtectedLayout, isAdmin } from './views/Auth/ProtectedRoute';
import { AdminDashboard } from './views/AdminDashboard';
import { RoleManagement } from './views/RoleManagement';
import { AuditLogViewer } from './views/AuditLogViewer';
import { PrivateRegistries } from './views/PrivateRegistries';
import { TacViewer } from './views/TacViewer';
import { TestResultsDashboard } from './views/TestResultsDashboard';
import { FeatureBrowser } from './views/FeatureBrowser';
import { TraceGraph } from './views/TraceGraph';
import { ImpactAnalysis } from './views/ImpactAnalysis';
import { ImpactReport } from './views/ImpactReport';
import { SSOSettings } from './views/SSOSettings';
import { OrgAdmin } from './views/OrgAdmin';
import { LandingPage } from './views/LandingPage';
import { OnboardingFlow } from './views/OnboardingFlow';
import { RecommendationsPanel } from './views/RecommendationsPanel';
import { NLTraceQuery } from './views/NLTraceQuery';
import {
  getCurrentSession,
  clearSession,
  logout as apiLogout,
  type AuthUser,
} from './api/auth';

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
  | 'sso'
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
  'landing',
  'onboarding',
];

interface RouteState {
  section: Section;
  artifact: string | null;
}

const ADMIN_SUB_ROUTES: Record<string, Section> = {
  sso: 'sso',
  org: 'org',
  audit: 'audit-log',
};

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

  const [resetToken, setResetToken] = useState<string | undefined>(undefined);

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
      const route = parseHash(window.location.hash);
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
  ];

  if (!authReady) {
    return null;
  }

  if (!user) {
    const hash = window.location.hash.replace(/^#/, '');
    if (hash === 'login' || hash === 'register' || hash.startsWith('reset-password') || hash.startsWith('forgot-password') || hash.startsWith('auth/')) {
      return <AuthPage onAuthenticated={handleAuthenticated} resetToken={resetToken} />;
    }
    return <LandingPage />;
  }

  if (activeSection === 'onboarding') {
    return <OnboardingFlow />;
  }

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
                <h1 className="text-lg font-bold text-text-primary">The Bike App</h1>
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
                icon={dark ? <SunIcon /> : <MoonIcon />}
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

          <Container size="lg">{activeSection === 'audit-log' ? (
            <AuditLogViewer />
          ) : activeSection === 'discovery' ? (
            <DiscoveryDashboard />
          ) : activeSection === 'multi-repo' ? (
            <MultiRepoDashboard />
          ) : activeSection === 'repository' ? (
            <RepositoryFileTree />
          ) : activeSection === 'graph' ? (
            <GraphBuilder selectedId={deepLinkArtifact} />
          ) : activeSection === 'templates' ? (
            <Templates />
          ) : activeSection === 'admin' ? (
            <ProtectedLayout allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedLayout>
          ) : activeSection === 'roles' ? (
            <ProtectedLayout allowedRoles={['admin']}>
              <RoleManagement />
            </ProtectedLayout>
           ) : activeSection === 'registries' ? (
            <ProtectedLayout allowedRoles={['admin']}>
              <PrivateRegistries />
            </ProtectedLayout>
          ) : activeSection === 'tac' ? (
            <TacViewer />
          ) : activeSection === 'test-results' ? (
            <TestResultsDashboard />
          ) : activeSection === 'features' ? (
            <FeatureBrowser />
           ) : activeSection === 'sso' ? (
            <ProtectedLayout allowedRoles={['admin']}>
              <SSOSettings />
            </ProtectedLayout>
          ) : activeSection === 'org' ? (
            <ProtectedLayout allowedRoles={['admin']}>
              <OrgAdmin />
            </ProtectedLayout>
            ) : activeSection === 'trace-graph' ? (
              <TraceGraph />
            ) : activeSection === 'impact-analysis' ? (
              <ImpactAnalysis />
            ) : activeSection === 'impact-report' ? (
              <ImpactReport />
) : activeSection === 'recommendations' ? (
               <RecommendationsPanel />
            ) : activeSection === 'nl-query' ? (
               <NLTraceQuery />
            ) : (
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
              <Stack gap={8}>
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
                    <Button icon={<SendIcon />}>Send</Button>
                    <Button variant="secondary" icon={<HeartIcon />} iconPosition="right">
                      Like
                    </Button>
                    <Button variant="ghost" icon={<TrashIcon />}>
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
                    leftIcon={<UserIcon />}
                    fullWidth
                  />

                  <Input
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={handleEmailChange}
                    error={emailError}
                    leftIcon={<MailIcon />}
                    fullWidth
                  />

                  <Input
                    label="Password"
                    type="password"
                    placeholder="Create a password"
                    helperText="At least 8 characters"
                    rightIcon={<EyeIcon />}
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
                    icon={submitted ? <CheckIcon /> : undefined}
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
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
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
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
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
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
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
         )}
       </Container>
     </div>
   );
 }

function SunIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default App;
