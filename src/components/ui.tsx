import type { CSSProperties, ReactNode } from 'react';
import type { Tone } from '../lib/data';

export const TONE_TEXT: Record<Tone, string> = {
  mint: 'text-mint',
  amber: 'text-amber',
  coral: 'text-coral',
  sky: 'text-sky',
  mute: 'text-mute',
};

export const TONE_BG: Record<Tone, string> = {
  mint: 'bg-mint',
  amber: 'bg-amber',
  coral: 'bg-coral',
  sky: 'bg-sky',
  mute: 'bg-mute',
};

const BADGE: Record<Tone, string> = {
  mint: 'border-mint/40 bg-mint/10 text-mint',
  amber: 'border-amber/40 bg-amber/10 text-amber',
  coral: 'border-coral/40 bg-coral/10 text-coral',
  sky: 'border-sky/40 bg-sky/10 text-sky',
  mute: 'border-line bg-ink-800 text-dim',
};

const DOT: Record<Tone, string> = {
  mint: 'bg-mint',
  amber: 'bg-amber',
  coral: 'bg-coral',
  sky: 'bg-sky',
  mute: 'bg-mute',
};

export function Panel({
  title,
  right,
  children,
  className = '',
  bodyClassName = 'p-4',
  delay = 0,
}: {
  title?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  delay?: number;
}) {
  const style: CSSProperties = delay ? { animationDelay: `${delay}ms` } : {};
  return (
    <section className={`panel corners anim-fade-up ${className}`} style={style}>
      {title && (
        <header className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-line-soft">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="w-1.5 h-1.5 bg-mint shrink-0"
              style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }}
            />
            <h2 className="font-mono text-[11px] tracking-[0.18em] uppercase text-dim truncate">
              {title}
            </h2>
          </div>
          {right}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function ViewHead({
  code,
  title,
  desc,
  right,
}: {
  code: string;
  title: string;
  desc: string;
  right?: ReactNode;
}) {
  return (
    <header className="mb-6 anim-fade-up">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <div className="font-mono text-[11px] tracking-[0.3em] text-mint/80 uppercase mb-2">
            <span className="text-mute">{code.split(' / ')[0]} /</span> {code.split(' / ')[1]}
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-fog">
            {title}
          </h1>
          <p className="text-dim text-sm mt-2 leading-relaxed">{desc}</p>
        </div>
        {right}
      </div>
    </header>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone = 'mint',
  spark,
  delay = 0,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  tone?: Tone;
  spark?: number[];
  delay?: number;
}) {
  return (
    <div
      className="panel corners p-4 anim-fade-up flex flex-col justify-between min-h-[108px]"
      style={delay ? { animationDelay: `${delay}ms` } : {}}
    >
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">{label}</div>
      <div className="flex items-end justify-between gap-2 mt-2">
        <div>
          <div className={`font-display text-[28px] leading-none font-bold tabular ${TONE_TEXT[tone]}`}>
            {value}
          </div>
          {sub && <div className="text-[11px] text-dim mt-1.5">{sub}</div>}
        </div>
        {spark && <Sparkline data={spark} tone={tone} />}
      </div>
    </div>
  );
}

export function Meter({
  value,
  tone = 'mint',
  className = 'h-1',
}: {
  value: number;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div className={`w-full bg-ink-700 overflow-hidden ${className}`}>
      <div
        className={`h-full ${TONE_BG[tone]} transition-all duration-700 ease-out`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function Badge({
  tone = 'mute',
  children,
  className = '',
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider border whitespace-nowrap ${BADGE[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function StatusDot({ tone = 'mint', pulse = false }: { tone?: Tone; pulse?: boolean }) {
  return (
    <span className="relative inline-flex w-1.5 h-1.5 shrink-0">
      <span className={`w-1.5 h-1.5 ${DOT[tone]} ${pulse ? 'dot-live' : ''}`} />
    </span>
  );
}

export function Sparkline({
  data,
  tone = 'mint',
  w = 84,
  h = 26,
}: {
  data: number[];
  tone?: Tone;
  w?: number;
  h?: number;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (w - 2) + 1;
    const y = h - 3 - ((v - min) / (max - min || 1)) * (h - 6);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const last = pts[pts.length - 1].split(',');
  return (
    <svg width={w} height={h} className={`${TONE_TEXT[tone]} shrink-0`} aria-hidden="true">
      <polyline points={pts.join(' ')} fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.85" />
      <circle cx={last[0]} cy={last[1]} r="2.2" fill="currentColor" />
    </svg>
  );
}

export function Btn({
  children,
  onClick,
  tone = 'mint',
  ghost = false,
  disabled = false,
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: Tone;
  ghost?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const solid: Record<Tone, string> = {
    mint: 'bg-mint text-ink-950 hover:bg-[#63f0bb]',
    amber: 'bg-amber text-ink-950 hover:bg-[#ffc554]',
    coral: 'bg-coral text-ink-950 hover:bg-[#ff7a72]',
    sky: 'bg-sky text-ink-950 hover:bg-[#7cd4f2]',
    mute: 'bg-ink-700 text-fog hover:bg-ink-600',
  };
  const ghosted: Record<Tone, string> = {
    mint: 'border-line text-dim hover:text-mint hover:border-mint/50',
    amber: 'border-line text-dim hover:text-amber hover:border-amber/50',
    coral: 'border-coral/40 text-coral hover:bg-coral/10',
    sky: 'border-line text-dim hover:text-sky hover:border-sky/50',
    mute: 'border-line text-dim hover:text-fog hover:border-mute',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider border transition-all duration-200 active:translate-y-px disabled:opacity-40 disabled:pointer-events-none cursor-pointer ${
        ghost ? `bg-transparent ${ghosted[tone]}` : `border-transparent ${solid[tone]}`
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider border transition-colors duration-200 cursor-pointer ${
        active
          ? 'border-mint/60 bg-mint/10 text-mint'
          : 'border-line text-mute hover:text-dim hover:border-mute'
      }`}
    >
      {children}
    </button>
  );
}
