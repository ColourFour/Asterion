import type { ReactNode } from 'react';

interface RegionActionCardProps {
  eyebrow: string;
  title: string;
  description?: string;
  icon: ReactNode;
  stateIcon?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function RegionActionCard({
  eyebrow,
  title,
  description,
  icon,
  stateIcon,
  className,
  children,
}: RegionActionCardProps) {
  return (
    <article className={`region-action-card${className ? ` ${className}` : ''}`}>
      <div className="region-action-card-title">
        <span className="region-action-icon" aria-hidden="true">{icon}</span>
        <div>
          <span>{eyebrow}</span>
          <h3>{title}</h3>
          {description ? <p>{description}</p> : null}
        </div>
        {stateIcon ? <span className="card-state-icon">{stateIcon}</span> : null}
      </div>
      <div className="region-action-card-body">
        {children}
      </div>
    </article>
  );
}
