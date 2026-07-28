import { useState, useEffect } from 'react';
import { Button } from '@nexus-engineering/shared';
import { Target, Search, Link2, BarChart3, Shield, Rocket, ArrowRight, Play, Menu, Layers, GitBranch, FileText, Settings, Zap, Globe } from 'lucide-react';
import { BentoGrid, BentoCell, BentoFeatureCard } from '../../components/bento';
import { ScrollReveal } from '../../components/ScrollReveal';
import { DeploymentStatus } from './DeploymentStatus';
import { LandingFooter } from './LandingFooter';
import { MobileNav } from './MobileNav';

const navLinks = [
  { label: 'Product', href: '#/features' },
  { label: 'Discovery', href: '#/discovery' },
  { label: 'Projects', href: '#/projects' },
  { label: 'Pricing', href: '#/pricing' },
];

const features = [
  { icon: Target, title: 'Requirement Tracking', description: 'Capture, organize, and trace requirements from ideation to deployment. Full bidirectional traceability.' },
  { icon: Search, title: 'Artifact Discovery', description: 'Automatically discover and index artifacts across your connected registries and repositories.' },
  { icon: Link2, title: 'Traceability Chains', description: 'Visualize end-to-end traceability from requirements through features, tests, and deployments.' },
  { icon: BarChart3, title: 'Quality Analytics', description: 'Real-time quality scores, trend analysis, and actionable insights for your engineering process.' },
  { icon: Shield, title: 'Enterprise Security', description: 'SSO, SAML, OAuth, RBAC, and audit logs. Enterprise-grade security out of the box.' },
  { icon: Rocket, title: 'Deployment Insights', description: 'Track deployments, monitor release quality, and correlate changes to outcomes.' },
];

const stats = [
  { value: '99.9%', label: 'Platform Uptime' },
  { value: '10,000+', label: 'Projects Tracked' },
  { value: '500+', label: 'Integrations Supported' },
];

const companyLogos = ['Acme Corp', 'Globex', 'Initech'];

