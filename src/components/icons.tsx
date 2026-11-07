import type { ReactNode } from 'react';

type IconProps = { className?: string };

function make(node: ReactNode) {
  return function Icon({ className = 'w-4 h-4' }: IconProps) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        {node}
      </svg>
    );
  };
}

export const IcLogo = make(
  <>
    <circle cx="12" cy="12" r="8.6" />
    <circle cx="12" cy="12" r="3.8" />
    <path d="M12 3.4v4.8M12 15.8v4.8M3.4 12h4.8M15.8 12h4.8M6 6l3.3 3.3M14.7 14.7 18 18M18 6l-3.3 3.3M9.3 14.7 6 18" />
  </>
);

export const IcGrid = make(
  <>
    <rect x="3.5" y="3.5" width="7" height="7" />
    <rect x="13.5" y="3.5" width="7" height="7" />
    <rect x="3.5" y="13.5" width="7" height="7" />
    <rect x="13.5" y="13.5" width="7" height="7" />
  </>
);

export const IcChip = make(
  <>
    <rect x="7" y="7" width="10" height="10" />
    <path d="M10 3.5V7M14 3.5V7M10 17v3.5M14 17v3.5M3.5 10H7M3.5 14H7M17 10h3.5M17 14h3.5" />
    <circle cx="12" cy="12" r="1.6" />
  </>
);

export const IcGraph = make(
  <>
    <circle cx="5" cy="6" r="2.3" />
    <circle cx="19" cy="6" r="2.3" />
    <circle cx="12" cy="18" r="2.3" />
    <path d="m7 7.3 3.6 8.7M17 7.3l-3.6 8.7M7.3 6h9.4" />
  </>
);

export const IcGlobe = make(
  <>
    <circle cx="12" cy="12" r="8.6" />
    <path d="M3.4 12h17.2M12 3.4c2.6 2.5 3.9 5.4 3.9 8.6s-1.3 6.1-3.9 8.6c-2.6-2.5-3.9-5.4-3.9-8.6s1.3-6.1 3.9-8.6z" />
  </>
);

export const IcGhost = make(
  <>
    <path d="M5.5 20.5V11a6.5 6.5 0 0 1 13 0v9.5l-2.6-2-2.6 2-2.6-2-2.6 2z" />
    <path d="M9.5 10.5v1M14.5 10.5v1" />
  </>
);

export const IcServer = make(
  <>
    <rect x="3.5" y="4" width="17" height="7" />
    <rect x="3.5" y="13" width="17" height="7" />
    <path d="M6.8 7.5h.01M6.8 16.5h.01M10.5 7.5h3M10.5 16.5h3" />
  </>
);

export const IcShield = make(
  <>
    <path d="M12 3.2 5 5.8v5.4c0 4.4 2.9 7.6 7 9.6 4.1-2 7-5.2 7-9.6V5.8z" />
    <path d="m9 11.8 2.1 2.1L15.2 9.7" />
  </>
);

export const IcBolt = make(<path d="M13 2.5 4.5 13.5H11l-1 8 8.5-11H12z" />);

export const IcCheck = make(<path d="m4.5 12.5 5 5 10-11" />);

export const IcX = make(<path d="m5.5 5.5 13 13M18.5 5.5l-13 13" />);

export const IcArrow = make(<path d="M4 12h15M13.5 6l6 6-6 6" />);

export const IcLink = make(
  <>
    <path d="M9.5 14.5 14.5 9.5" />
    <path d="M11 6.5 13 4.5a4 4 0 0 1 5.7 5.7L16.5 12.4M13 17.5l-2 2a4 4 0 0 1-5.7-5.7l2.2-2.2" />
  </>
);

export const IcAlert = make(
  <>
    <path d="M12 3.5 1.9 20.5h20.2z" />
    <path d="M12 9.5v5M12 17.5v.01" />
  </>
);

export const IcUpload = make(
  <>
    <path d="M12 15.5V3.5M7 8.5l5-5 5 5" />
    <path d="M4 15.5v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
  </>
);

export const IcDoc = make(
  <>
    <path d="M6 2.5h8L20 8.5v13H6z" />
    <path d="M14 2.5v6h6M9 13h6M9 16.5h6" />
  </>
);

export const IcRadar = make(
  <>
    <circle cx="12" cy="12" r="8.6" />
    <circle cx="12" cy="12" r="4.3" />
    <path d="M12 12 18 6" />
  </>
);

export const IcLock = make(
  <>
    <rect x="5" y="10.5" width="14" height="10" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3M12 14.5v2.5" />
  </>
);

export const IcTrash = make(
  <>
    <path d="M4.5 6.5h15M9.5 6V4h5v2M6.5 6.5l1 14h9l1-14M10 10.5v6M14 10.5v6" />
  </>
);

export const IcCross = make(
  <>
    <circle cx="12" cy="12" r="8.6" />
    <path d="M12 7.5v9M7.5 12h9" />
  </>
);

export const IcRefresh = make(
  <>
    <path d="M20 12a8 8 0 1 1-2.3-5.6M20 3.5v4h-4" />
  </>
);

export const IcCopy = make(
  <>
    <rect x="9" y="9" width="11" height="11" />
    <path d="M5 15H4V4h11v1" />
  </>
);
