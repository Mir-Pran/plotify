'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface GlassSelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface GlassSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: GlassSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function GlassSelect({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  disabled = false,
  className = '',
  id,
}: GlassSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${isOpen ? 'z-50' : 'z-10'}`}
    >
      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white/80 dark:bg-white/5 backdrop-blur-md border border-slate-200/80 dark:border-white/10
          rounded-xl px-3 py-2.5 text-xs text-left flex items-center justify-between
          transition-all outline-none cursor-pointer
          ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:border-slate-300 dark:hover:border-white/25 hover:bg-white dark:hover:bg-white/10 active:scale-[0.99]'}
          ${isOpen ? 'border-brand-500 ring-2 ring-brand-500/20 bg-white dark:bg-white/10' : ''}
          ${className}
        `.replace(/\s+/g, ' ').trim()}
      >
        <span
          className={`truncate mr-2 font-medium ${
            value ? 'text-slate-900 dark:text-slate-100 font-semibold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {displayLabel}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-brand-500 dark:text-brand-400' : ''
          }`}
        />
      </button>

      {/* Glass Popover Menu */}
      {isOpen && !disabled && (
        <div
          className="absolute left-0 top-[calc(100%+6px)] w-full min-w-[200px] max-h-56 overflow-y-auto
            rounded-xl bg-white dark:bg-[#0c1526] border border-slate-200 dark:border-white/20
            shadow-[0_20px_50px_rgba(0,0,0,0.25),0_0_20px_rgba(16,185,129,0.12)]
            z-[100] p-1.5 focus:outline-none animate-in fade-in zoom-in-95 duration-150"
          style={{
            scrollbarWidth: 'thin',
          }}
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-400 italic text-center">
              No options available
            </div>
          ) : (
            options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-xs text-left flex items-center justify-between
                    transition-all rounded-lg my-0.5
                    ${
                      isSelected
                        ? 'bg-brand-50 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 font-bold border-l-2 border-brand-500 dark:border-brand-400 pl-2.5'
                        : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
                    }
                  `}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0 ml-2" />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