export function LandingPage() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-surface-secondary">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:bg-primary-500 focus:text-white focus:rounded-lg">
        Skip to main content
      </a>

      <header
        className={`fixed top-0 left-0 right-0 h-16 border-b border-border z-40 transition-all duration-300 ${
          scrolled
            ? 'bg-surface-primary/80 backdrop-blur-xl shadow-sm'
            : 'bg-surface-primary/95 backdrop-blur-sm'
        }`}
        role="banner"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <a href="#/" className="flex items-center gap-2 font-bold text-lg text-text-primary">
            Nexus
          </a>
          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a key={link.label} href={link.href} className="px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500">
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
        <section className="relative bg-gradient-to-b from-primary-50/50 dark:from-primary-950/30 to-surface-secondary pt-32 pb-20 px-4 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary-200/30 dark:bg-primary-700/20 rounded-full blur-3xl" />
            <div className="absolute top-20 right-0 w-80 h-80 bg-accent-200/25 dark:bg-accent-700/15 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-primary-300/20 dark:bg-primary-600/10 rounded-full blur-3xl" />
          </div>
          <div className="relative max-w-5xl mx-auto text-center">
            <ScrollReveal>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary leading-tight animate-hero-reveal">
                Engineering Intelligence<br />
                for the <span className="text-primary-600">Modern Enterprise</span>
              </h1>
            </ScrollReveal>
            <ScrollReveal delay={150}>
              <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mt-4">
                Connect your tools, trace requirements to deployments, and ship with confidence.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={300}>
              <div className="flex items-center justify-center gap-4 mt-8 flex-wrap">
                <Button variant="primary" size="lg" onClick={() => { window.location.hash = '#register'; }}>
                  Get Started <ArrowRight className="w-5 h-5" />
                </Button>
                <Button variant="secondary" size="lg" onClick={() => { window.location.hash = '#/demo'; }}>
                  <Play className="w-5 h-5" />
                  Watch Demo
                </Button>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={450}>
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
            </ScrollReveal>
          </div>
        </section>

        <section className="py-12 px-4" aria-labelledby="screenshot-heading">
          <div className="max-w-6xl mx-auto">
            <h2 id="screenshot-heading" className="sr-only">Platform dashboard preview</h2>
            <ScrollReveal>
              <div className="relative rounded-2xl border border-border overflow-hidden shadow-2xl bg-surface-primary">
                <div className="flex items-center gap-2 px-4 py-3 bg-surface-primary border-b border-border">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-error-400" />
                    <div className="w-3 h-3 rounded-full bg-warning-400" />
                    <div className="w-3 h-3 rounded-full bg-success-400" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-md text-xs text-text-tertiary">
                      app.nexus.dev/dashboard
                    </div>
                  </div>
                </div>
                <div className="aspect-[16/9] bg-gradient-to-br from-primary-50 via-surface-primary to-accent-50 dark:from-primary-950/30 dark:via-surface-primary dark:to-accent-950/30 flex items-center justify-center p-8">
                  <div className="w-full max-w-3xl space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4" />
                        <div className="h-32 bg-surface-secondary rounded-lg border border-border p-3 space-y-2">
                          <div className="h-3 bg-primary-100 dark:bg-primary-900/50 rounded w-full" />
                          <div className="h-3 bg-primary-100 dark:bg-primary-900/50 rounded w-5/6" />
                          <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded w-2/3" />
                        </div>
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2" />
                        <div className="h-32 bg-surface-secondary rounded-lg border border-border p-3 space-y-2">
                          <div className="h-3 bg-accent-100 dark:bg-accent-900/50 rounded w-full" />
                          <div className="h-3 bg-accent-100 dark:bg-accent-900/50 rounded w-4/5" />
                          <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded w-1/2" />
                        </div>
                      </div>
                    </div>
                    <div className="h-24 bg-surface-secondary rounded-lg border border-border p-3 space-y-2">
                      <div className="h-3 bg-success-100 dark:bg-success-900/40 rounded w-full" />
                      <div className="h-3 bg-success-100 dark:bg-success-900/40 rounded w-3/4" />
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section className="py-20 px-4" aria-labelledby="features-heading">
          <div className="max-w-6xl mx-auto">
            <ScrollReveal>
              <h2 id="features-heading" className="text-3xl md:text-4xl font-bold text-text-primary text-center mb-2">
                Everything you need to engineer<br />
                with confidence
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={100}>
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
            </ScrollReveal>
          </div>
        </section>

        <section className="bg-surface-primary border-y border-border py-16 px-4" aria-labelledby="stats-heading">
          <div className="max-w-4xl mx-auto">
            <h2 id="stats-heading" className="sr-only">Platform statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center" role="list">
              {stats.map((stat) => (
                <div key={stat.label} role="listitem">
                  <p className="text-3xl md:text-4xl font-bold text-primary-600">{stat.value}</p>
                  <p className="text-sm text-text-secondary mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4" aria-labelledby="use-cases-heading">
          <div className="max-w-6xl mx-auto">
            <ScrollReveal>
              <h2 id="use-cases-heading" className="text-3xl md:text-4xl font-bold text-text-primary text-center mb-3">
                Built for every stage of your workflow
              </h2>
              <p className="text-lg text-text-secondary text-center max-w-2xl mx-auto mb-12">
                Whether you're tracking requirements, discovering artifacts, or auditing compliance—Nexus scales with your team.
              </p>
            </ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="list" aria-label="Use cases by workflow stage">
              {[
                { icon: Layers, title: 'Requirement Management', desc: 'Capture and trace requirements from ideation through deployment with full bidirectional traceability.', use: 'Best for QA leads and systems engineers managing complex compliance frameworks.' },
                { icon: GitBranch, title: 'Artifact Discovery', desc: 'Automatically discover and index artifacts across connected registries, repos, and CI pipelines.', use: 'Ideal for DevOps teams maintaining multi-repo microservice architectures.' },
                { icon: FileText, title: 'ADR Workflows', desc: 'Create, review, and version-control architectural decision records with team collaboration.', use: 'Perfect for architecture boards and tech leads documenting system evolution.' },
                { icon: Settings, title: 'Integration Hub', desc: 'Connect Jira, GitHub, GitLab, Azure DevOps, and 500+ tools with zero configuration.', use: 'Designed for engineering managers consolidating toolchains across departments.' },
                { icon: Zap, title: 'Quality Analytics', desc: 'Real-time quality scores, trend analysis, and actionable insights to drive continuous improvement.', use: 'Built for engineering directors needing executive-level dashboards and reports.' },
                { icon: Globe, title: 'Multi-Cloud Deployment', desc: 'Track deployments across AWS, GCP, Azure, and on-prem with unified release management.', use: 'Essential for platform teams managing hybrid and multi-cloud infrastructures.' },
              ].map((useCase, i) => (
                <ScrollReveal key={useCase.title} delay={i * 80} role="listitem">
                  <div className="h-full p-6 rounded-2xl border border-border bg-surface-primary hover:shadow-lg hover:border-border-hover transition-all duration-200 group">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-950 flex items-center justify-center group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 transition-colors">
                        <useCase.icon className="w-5 h-5 text-primary-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-text-primary text-base">{useCase.title}</h3>
                        <p className="text-sm text-text-secondary mt-1 leading-relaxed">{useCase.desc}</p>
                        <p className="text-xs text-primary-600 dark:text-primary-400 mt-3 font-medium">{useCase.use}</p>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <section className="relative bg-gradient-to-b from-surface-secondary to-primary-50/30 dark:to-primary-950/30 py-20 px-4 overflow-hidden" aria-labelledby="cta-heading">
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary-200/20 dark:bg-primary-700/15 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 left-1/4 w-72 h-72 bg-accent-200/15 dark:bg-accent-700/10 rounded-full blur-3xl" />
          </div>
          <div className="relative max-w-2xl mx-auto text-center">
            <ScrollReveal>
              <h2 id="cta-heading" className="text-3xl md:text-4xl font-bold text-text-primary">
                Ready to transform your engineering workflow?
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <p className="text-lg text-text-secondary mt-3">
                Start shipping with confidence today.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <Button
                variant="primary"
                size="lg"
                className="mt-8 h-14 px-10 text-base"
                onClick={() => { window.location.hash = '#register'; }}
              >
                Start Free <ArrowRight className="w-5 h-5 ml-1" />
              </Button>
            </ScrollReveal>
            <ScrollReveal delay={300}>
              <p className="text-sm text-text-tertiary mt-4">
                No credit card required. Free tier includes 3 users.
              </p>
            </ScrollReveal>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
