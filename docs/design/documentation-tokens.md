# Documentation Design Tokens

This document defines design tokens for documentation contexts, extending the existing Nexus design system.

## Overview

These tokens are designed for:
- Markdown documentation (RAC, ADR, guides)
- Code blocks and syntax highlighting
- Documentation-specific UI components
- Print and PDF rendering

## Typography Tokens

### Font Families

```css
:root {
  /* Documentation body text */
  --font-doc-body: 'Inter', system-ui, -apple-system, sans-serif;
  
  /* Code blocks and inline code */
  --font-doc-code: 'JetBrains Mono', 'Fira Code', monospace;
  
  /* Headings (optional, can use body font) */
  --font-doc-heading: 'Inter', system-ui, -apple-system, sans-serif;
}
```

### Font Sizes

```css
:root {
  /* Documentation type scale */
  --text-doc-xs: 0.75rem;      /* 12px - Captions, labels */
  --text-doc-sm: 0.875rem;     /* 14px - Small text, metadata */
  --text-doc-base: 1rem;       /* 16px - Body text */
  --text-doc-lg: 1.125rem;     /* 18px - Lead paragraphs */
  --text-doc-xl: 1.25rem;      /* 20px - H4 headings */
  --text-doc-2xl: 1.5rem;      /* 24px - H3 headings */
  --text-doc-3xl: 1.875rem;    /* 30px - H2 headings */
  --text-doc-4xl: 2.25rem;     /* 36px - H1 headings */
}
```

### Line Heights

```css
:root {
  /* Documentation line heights */
  --leading-doc-tight: 1.25;     /* Headings */
  --leading-doc-normal: 1.6;     /* Body text (optimal for reading) */
  --leading-doc-relaxed: 1.8;    /* Long-form content */
  --leading-doc-code: 1.5;       /* Code blocks */
}
```

### Font Weights

```css
:root {
  /* Documentation font weights */
  --weight-doc-normal: 400;      /* Body text */
  --weight-doc-medium: 500;      /* Emphasis, metadata */
  --weight-doc-semibold: 600;    /* Subheadings, labels */
  --weight-doc-bold: 700;        /* Headings, strong emphasis */
}
```

## Color Tokens

### Documentation-Specific Colors

```css
:root {
  /* Code syntax highlighting */
  --color-doc-code-bg: #F8FAFC;           /* Code block background */
  --color-doc-code-text: #1E293B;         /* Code text */
  --color-doc-code-border: #E2E8F0;       /* Code block border */
  
  /* Syntax colors (Light mode) */
  --color-doc-syntax-keyword: #2563EB;    /* Keywords, control flow */
  --color-doc-syntax-string: #059669;     /* Strings */
  --color-doc-syntax-number: #D97706;     /* Numbers */
  --color-doc-syntax-comment: #94A3B8;    /* Comments */
  --color-doc-syntax-function: #7C3AED;   /* Function names */
  --color-doc-syntax-type: #0891B2;       /* Type names */
  --color-doc-syntax-variable: #BE185D;   /* Variables */
  
  /* Callout boxes */
  --color-doc-callout-info-bg: #EFF6FF;   /* Information callout */
  --color-doc-callout-info-border: #3B82F6;
  --color-doc-callout-warning-bg: #FFFBEB; /* Warning callout */
  --color-doc-callout-warning-border: #F59E0B;
  --color-doc-callout-error-bg: #FEF2F2;  /* Error callout */
  --color-doc-callout-error-border: #EF4444;
  --color-doc-callout-success-bg: #ECFDF5; /* Success callout */
  --color-doc-callout-success-border: #10B981;
  
  /* Tables */
  --color-doc-table-header-bg: #F1F5F9;
  --color-doc-table-row-hover: #F8FAFC;
  --color-doc-table-border: #E2E8F0;
}
```

### Dark Mode Variants

```css
.dark {
  /* Code syntax highlighting (Dark mode) */
  --color-doc-code-bg: #1E293B;
  --color-doc-code-text: #F8FAFC;
  --color-doc-code-border: #334155;
  
  /* Syntax colors (Dark mode) */
  --color-doc-syntax-keyword: #60A5FA;
  --color-doc-syntax-string: #34D399;
  --color-doc-syntax-number: #FBBF24;
  --color-doc-syntax-comment: #64748B;
  --color-doc-syntax-function: #A78BFA;
  --color-doc-syntax-type: #22D3EE;
  --color-doc-syntax-variable: #F472B6;
  
  /* Callout boxes (Dark mode) */
  --color-doc-callout-info-bg: #1E3A8A;
  --color-doc-callout-info-border: #60A5FA;
  --color-doc-callout-warning-bg: #78350F;
  --color-doc-callout-warning-border: #FBBF24;
  --color-doc-callout-error-bg: #7F1D1D;
  --color-doc-callout-error-border: #F87171;
  --color-doc-callout-success-bg: #064E3B;
  --color-doc-callout-success-border: #34D399;
  
  /* Tables (Dark mode) */
  --color-doc-table-header-bg: #334155;
  --color-doc-table-row-hover: #1E293B;
  --color-doc-table-border: #475569;
}
```

## Spacing Tokens

