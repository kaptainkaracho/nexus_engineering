import { useState } from 'react';
import { cn } from '@nexus-engineering/shared';
import { RacTemplate } from './RacTemplate';
import { AacTemplate } from './AacTemplate';

type TemplateTab = 'rac' | 'aac';

const TABS: { key: TemplateTab; label: string }[] = [
  { key: 'rac', label: 'Requirements (RAC)' },
  { key: 'aac', label: 'Architecture (AAC)' },
];

const tabBaseClasses =
  'shrink-0 border-b-[3px] px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2';

export function Templates() {
  const [activeTab, setActiveTab] = useState<TemplateTab>('rac');

  const handleTabKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveTab(TABS[(index + 1) % TABS.length].key);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveTab(TABS[(index - 1 + TABS.length) % TABS.length].key);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveTab(TABS[0].key);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActiveTab(TABS[TABS.length - 1].key);
    }
  };

  return (
    <section aria-label="Template Designer" className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">RAC + AAC Template Design</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Design specifications for the Engineering as Code template system. Use these templates to
          create new Requirements as Code (RAC) and Architecture as Code (AAC) documents.
        </p>
      </div>

      <nav role="tablist" aria-label="Template type" className="w-full overflow-x-auto border-b border-border -mb-px">
        {TABS.map((tab, i) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            aria-controls={`panel-${tab.key}`}
            id={`tab-${tab.key}`}
            tabIndex={activeTab === tab.key ? 0 : -1}
            onKeyDown={(e) => handleTabKeyDown(i, e)}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              tabBaseClasses,
              activeTab === tab.key
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-text-secondary hover:text-text-primary',
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        className="min-w-0"
      >
        {activeTab === 'rac' ? <RacTemplate /> : <AacTemplate />}
      </div>
    </section>
  );
}

export default Templates;
