type IconProps = React.SVGProps<SVGSVGElement>;

const stroke = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const Icons = {
  Dashboard: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width={18} height={18} {...stroke} {...p}>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </svg>
  ),
  Students: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width={18} height={18} {...stroke} {...p}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M15 20c0-2.5 1.8-4.5 4-4.5" />
    </svg>
  ),
  Calendar: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width={18} height={18} {...stroke} {...p}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  ),
  Trial: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width={18} height={18} {...stroke} {...p}>
      <path d="M4 18V6M8 18V10M12 18V4M16 18V12M20 18V8" />
    </svg>
  ),
  Lessons: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width={18} height={18} {...stroke} {...p}>
      <path d="M4 6h16M4 12h10M4 18h14" />
    </svg>
  ),
  Chat: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width={18} height={18} {...stroke} {...p}>
      <path d="M4 6h16v10H8l-4 4V6z" />
    </svg>
  ),
  Notes: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width={18} height={18} {...stroke} {...p}>
      <path d="M6 4h12v16H8l-2 2V4z" />
    </svg>
  ),
  Settings: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width={18} height={18} {...stroke} {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ),
  Plus: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width={14} height={14} {...stroke} {...p}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Bell: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width={18} height={18} {...stroke} {...p}>
      <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
      <path d="M13.7 21a2 2 0 01-3.4 0" />
    </svg>
  ),
  Close: (p: IconProps) => (
    <svg viewBox="0 0 24 24" width={14} height={14} {...stroke} {...p}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
};

export type NavIconKey = keyof typeof Icons;