```css
:root {
  /* Documentation spacing scale */
  --space-doc-xs: 0.25rem;    /* 4px - Tight spacing */
  --space-doc-sm: 0.5rem;     /* 8px - Small spacing */
  --space-doc-md: 1rem;       /* 16px - Default spacing */
  --space-doc-lg: 1.5rem;     /* 24px - Large spacing */
  --space-doc-xl: 2rem;       /* 32px - Extra large spacing */
  --space-doc-2xl: 3rem;      /* 48px - Section spacing */
  
  /* Content width */
  --width-doc-content: 72ch;  /* Optimal line length for reading */
  --width-doc-code: 80ch;     /* Code block width */
}
```

## Border Tokens

```css
:root {
  /* Documentation borders */
  --border-doc-default: 1px solid var(--color-doc-table-border);
  --border-doc-code: 1px solid var(--color-doc-code-border);
  --border-doc-callout: 4px solid;
  
  /* Border radii */
  --radius-doc-sm: 0.25rem;   /* 4px - Code blocks */
  --radius-doc-md: 0.5rem;    /* 8px - Callout boxes */
  --radius-doc-lg: 0.75rem;   /* 12px - Cards, containers */
}
```

## Shadow Tokens

```css
:root {
  /* Documentation shadows */
  --shadow-doc-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-doc-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  --shadow-doc-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  
  /* Code block shadow */
  --shadow-doc-code: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
}
```

## Motion Tokens

```css
:root {
  /* Documentation transitions */
  --duration-doc-fast: 150ms;
  --duration-doc-normal: 200ms;
  --duration-doc-slow: 300ms;
  
  /* Easing functions */
  --ease-doc-default: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-doc-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-doc-out: cubic-bezier(0, 0, 0.2, 1);
}
```

## Component Tokens

### Code Blocks

```css
:root {
  /* Code block styling */
  --doc-code-padding: var(--space-doc-md);
  --doc-code-font-size: var(--text-doc-sm);
  --doc-code-line-height: var(--leading-doc-code);
  --doc-code-background: var(--color-doc-code-bg);
  --doc-code-color: var(--color-doc-code-text);
  --doc-code-border: var(--border-doc-code);
  --doc-code-radius: var(--radius-doc-sm);
  --doc-code-shadow: var(--shadow-doc-code);
}
```

### Callout Boxes

```css
:root {
  /* Callout box styling */
  --doc-callout-padding: var(--space-doc-md);
  --doc-callout-border-radius: var(--radius-doc-md);
  --doc-callout-border-width: 4px;
  
  /* Info callout */
  --doc-callout-info-bg: var(--color-doc-callout-info-bg);
  --doc-callout-info-border: var(--color-doc-callout-info-border);
  
  /* Warning callout */
  --doc-callout-warning-bg: var(--color-doc-callout-warning-bg);
  --doc-callout-warning-border: var(--color-doc-callout-warning-border);
  
  /* Error callout */
  --doc-callout-error-bg: var(--color-doc-callout-error-bg);
  --doc-callout-error-border: var(--color-doc-callout-error-border);
  
  /* Success callout */
  --doc-callout-success-bg: var(--color-doc-callout-success-bg);
  --doc-callout-success-border: var(--color-doc-callout-success-border);
}
```

### Tables

```css
:root {
  /* Table styling */
  --doc-table-padding: var(--space-doc-sm) var(--space-doc-md);
  --doc-table-header-bg: var(--color-doc-table-header-bg);
  --doc-table-row-hover: var(--color-doc-table-row-hover);
  --doc-table-border: var(--color-doc-table-border);
  --doc-table-border-radius: var(--radius-doc-md);
}
```

## Usage Examples

### Markdown Code Block

```markdown
​```yaml
# Use the code block tokens for syntax highlighting
nexus:
  schema: req-doc/v1
​```
```

### Callout Box

```html
<div class="doc-callout doc-callout-info">
  <strong>Note:</strong> This is an informational callout.
</div>
```

### Documentation Table

```html
<table class="doc-table">
  <thead>
    <tr>
      <th>Field</th>
      <th>Type</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>id</td>
      <td>string</td>
    </tr>
  </tbody>
</table>
```

## Integration with Existing Design System

These tokens extend the existing Nexus design system tokens:

- **Colors:** Uses the same palette scales (primary, secondary, neutral)
- **Typography:** Uses the same font families (Inter, JetBrains Mono)
- **Spacing:** Uses the same spacing scale (0-96)
- **Shadows:** Uses the same shadow scale (sm, md, lg, xl)
- **Radii:** Uses the same radius scale (sm, md, lg, full)

The documentation tokens provide semantic naming for documentation-specific use cases while maintaining consistency with the overall design system.

## Accessibility

All documentation tokens meet WCAG 2.1 AA requirements:

- **Color contrast:** Minimum 4.5:1 for normal text, 3:1 for large text
- **Focus states:** Visible focus rings for interactive elements
- **Reduced motion:** Tokens respect `prefers-reduced-motion`
- **Dark mode:** Full support with proper contrast ratios

## Print Styles

```css
@media print {
  :root {
    --doc-code-bg: #F8FAFC;
    --doc-code-color: #1E293B;
    --doc-callout-border: 1px solid #E2E8F0;
  }
  
  .doc-callout {
    break-inside: avoid;
  }
  
  .doc-code {
    white-space: pre-wrap;
    word-break: break-word;
  }
}
```

---

*Last updated: 2026-07-18 by UXDesigner*