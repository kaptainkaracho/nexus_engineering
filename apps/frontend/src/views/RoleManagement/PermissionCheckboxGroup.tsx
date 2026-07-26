import type { Permission } from '@nexus-engineering/shared';

interface PermissionCheckboxGroupProps {
  resource: string;
  permissions: { id: string; name: string; description: string | null }[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleGroup: (checked: boolean) => void;
}

export function PermissionCheckboxGroup({
  resource,
  permissions: items,
  selectedIds,
  onToggle,
  onToggleGroup,
}: PermissionCheckboxGroupProps) {
  const allSelected = items.length > 0 && items.every(p => selectedIds.has(p.id));
  const someSelected = items.some(p => selectedIds.has(p.id)) && !allSelected;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`toggle-${resource}`}
          checked={allSelected}
          ref={el => { if (el) el.indeterminate = someSelected; }}
          onChange={e => onToggleGroup(e.target.checked)}
          className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
          aria-label={`Toggle all ${resource} permissions`}
        />
        <span className="text-sm font-medium text-text-primary">{resource}</span>
      </div>
      <div className="ml-6 space-y-1">
        {items.map(item => (
          <label key={item.id} className="flex items-center gap-2 py-1 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedIds.has(item.id)}
              onChange={() => onToggle(item.id)}
              className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-text-secondary">{item.name}</span>
            {item.description && (
              <span className="text-xs text-text-tertiary">
                ({item.description})
              </span>
            )}
          </label>
        ))}
      </div>
    </div>
  );
}
