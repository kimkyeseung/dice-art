'use client';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  size?: 'sm' | 'md';
}

export function Switch({ checked, onChange, label, size = 'md' }: SwitchProps) {
  const sizes = {
    sm: {
      track: 'w-8 h-4',
      thumb: 'w-3 h-3',
      translate: 'translate-x-4',
    },
    md: {
      track: 'w-10 h-5',
      thumb: 'w-4 h-4',
      translate: 'translate-x-5',
    },
  };

  const s = sizes[size];

  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex items-center rounded-full transition-colors duration-200
          ${s.track}
          ${checked ? 'bg-blue-500' : 'bg-neutral-300'}
        `}
      >
        <span
          className={`
            inline-block rounded-full bg-white shadow-sm transition-transform duration-200
            ${s.thumb}
            ${checked ? s.translate : 'translate-x-0.5'}
          `}
        />
      </button>
      {label && (
        <span className="text-xs sm:text-sm text-neutral-600">{label}</span>
      )}
    </label>
  );
}

export default Switch;
