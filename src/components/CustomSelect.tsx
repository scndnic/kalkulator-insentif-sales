import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  rightLabel?: string;
}

interface CustomSelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
}

export default function CustomSelect({
  value,
  options,
  onChange,
  placeholder = 'Pilih opsi',
  className = '',
  buttonClassName = '',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listId}
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setIsOpen(false);
        }}
        className={`flex min-h-10 w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-left text-sm text-gray-900 shadow-sm transition-all hover:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:border-brand-500 ${buttonClassName}`}
      >
        <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
          <span className={`block min-w-0 truncate ${selectedOption ? '' : 'text-gray-400 dark:text-gray-500'}`}>
            {selectedOption?.label || placeholder}
          </span>
          {selectedOption?.rightLabel && (
            <span className="hidden flex-shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400 sm:inline">
              {selectedOption.rightLabel}
            </span>
          )}
        </span>
        <ChevronDown className={`h-4 w-4 flex-shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-[70] mt-2 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-2xl shadow-gray-900/15 outline-none dark:border-gray-700 dark:bg-gray-900 dark:shadow-black/40"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value || '__empty'}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`flex min-h-9 w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  isSelected
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800'
                }`}
              >
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {option.rightLabel && (
                  <span className={`flex-shrink-0 text-xs font-semibold ${isSelected ? 'text-white/85' : 'text-gray-500 dark:text-gray-400'}`}>
                    {option.rightLabel}
                  </span>
                )}
                {isSelected && <Check className="h-4 w-4 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
