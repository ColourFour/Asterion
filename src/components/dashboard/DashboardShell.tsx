import type { ReactNode } from 'react';

export interface DashboardNavItem {
  label: string;
  active?: boolean;
  onClick: () => void;
}

export interface DashboardTabItem {
  label: string;
  active?: boolean;
  onClick?: () => void;
  href?: string;
}

interface DashboardShellProps {
  className?: string;
  kicker: string;
  title: string;
  description: ReactNode;
  detail?: ReactNode;
  navItems: DashboardNavItem[];
  tabs?: DashboardTabItem[];
  children: ReactNode;
}

export function DashboardShell({
  className,
  kicker,
  title,
  description,
  detail,
  navItems,
  tabs = [],
  children,
}: DashboardShellProps) {
  return (
    <section className={`dashboard-shell${className ? ` ${className}` : ''}`}>
      <header className="dashboard-topbar dashboard-hero">
        <div className="dashboard-hero-copy">
          <span className="mode-pill">{kicker}</span>
          <h1>{title}</h1>
          <p>{description}</p>
          {detail ? <p className="dashboard-muted">{detail}</p> : null}
        </div>
        <nav className="dashboard-nav" aria-label="Dashboard navigation">
          {navItems.map((item) => (
            <button key={item.label} type="button" className={item.active ? 'active' : undefined} onClick={item.onClick}>
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      {tabs.length > 0 ? (
        <nav className="dashboard-tabs" aria-label="Dashboard sections">
          {tabs.map((tab) => {
            const className = tab.active ? 'active' : undefined;
            return tab.href ? (
              <a key={tab.label} className={className} href={tab.href} onClick={tab.onClick}>
                {tab.label}
              </a>
            ) : (
              <button key={tab.label} type="button" className={className} onClick={tab.onClick}>
                {tab.label}
              </button>
            );
          })}
        </nav>
      ) : null}

      {children}
    </section>
  );
}
