import { useState, useCallback, useRef, useEffect } from 'react';
import { Button, Card, Container, Stack, Alert } from '@nexus-engineering/shared';
import {
  FileText,
  TestTube,
  CheckCircle,
  ArrowRight,
  BookOpen,
  Layers,
  ChevronRight,
  Image,
} from 'lucide-react';

import requirementsScreenshot from '../../assets/screenshots/trace-gate-desktop.png';
import architectureScreenshot from '../../assets/screenshots/landing-page-desktop.png';
import testsScreenshot from '../../assets/screenshots/ux-gate-THE-408-desktop.png';

type WorkflowTab = 'requirements' | 'architecture' | 'tests';

interface Step {
  number: number;
  title: string;
  description: string;
  code?: string;
  tip?: string;
  screenshot?: string;
}

const WORKFLOWMeta: Record<WorkflowTab, { label: string; icon: React.ReactNode; description: string; anchor: string }> = {
  requirements: {
    label: 'Requirements-as-Code',
    icon: <FileText className="h-5 w-5" />,
    description: 'Define, manage, and trace requirements directly in your Git repository using YAML files.',
    anchor: 'requirements-workflow',
  },
  architecture: {
    label: 'Architecture-as-Code',
    icon: <Layers className="h-5 w-5" />,
    description: 'Document architecture decisions and system models as version-controlled code artifacts.',
    anchor: 'architecture-workflow',
  },
  tests: {
    label: 'Test-as-Code',
    icon: <TestTube className="h-5 w-5" />,
    description: 'Connect test cases to requirements and architecture for end-to-end traceability.',
    anchor: 'tests-workflow',
  },
};

const REQUIREMENTS_STEPS: Step[] = [
  {
    number: 1,
    title: 'Create a requirements file',
    description:
      'Create a new file with the `.req.yaml` extension in your repository. This file will contain one or more requirement definitions.',
    code: `# authentication.req.yaml
nexus:
  metadata:
    documentId: PRJ-REQ-001
    domain: authentication
    version: "1.0"

requirements:
  - id: REQ-AUTH-001
    type: functional
    title: User Authentication
    priority: high
    status: approved`,
  },
  {
    number: 2,
    title: 'Define requirement fields',
    description:
      'Each requirement must include an `id`, `type`, `title`, and `description`. Optionally set `priority`, `status`, and `tags` for better organization.',
    code: `requirements:
  - id: REQ-AUTH-001
    type: functional          # functional | non-functional | system | user
    title: User Authentication
    description: |
      The system shall authenticate users using
      email and password credentials.
    priority: high            # low | medium | high | critical
    status: approved          # proposed | approved | rejected | implemented | verified
    tags: [security, auth]`,
  },
  {
    number: 3,
    title: 'Add trace links',
    description:
      'Connect requirements to other artifacts (test cases, architecture models, implementations) using trace links defined inline in the requirement file.',
    code: `requirements:
  - id: REQ-AUTH-001
    type: functional
    title: User Authentication
    description: |
      The system shall authenticate users.
    traceLinks:
      - type: verifies
        target:
          id: TC-AUTH-001
          documentId: PRJ-TEST-001
        confidence: high
        description: "Authentication test case"`,
  },
  {
    number: 4,
    title: 'Run a repository scan',
    description:
      'Open the Discovery Dashboard and trigger a scan. Nexus will parse your `.req.yaml` files, validate the schema, and index all requirements.',
    tip: 'Use the scan options to limit depth or file patterns for large repositories.',
  },
  {
    number: 5,
    title: 'Explore requirements in the dashboard',
    description:
      'After scanning, browse your requirements in the Discovery Dashboard. Click any requirement to see its details, metadata, and trace links.',
    tip: 'Use the filter bar to show only requirements, or search by title to find specific items quickly.',
  },
];

