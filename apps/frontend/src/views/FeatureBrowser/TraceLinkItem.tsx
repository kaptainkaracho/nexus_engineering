import { useState } from 'react';
import { Badge } from '@nexus-engineering/shared';
import { cn } from '@nexus-engineering/shared';
import { fetchRequirement } from '../../api/client';
import { TRACE_LABELS, type FacTraceLink } from './types';

interface TraceLinkItemProps {
  link: FacTraceLink;
}

interface RequirementDetail {
  id?: string;
  title?: string;
  description?: string;
  type?: string;
  priority?: string;
  status?: string;
}

export function TraceLinkItem({ link }: TraceLinkItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<RequirementDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const label = TRACE_LABELS[link.type] ?? link.type;
  const targetId = link.target.id;
  const contentId = `fb-trace-detail-${targetId}`;

  const toggle = async () => {
    const next = !expanded;
    setExpanded(next);
    if (next && !detail && !error) {
      setLoading(true);
      try {
        const req = await fetchRequirement(targetId);
        if (req && (req.title || req.id)) {
          setDetail(req as RequirementDetail);
        } else {
          setError('Requirement could not be loaded');
        }
      } catch {
        setError('Requirement could not be loaded');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fb-trace-item">
      <button
        type="button"
        className="fb-trace-trigger"
        onClick={toggle}
        aria-expanded={expanded}
        aria-controls={contentId}
      >
        <span aria-hidden="true">{expanded ? '▾' : '▸'}</span>
        <Badge variant={link.type}>{label}</Badge>
        <span className="fb-trace-target">{targetId}</span>
        {link.confidence ? (
          <Badge variant={link.confidence} className="ml-auto">
            {link.confidence}
          </Badge>
        ) : null}
      </button>

      {expanded && (
        <div id={contentId} className="fb-trace-detail">
          {loading && (
            <p className="text-sm text-text-tertiary" role="status">
              Loading requirement…
            </p>
          )}
          {error && !loading && (
            <p className="text-sm text-text-secondary" role="status">
              {error} <span className="font-mono text-text-tertiary">({targetId})</span>
            </p>
          )}
          {detail && !loading && (
            <dl className="flex flex-col gap-1 text-sm">
              {detail.title ? (
                <div>
                  <dt className="sr-only">Title</dt>
                  <dd className="font-medium text-text-primary">{detail.title}</dd>
                </div>
              ) : null}
              {detail.description ? (
                <div>
                  <dt className="sr-only">Description</dt>
                  <dd className="text-text-secondary">{detail.description}</dd>
                </div>
              ) : null}
              <div className="mt-1 flex flex-wrap gap-2">
                {detail.type ? <Badge variant="info">{detail.type}</Badge> : null}
                {detail.priority ? <Badge variant={detail.priority}>{detail.priority}</Badge> : null}
                {detail.status ? <Badge variant="proposed">{detail.status}</Badge> : null}
              </div>
            </dl>
          )}
          {link.description ? (
            <p className="mt-2 text-xs italic text-text-tertiary">{link.description}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
