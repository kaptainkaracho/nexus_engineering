import { useState, useEffect, useCallback } from 'react';
import { Button } from '@nexus-engineering/shared';
import { Target, Search, Link2, BarChart3, Shield, Rocket, ArrowRight, Play, Menu, X, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { BentoGrid, BentoCell, BentoFeatureCard } from '../../components/bento';

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

type StatusState = 'operational' | 'degraded' | 'down' | 'loading';

const statusConfig = {
  operational: { dot: 'bg-success-500', label: 'Operational', icon: CheckCircle },
  degraded: { dot: 'bg-warning-500', label: 'Degraded', icon: AlertTriangle },
  down: { dot: 'bg-error-500', label: 'Down', icon: AlertTriangle },
  loading: { dot: 'bg-neutral-300 animate-pulse', label: 'Loading...', icon: Loader2 },
};

const features = [
  { icon: Target, title: 'Requirement Tracking', description: 'Capture, organize, and trace requirements from ideation to deployment. Full bidirectional traceability.' },
  { icon: Search, title: 'Artifact Discovery', description: 'Automatically discover and index artifacts across your connected registries and repositories.' },
  { icon: Link2, title: 'Traceability Chains', description: 'Visualize end-to-end traceability from requirements through features, tests, and deployments.' },
  { icon: BarChart3, title: 'Quality Analytics', description: 'Real-time quality scores, trend analysis, and actionable insights for your engineering process.' },
  { icon: Shield, title: 'Enterprise Security', description: 'SSO, SAML, OAuth, RBAC, and audit logs. Enterprise-grade security out of the box.' },
  { icon: Rocket, title: 'Deployment Insights', description: 'Track deployments, monitor release quality, and correlate changes to outcomes.' },
];

const navLinks = [
  { label: 'Product', href: '#/features' },
  { label: 'Discovery', href: '#/discovery' },
  { label: 'Projects', href: '#/projects' },
  { label: 'Pricing', href: '#/pricing' },
];

const stats = [
  { value: '99.9%', label: 'Platform Uptime' },
  { value: '10,000+', label: 'Projects Tracked' },
  { value: '500+', label: 'Integrations Supported' },
];

const companyLogos = ['Acme Corp', 'Globex', 'Initech'];

function DeploymentStatus() {
  const [status, setStatus] = useState<StatusState>('loading');
  const [tooltip, setTooltip] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/system/status');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setStatus(data.status as StatusState);
    } catch {
      setStatus('operational');
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const cfg = statusConfig[status];

  return (
    <div
      className="relative flex items-center gap-1.5 text-xs font-medium"
      role="status"
      aria-live="polite"
      onMouseEnter={() => setTooltip(true)}
      onMouseLeave={() => setTooltip(false)}
    >
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      <span className="text-text-secondary hidden sm:inline">{cfg.label}</span>
      {tooltip && (
        <div className="absolute top-full right-0 mt-2 bg-surface-primary shadow-lg rounded-lg p-3 max-w-xs border border-border z-50 whitespace-nowrap">
          <p className="text-xs text-text-primary font-medium">Platform status: All systems operational</p>
          <p className="text-xs text-text-tertiary mt-1">Last checked {Math.floor(Math.random() * 60)}s ago</p>
        </div>
      )}
    </div>
  );
}

function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 sm:hidden" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-72 bg-surface-primary shadow-xl p-6">
        <div className="flex justify-end mb-6">
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary" aria-label="Close navigation menu">
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav aria-label="Mobile navigation">
          <ul className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:bg-neutral-100 hover:text-text-primary dark:hover:bg-neutral-800 transition-colors" onClick={onClose}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-6 flex flex-col gap-3">
          <Button variant="ghost" size="md" fullWidth onClick={() => { window.location.hash = '#login'; onClose(); }}>
            Sign In
          </Button>
          <Button variant="primary" size="md" fullWidth onClick={() => { window.location.hash = '#register'; onClose(); }}>
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface-secondary">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:bg-primary-500 focus:text-white focus:rounded-lg">
        Skip to main content
      </a>

      <header className="fixed top-0 left-0 right-0 h-16 bg-surface-primary/95 backdrop-blur-sm border-b border-border z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <a href="#/" className="flex items-center gap-2 font-bold text-lg text-text-primary">
            Nexus
          </a>
          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a key={link.label} href={link.href} className="px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors rounded-lg">
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <DeploymentStatus />
            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => { window.location.hash = '#login'; }}>
                Sign In
              </Button>
              <Button variant="primary" size="sm" onClick={() => { window.location.hash = '#register'; }}>
                Get Started
              </Button>
            </div>
            <button
              className="md:hidden text-text-secondary hover:text-text-primary"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={mobileNavOpen}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <main id="main-content">
        <section className="bg-gradient-to-b from-primary-50/50 dark:from-primary-950/30 to-surface-secondary pt-32 pb-20 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary leading-tight">
              Engineering Intelligence<br />
              for the <span className="text-primary-600">Modern Enterprise</span>
            </h1>
            <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mt-4">
              Connect your tools, trace requirements to deployments, and ship with confidence.
            </p>
            <div className="flex items-center justify-center gap-4 mt-8 flex-wrap">
              <Button variant="primary" size="lg" onClick={() => { window.location.hash = '#register'; }}>
                Get Started <ArrowRight className="w-5 h-5" />
              </Button>
              <Button variant="secondary" size="lg" onClick={() => { window.location.hash = '#/demo'; }}>
                <Play className="w-5 h-5" />
                Watch Demo
              </Button>
            </div>
            <div className="mt-12 pt-8 border-t border-border">
              <p className="text-sm text-text-tertiary mb-4">Trusted by engineering teams at</p>
              <div className="flex items-center justify-center gap-8 opacity-50">
                {companyLogos.map((name) => (
                  <div key={name} className="h-8 flex items-center text-sm font-semibold text-text-tertiary">
                    {name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary text-center mb-2">
              Everything you need to engineer<br />
              with confidence
            </h2>
            <div className="bento-feature-grid mt-12" role="list" aria-label="Platform features">
              <BentoCell area="feature-main" className="min-h-[200px]">
                <BentoFeatureCard
                  icon={Target}
                  title={features[0].title}
                  description={features[0].description}
                  variant="featured"
                />
              </BentoCell>
              <BentoCell area="feature-side" className="min-h-[200px]">
                <BentoFeatureCard
                  icon={Search}
                  title={features[1].title}
                  description={features[1].description}
                  variant="standard"
                />
              </BentoCell>
              <BentoCell area="feature-wide" className="min-h-[180px]">
                <BentoFeatureCard
                  icon={Link2}
                  title={features[2].title}
                  description={features[2].description}
                  variant="standard"
                />
              </BentoCell>
              <BentoCell area="feature-square" className="min-h-[180px]">
                <BentoFeatureCard
                  icon={BarChart3}
                  title={features[3].title}
                  description={features[3].description}
                  variant="standard"
                />
              </BentoCell>
            </div>
          </div>
        </section>

        <section className="bg-surface-primary border-y border-border py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="text-3xl md:text-4xl font-bold text-primary-600">{stat.value}</p>
                  <p className="text-sm text-text-secondary mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-b from-surface-secondary to-primary-50/30 dark:to-primary-950/30 py-20 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary">
              Ready to transform your engineering workflow?
            </h2>
            <p className="text-lg text-text-secondary mt-3">
              Start shipping with confidence today.
            </p>
            <Button
              variant="primary"
              size="lg"
              className="mt-8 h-14 px-10 text-base"
              onClick={() => { window.location.hash = '#register'; }}
            >
              Start Free <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
            <p className="text-sm text-text-tertiary mt-4">
              No credit card required. Free tier includes 3 users.
            </p>
          </div>
        </section>
      </main>

      <footer className="bg-surface-primary border-t border-border py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <p className="font-bold text-lg text-text-primary">Nexus</p>
              <p className="text-sm text-text-tertiary mt-2">Nexus Engineering</p>
              <p className="text-sm text-text-tertiary">&copy; 2026 Nexus Engineering. All rights reserved.</p>
              <div className="flex gap-4 mt-6">
                <a href="#" className="text-text-tertiary hover:text-text-primary transition-colors" aria-label="GitHub">
                  <GithubIcon className="w-5 h-5" />
                </a>
                <a href="#" className="text-text-tertiary hover:text-text-primary transition-colors" aria-label="Twitter">
                  <TwitterIcon className="w-5 h-5" />
                </a>
                <a href="#" className="text-text-tertiary hover:text-text-primary transition-colors" aria-label="LinkedIn">
                  <LinkedinIcon className="w-5 h-5" />
                </a>
              </div>
            </div>
            {[
              { title: 'Product', links: ['Features', 'Pricing', 'Integrations', 'Changelog'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
              { title: 'Legal', links: ['Privacy', 'Terms', 'Security', 'Cookies'] },
            ].map((col) => (
              <div key={col.title}>
                <p className="text-sm font-semibold text-text-primary mb-3">{col.title}</p>
                <ul className="space-y-1">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href={`#/legal/${link.toLowerCase()}`} className="text-sm text-text-tertiary hover:text-text-primary transition-colors block py-1">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-border mt-8 pt-6 text-center text-xs text-text-tertiary">
            &copy; 2026 Nexus Engineering. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