const ARCHITECTURE_STEPS: Step[] = [
  {
    number: 1,
    title: 'Create an architecture decision record',
    description:
      'Architecture Decision Records (ADRs) capture important design decisions. Create a `.adr.yaml` file in your repository.',
    code: `# auth-adr.adr.yaml
nexus:
  metadata:
    documentId: PRJ-ADR-001
    domain: architecture

adrs:
  - id: ADR-001
    title: Use JWT for authentication
    status: accepted
    deciders:
      - "Jane Smith"
      - "John Doe"
    context: |
      We need a stateless authentication mechanism
      that works across microservices.
    decision: |
      We will use JSON Web Tokens (JWT) for
      service-to-service and user authentication.
    consequences:
      - "Stateless — no server-side session storage"
      - "Token size may grow with claims"
      - "Must handle token revocation via blacklist"`,
  },
  {
    number: 2,
    title: 'Define architecture models',
    description:
      'Document system structure using architecture model files (`.arch.yaml`). Define blocks, ports, and connectors.',
    code: `# system-arch.arch.yaml
nexus:
  metadata:
    documentId: PRJ-ARCH-001
    domain: system-design

architecture:
  - id: ARCH-001
    name: Authentication Service
    type: blockDefinition
    elements:
      - id: BLK-API
        name: API Gateway
        type: block
      - id: BLK-AUTH
        name: Auth Service
        type: block
      - id: BLK-DB
        name: User Database
        type: block
    relationships:
      - source: BLK-API
        target: BLK-AUTH
        type: composition
      - source: BLK-AUTH
        target: BLK-DB
        type: aggregation`,
  },
  {
    number: 3,
    title: 'Link architecture to requirements',
    description:
      'Add trace links from architecture models back to the requirements they satisfy. This creates the traceability chain.',
    code: `architecture:
  - id: ARCH-001
    name: Authentication Service
    traceLinks:
      - type: satisfies
        target:
          id: REQ-AUTH-001
          documentId: PRJ-REQ-001
        confidence: high
        description: "Auth service implements auth requirement"`,
  },
  {
    number: 4,
    title: 'Scan and visualize',
    description:
      'Run a scan to index your architecture artifacts. Then open the Graph Builder to see the full traceability graph connecting requirements to architecture.',
    tip: 'Use the graph filters to focus on specific artifact types or relationship types.',
  },
  {
    number: 5,
    title: 'Review in Trace Graph',
    description:
      'Navigate to the Trace Graph view to see how your architecture decisions connect to requirements and implementations. Use this to identify gaps in your design coverage.',
  },
];

const TEST_STEPS: Step[] = [
  {
    number: 1,
    title: 'Create test case artifacts',
    description:
      'Define test cases as code artifacts in `.test.yaml` files. Each test case should reference the requirement it verifies.',
    code: `# auth-tests.test.yaml
nexus:
  metadata:
    documentId: PRJ-TEST-001
    domain: authentication

testCases:
  - id: TC-AUTH-001
    title: Valid login returns JWT token
    type: integration
    status: automated
    preconditions:
      - "User account exists in database"
      - "Service is running"
    steps:
      - "Send POST /auth/login with valid credentials"
      - "Verify 200 response"
      - "Verify JWT token in response body"
    expected: "JWT token returned with 200 status"`,
  },
  {
    number: 2,
    title: 'Add verification trace links',
    description:
      'Connect test cases to requirements using `verifies` trace links. This proves which requirements are covered by automated tests.',
    code: `testCases:
  - id: TC-AUTH-001
    title: Valid login returns JWT token
    traceLinks:
      - type: verifies
        target:
          id: REQ-AUTH-001
          documentId: PRJ-REQ-001
        confidence: high
        description: "Verifies authentication requirement"`,
  },
  {
    number: 3,
    title: 'Scan and check coverage',
    description:
      'Run a scan to index test artifacts. Check the Quality Dashboard to see requirement coverage — identify any requirements without linked test cases.',
    tip: 'Aim for high confidence links (`confidence: high`) for test cases generated from code analysis.',
  },
  {
    number: 4,
    title: 'Review test results',
    description:
      'Open the Test Results Dashboard to see pass/fail status for your test cases. Failed tests highlight requirements that may need attention.',
  },
  {
    number: 5,
    title: 'Analyze impact of changes',
    description:
      'When a requirement changes, use Impact Analysis to see which test cases (and therefore which tests) need re-running. This prevents regressions.',
    tip: 'Use the Trace Gate to enforce minimum coverage before merges.',
  },
];

