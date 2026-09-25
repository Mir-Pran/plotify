'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, ArrowRight, X } from 'lucide-react';

export function TakaIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center font-black select-none leading-none ${className}`}
      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
      aria-hidden="true"
    >
      ৳
    </span>
  );
}

export interface BudgetPresetOption {
  value?: string;
  val?: string;
  label: string;
  min?: number;
  max?: number | null;
}

interface BudgetSelectProps {
  value: string;
  customMin: string;
  customMax: string;
  onChange: (value: string, customMin?: string, customMax?: string) => void;
  options: BudgetPresetOption[];
  placeholder?: string;
  className?: string;
}

export function BudgetSelect({
  value,
  customMin,
  customMax,
  onChange,
  options,
  placeholder = 'Any Budget',
  className = '',
}: BudgetSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [minInput, setMinInput] = useState(customMin);
  const [maxInput, setMaxInput] = useState(customMax);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMinInput(customMin);
    setMaxInput(customMax);
  }, [customMin, customMax]);

  // Close dropdown on outside click or Escape key
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

  // Determine display label on the trigger button
  let displayLabel = placeholder;
  if (value === 'custom' || customMin || customMax) {
    if (customMin && customMax) {
      displayLabel = `৳ ${Number(customMin).toLocaleString()} – ৳ ${Number(customMax).toLocaleString()}`;
    } else if (customMin) {
      displayLabel = `Min ৳ ${Number(customMin).toLocaleString()}`;
    } else if (customMax) {
      displayLabel = `Up to ৳ ${Number(customMax).toLocaleString()}`;
    } else {
      displayLabel = 'Custom Range';
    }
  } else if (value) {
    const matched = options.find((opt) => (opt.value || opt.val) === value);
    if (matched) displayLabel = matched.label;
  }

  const handleApplyCustom = (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const cleanMin = minInput ? minInput.toString().trim() : '';
    const cleanMax = maxInput ? maxInput.toString().trim() : '';
    if (!cleanMin && !cleanMax) {
      onChange('', '', '');
      setIsOpen(false);
      return;
    }
    onChange('custom', cleanMin, cleanMax);
    setIsOpen(false);
  };

  const handleSelectPreset = (presetVal: string) => {
    onChange(presetVal, '', '');
    setMinInput('');
    setMaxInput('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('', '', '');
    setMinInput('');
    setMaxInput('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${isOpen ? 'z-50' : 'z-10'}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white/80 dark:bg-white/5 backdrop-blur-md border border-slate-200/80 dark:border-white/10
          rounded-xl px-3 py-2.5 text-xs text-left flex items-center justify-between
          transition-all outline-none cursor-pointer hover:border-slate-300 dark:hover:border-white/25
          hover:bg-white dark:hover:bg-white/10 active:scale-[0.99]
          ${isOpen ? 'border-brand-500 ring-2 ring-brand-500/20 bg-white dark:bg-white/10' : ''}
          ${className}
        `.replace(/\s+/g, ' ').trim()}
      >
        <div className="flex items-center gap-1.5 truncate mr-1">
          <span className="w-5 h-5 rounded-md bg-emerald-500/10 dark:bg-emerald-400/15 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
            <TakaIcon className="text-xs" />
          </span>
          <span
            className={`truncate font-medium ${
              value || customMin || customMax ? 'text-slate-900 dark:text-slate-100 font-semibold' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {displayLabel}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-brand-500 dark:text-brand-400' : ''
          }`}
        />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div
          className="absolute left-0 sm:right-0 sm:left-auto top-[calc(100%+6px)] w-full min-w-[280px] max-w-[340px]
            rounded-2xl bg-white dark:bg-[#0c1526] border border-slate-200/90 dark:border-white/20
            shadow-[0_20px_50px_rgba(0,0,0,0.3),0_0_25px_rgba(16,185,129,0.12)]
            z-[100] p-3 focus:outline-none animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Preset Options Section */}
          <div className="space-y-1">
            <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
              <span>Popular Budgets</span>
              {(value || customMin || customMax) && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-rose-500 hover:text-rose-600 dark:text-rose-400 text-[10px] lowercase hover:underline flex items-center gap-0.5 cursor-pointer font-bold"
                >
                  <X className="w-2.5 h-2.5" /> reset
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => handleSelectPreset('')}
              className={`w-full px-2.5 py-1.5 text-xs text-left flex items-center justify-between rounded-lg transition-all ${
                !value && !customMin && !customMax
                  ? 'bg-brand-50 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 font-bold border-l-2 border-brand-500'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
              }`}
            >
              <span>Any Budget (No Filter)</span>
              {!value && !customMin && !customMax && <Check className="w-3.5 h-3.5 text-brand-500" />}
            </button>

            {options.map((opt) => {
              const optVal = (opt.value || opt.val || '');
              const isSelected = value === optVal;
              return (
                <button
                  key={optVal}
                  type="button"
                  onClick={() => handleSelectPreset(optVal)}
                  className={`w-full px-2.5 py-1.5 text-xs text-left flex items-center justify-between rounded-lg transition-all ${
                    isSelected
                      ? 'bg-brand-50 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 font-bold border-l-2 border-brand-500'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-brand-500" />}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="my-2.5 border-t border-slate-200 dark:border-white/10" />

          {/* Custom Range Section (uses DIV instead of FORM to avoid nested form hydration error) */}
          <div className="space-y-2">
            <div className="px-1 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-[11px]">
                ৳
              </span>
              <span>Custom Range (Min – Max)</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                  ৳
                </span>
                <input
                  type="number"
                  placeholder="Min BDT"
                  value={minInput}
                  onChange={(e) => setMinInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                      handleApplyCustom(e);
                    }
                  }}
                  className="w-full pl-6 pr-2 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-600 text-slate-900 dark:text-white outline-none focus:border-brand-500 font-mono font-medium"
                />
              </div>

              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                  ৳
                </span>
                <input
                  type="number"
                  placeholder="Max BDT"
                  value={maxInput}
                  onChange={(e) => setMaxInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                      handleApplyCustom(e);
                    }
                  }}
                  className="w-full pl-6 pr-2 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-600 text-slate-900 dark:text-white outline-none focus:border-brand-500 font-mono font-medium"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleApplyCustom}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-glow-sm transition-all cursor-pointer active:scale-95"
              >
                <span>Apply Range</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
