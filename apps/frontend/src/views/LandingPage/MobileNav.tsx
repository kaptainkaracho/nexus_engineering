import { useEffect } from 'react';
import { Button } from '@nexus-engineering/shared';
import { X } from 'lucide-react';

const navLinks = [
  { label: 'Product', href: '#/features' },
  { label: 'Discovery', href: '#/discovery' },
  { label: 'Projects', href: '#/projects' },
  { label: 'Pricing', href: '#/pricing' },
];

export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
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
      <div className="fixed right-0 top-0 bottom-0 w-72 glass-heavy shadow-xl p-6 sm:hidden">
        <div className="flex justify-end mb-6">
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary" aria-label="Close navigation menu">
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav aria-label="Mobile navigation">
          <ul className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:bg-neutral-100 hover:text-text-primary dark:hover:bg-neutral-800 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500" onClick={onClose}>
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
