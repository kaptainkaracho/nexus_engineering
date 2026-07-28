import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@nexus-engineering/shared';

export interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  threshold?: number;
  className?: string;
  once?: boolean;
  role?: string;
}

export function ScrollReveal({
  children,
  delay = 0,
  threshold = 0.1,
  className,
  once = true,
  role,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      el.classList.add('reveal-visible');
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.animationDelay = `${delay}ms`;
          el.classList.add('reveal-visible');
          if (once) observer.unobserve(el);
        }
      },
      { threshold, rootMargin: '0px 0px -60px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay, threshold, once]);

  return (
    <div
      ref={ref}
      className={cn('reveal', className)}
      style={{ animationDelay: `${delay}ms` }}
      role={role}
    >
      {children}
    </div>
  );
}
