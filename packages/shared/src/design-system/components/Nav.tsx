import { useState } from 'react';
import { cn } from '../utils';

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string | number;
  active?: boolean;
}

export interface NavProps {
  items: NavItem[];
  variant?: 'horizontal' | 'vertical';
  className?: string;
}

function NavLink({ item, variant }: { item: NavItem; variant: 'horizontal' | 'vertical' }) {
  return (
    <a
      href={item.href}
      className={cn(
        'flex items-center gap-2 rounded-lg text-sm font-medium transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        'dark:focus:ring-offset-surface-primary',
        variant === 'horizontal' ? 'px-3 py-2' : 'px-3 py-2.5',
        item.active
          ? 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300'
          : 'text-text-secondary hover:bg-neutral-100 hover:text-text-primary dark:hover:bg-neutral-800',
      )}
      aria-current={item.active ? 'page' : undefined}
    >
      {item.icon && <span className="h-5 w-5 shrink-0" aria-hidden="true">{item.icon}</span>}
      <span>{item.label}</span>
      {item.badge !== undefined && (
        <span className="ml-auto rounded-full bg-primary-500 px-2 py-0.5 text-xs font-medium text-white">
          {item.badge}
        </span>
      )}
    </a>
  );
}

export function Nav({ items, variant = 'horizontal', className }: NavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navList = (
    <ul className={cn(
      variant === 'horizontal'
        ? 'flex items-center gap-1'
        : 'flex flex-col gap-1',
    )}>
      {items.map((item) => (
        <li key={item.href}>
          <NavLink item={item} variant={variant} />
        </li>
      ))}
    </ul>
  );

  if (variant === 'vertical') {
    return (
      <nav className={cn('w-full', className)} aria-label="Sidebar navigation">
        {navList}
      </nav>
    );
  }

  return (
    <nav className={cn('w-full relative', className)} aria-label="Main navigation">
      <div className="hidden sm:block">{navList}</div>
      <div className="sm:hidden">
        <button
          onClick={() => setMobileOpen((prev) => !prev)}
          className={cn(
            'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium',
            'text-text-secondary hover:bg-neutral-100 hover:text-text-primary',
            'dark:hover:bg-neutral-800 transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary-500',
          )}
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileOpen}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
          <span>Menu</span>
        </button>
        {mobileOpen && (
          <div
            className="absolute left-4 right-4 z-50 mt-2 rounded-xl border border-border bg-surface-primary p-2 shadow-lg"
            role="menu"
          >
            <ul className="flex flex-col gap-1">
              {items.map((item) => (
                <li key={item.href}>
                  <NavLink item={item} variant="vertical" />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
}