const SCREENSHOT_SOURCES: Record<WorkflowTab, string> = {
  requirements: requirementsScreenshot,
  architecture: architectureScreenshot,
  tests: testsScreenshot,
};

const WORKFLOW_STEPS: Record<WorkflowTab, Step[]> = {
  requirements: REQUIREMENTS_STEPS,
  architecture: ARCHITECTURE_STEPS,
  tests: TEST_STEPS,
};

const TAB_ORDER: WorkflowTab[] = ['requirements', 'architecture', 'tests'];

function ScreenshotPlaceholder({ label, src }: { label: string; src?: string }) {
  if (src) {
    return (
      <div className="overflow-hidden rounded-lg border border-border bg-surface-tertiary">
        <img src={src} alt={label} className="w-full" loading="lazy" />
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border bg-surface-tertiary p-8">
      <div className="text-center">
        <Image className="mx-auto h-8 w-8 text-text-tertiary" />
        <p className="mt-2 text-sm font-medium text-text-tertiary">{label}</p>
      </div>
    </div>
  );
}

function StepCard({ step, isLast }: { step: Step; isLast: boolean }) {
  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-500 text-sm font-bold text-text-inverse">
          {step.number}
        </div>
        {!isLast && <div className="mt-2 w-0.5 flex-1 bg-border" />}
      </div>
      <Card padding="md" className="flex-1">
        <Stack gap={3}>
          <h3 className="text-base font-semibold text-text-primary">{step.title}</h3>
          <p className="text-sm leading-relaxed text-text-secondary">{step.description}</p>
          {step.code && (
            <pre className="overflow-x-auto rounded-lg bg-surface-tertiary p-4 text-xs leading-relaxed text-text-secondary">
              <code>{step.code}</code>
            </pre>
          )}
          {step.tip && (
            <Alert variant="info" title="Tip">
              {step.tip}
            </Alert>
          )}
        </Stack>
      </Card>
    </div>
  );
}

