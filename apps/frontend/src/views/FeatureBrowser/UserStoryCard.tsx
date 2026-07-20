import { Badge } from '@nexus-engineering/shared';
import type { FacUserStory } from './types';

interface UserStoryCardProps {
  story: FacUserStory;
}

export function UserStoryCard({ story }: UserStoryCardProps) {
  return (
    <div className="rounded-lg border border-border bg-surface-primary p-4">
      <div className="mb-2 flex items-center gap-2">
        <Badge variant="info">{story.id}</Badge>
      </div>
      <p className="text-sm text-text-secondary">
        <span className="font-medium text-text-primary">As a </span>
        {story.role}
        <span className="font-medium text-text-primary">, I want </span>
        {story.want}
        {story.soThat ? (
          <>
            <span className="font-medium text-text-primary">, so that </span>
            {story.soThat}
          </>
        ) : null}
      </p>

      {story.acceptanceCriteria?.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-text-tertiary">
            Acceptance Criteria
          </p>
          <ul className="flex flex-col gap-1">
            {story.acceptanceCriteria.map((ac) => (
              <li key={ac.id} className="fb-ac">
                {ac.given ? <span className="fb-ac-key">Given</span> : null}
                {ac.given ? <span className="text-sm text-text-secondary">{ac.given}</span> : null}
                {ac.when ? <span className="fb-ac-key">When</span> : null}
                {ac.when ? <span className="text-sm text-text-secondary">{ac.when}</span> : null}
                <span className="fb-ac-key">Then</span>
                <span className="text-sm text-text-secondary">{ac.then}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