function WorkflowSection({
  tab,
  completedSteps,
  onToggleStep,
  screenshotSrc,
}: {
  tab: WorkflowTab;
  completedSteps: Record<WorkflowTab, Set<number>>;
  onToggleStep: (tab: WorkflowTab, stepNumber: number) => void;
  screenshotSrc?: string;
}) {
  const steps = WORKFLOW_STEPS[tab];
  const meta = WORKFLOWMeta[tab];
  const doneCount = completedSteps[tab].size;
  const totalSteps = steps.length;
  const progress = totalSteps > 0 ? Math.round((doneCount / totalSteps) * 100) : 0;

  return (
    <section id={meta.anchor} className="scroll-mt-24">
      <Stack gap={6}>
        <Card variant="outlined" padding="md">
          <div className="flex items-center justify-between">
            <Stack gap={1}>
              <div className="flex items-center gap-2">
                {meta.icon}
                <h2 className="text-lg font-semibold text-text-primary">{meta.label}</h2>
              </div>
              <p className="text-sm text-text-secondary">{meta.description}</p>
            </Stack>
            <div className="hidden text-right sm:block">
              <p className="text-xs text-text-tertiary">
                {doneCount} of {totalSteps} steps
              </p>
              <div className="mt-1 h-2 w-24 overflow-hidden rounded-full bg-surface-tertiary">
                <div
                  className="h-full rounded-full bg-primary-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </Card>

        <Stack gap={4}>
          {steps.map((step, i) => (
            <div key={step.number} className="flex items-start gap-4">
              <div className="mt-4 shrink-0">
                <button
                  onClick={() => onToggleStep(tab, step.number)}
                  aria-label={`Mark step ${step.number} as ${completedSteps[tab].has(step.number) ? 'incomplete' : 'complete'}`}
                  className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                    completedSteps[tab].has(step.number)
                      ? 'border-success-500 bg-success-500 text-text-inverse'
                      : 'border-border hover:border-primary-300'
                  }`}
                >
                  {completedSteps[tab].has(step.number) && (
                    <CheckCircle className="h-3 w-3" />
                  )}
                </button>
              </div>
              <div className="flex-1">
                <StepCard step={step} isLast={i === steps.length - 1} />
              </div>
            </div>
          ))}
        </Stack>

        <ScreenshotPlaceholder label={`${meta.label} — Screenshot (1440×900)`} src={screenshotSrc} />
      </Stack>
    </section>
  );
}

export function UserGuide() {
  const [completedSteps, setCompletedSteps] = useState<Record<WorkflowTab, Set<number>>>({
    requirements: new Set(),
    architecture: new Set(),
    tests: new Set(),
  });
  const [activeSidebar, setActiveSidebar] = useState<WorkflowTab>('requirements');
  const sectionRefs = useRef<Record<WorkflowTab, HTMLElement | null>>({
    requirements: null,
    architecture: null,
    tests: null,
  });

  const toggleStep = useCallback((tab: WorkflowTab, stepNumber: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev[tab]);
      if (next.has(stepNumber)) {
        next.delete(stepNumber);
      } else {
        next.add(stepNumber);
      }
      return { ...prev, [tab]: next };
    });
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const tab = TAB_ORDER.find((t) => WORKFLOWMeta[t].anchor === entry.target.id);
            if (tab) setActiveSidebar(tab);
          }
        }
      },
      { rootMargin: '-20% 0px -60% 0px' }
    );

    TAB_ORDER.forEach((tab) => {
      const el = document.getElementById(WORKFLOWMeta[tab].anchor);
      if (el) {
        sectionRefs.current[tab] = el;
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, []);

  const scrollToWorkflow = (tab: WorkflowTab) => {
    const el = document.getElementById(WORKFLOWMeta[tab].anchor);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-surface-secondary">
      <Container size="lg">
        <div className="flex gap-8 py-8">
          <aside className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-24">
              <Stack gap={1}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                  Workflows
                </p>
                {TAB_ORDER.map((tab) => {
                  const meta = WORKFLOWMeta[tab];
                  const isActive = activeSidebar === tab;
                  const done = completedSteps[tab].size;
                  const total = WORKFLOW_STEPS[tab].length;
                  return (
                    <button
                      key={tab}
                      onClick={() => scrollToWorkflow(tab)}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                          : 'text-text-secondary hover:bg-surface-tertiary hover:text-text-primary'
                      }`}
                    >
                      {meta.icon}
                      <span className="flex-1 truncate">{meta.label}</span>
                      {done === total && total > 0 && (
                        <CheckCircle className="h-4 w-4 shrink-0 text-success-500" />
                      )}
                    </button>
                  );
                })}
              </Stack>
            </div>
          </aside>

          <main className="min-w-0 flex-1">
            <Stack gap={12}>
              <Stack gap={3}>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-primary-500" />
                  <h1 className="text-3xl font-bold text-text-primary">User Guide</h1>
                </div>
                <p className="max-w-2xl text-text-secondary">
                  Step-by-step walkthroughs for the three core Engineering-as-Code workflows. Each guide
                  covers the full lifecycle from creating artifacts to analyzing traceability.
                </p>
              </Stack>

              {TAB_ORDER.map((tab) => (
                <WorkflowSection
                  key={tab}
                  tab={tab}
                  completedSteps={completedSteps}
                  onToggleStep={toggleStep}
                  screenshotSrc={SCREENSHOT_SOURCES[tab]}
                />
              ))}

              <Card variant="outlined" padding="lg">
                <Stack gap={4}>
                  <h2 className="text-lg font-semibold text-text-primary">What&apos;s Next?</h2>
                  <p className="text-sm text-text-secondary">
                    After completing all three workflows, explore the Trace Graph to see your full
                    traceability chain connecting requirements, architecture, and tests.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => window.location.hash = '#trace-graph'}
                      icon={<ArrowRight className="h-4 w-4" />}
                      iconPosition="right"
                    >
                      Open Trace Graph
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.location.hash = '#quality-dashboard'}
                      icon={<ChevronRight className="h-4 w-4" />}
                      iconPosition="right"
                    >
                      Quality Dashboard
                    </Button>
                  </div>
                </Stack>
              </Card>
            </Stack>
          </main>
        </div>
      </Container>
    </div>
  );
}

export default UserGuide;
