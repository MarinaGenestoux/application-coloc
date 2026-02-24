import { useState, useRef, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

export interface AutocompleteOption {
  value: string;
  label: string;
}

interface AutocompleteProps {
  label?: string;
  placeholder?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  value: string;
  onSelect: (value: string) => void;
  fetchOptions: (query: string) => Promise<AutocompleteOption[]>;
  debounceMs?: number;
  minChars?: number;
  noResultsText?: string;
  disabled?: boolean;
}

const DEFAULT_DEBOUNCE_MS = 300;
const DEFAULT_MIN_CHARS = 2;

export const Autocomplete = ({
  label,
  placeholder,
  error,
  hint,
  leftIcon,
  value,
  onSelect,
  fetchOptions,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  minChars = DEFAULT_MIN_CHARS,
  noResultsText = 'Aucun résultat',
  disabled = false,
}: AutocompleteProps) => {
  const [inputValue, setInputValue] = useState(value);
  const [options, setOptions] = useState<AutocompleteOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const latestQueryRef = useRef('');
  const selectedRef = useRef(false);

  // Sync inputValue when parent value changes externally
  useEffect(() => {
    if (!value) {
      setInputValue('');
      selectedRef.current = false;
    }
  }, [value]);

  const handleFetch = useCallback(
    async (query: string) => {
      latestQueryRef.current = query;
      setIsLoading(true);
      try {
        const results = await fetchOptions(query);
        if (latestQueryRef.current === query) {
          setOptions(results);
          setIsOpen(true);
          setHighlightedIndex(-1);
        }
      } catch (_err) {
        if (latestQueryRef.current === query) {
          setOptions([]);
        }
      } finally {
        if (latestQueryRef.current === query) {
          setIsLoading(false);
        }
      }
    },
    [fetchOptions],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);

    // If user modifies text after a selection, reset parent value
    if (selectedRef.current) {
      selectedRef.current = false;
      onSelect('');
    }

    clearTimeout(debounceRef.current);

    if (val.length < minChars) {
      setOptions([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(() => handleFetch(val), debounceMs);
  };

  const handleSelect = (option: AutocompleteOption) => {
    setInputValue(option.label);
    selectedRef.current = true;
    onSelect(option.value);
    setIsOpen(false);
    setOptions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || options.length === 0) {
      if (e.key === 'ArrowDown' && inputValue.length >= minChars) {
        handleFetch(inputValue);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % options.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + options.length) % options.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < options.length) {
          handleSelect(options[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        if (selectedRef.current) {
          setInputValue(value);
        }
        break;
    }
  };

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  return (
    <div ref={containerRef} className="w-full space-y-1.5 relative">
      {label && (
        <label className="block text-sm font-medium text-slate-700">{label}</label>
      )}

      <div className="relative group">
        {leftIcon && (
          <div className="pointer-events-none absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary">
            {leftIcon}
          </div>
        )}
        <input
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls="autocomplete-listbox"
          aria-activedescendant={highlightedIndex >= 0 ? `autocomplete-option-${highlightedIndex}` : undefined}
          className={`
            w-full h-12 rounded-xl border bg-white
            text-sm text-slate-800 placeholder:text-slate-400
            shadow-sm transition-all duration-200 outline-none
            hover:shadow-md hover:border-slate-300
            ${leftIcon ? 'pl-11 sm:pl-12' : 'pl-3.5 sm:pl-4'}
            pr-10
            ${
              error
                ? 'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-50 focus:shadow-md'
                : 'border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:shadow-md'
            }
          `}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        )}
      </div>

      {isOpen && options.length > 0 && (
        <ul
          ref={listRef}
          id="autocomplete-listbox"
          role="listbox"
          className="absolute z-50 w-full mt-1 max-h-60 overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg"
        >
          {options.map((option, index) => (
            <li
              key={`${option.value}-${index}`}
              id={`autocomplete-option-${index}`}
              role="option"
              aria-selected={highlightedIndex === index}
              className={`px-4 py-3 text-sm cursor-pointer transition-colors duration-100
                ${highlightedIndex === index ? 'bg-primary/10 text-primary' : 'text-slate-700 hover:bg-slate-50'}`}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(option);
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}

      {isOpen && !isLoading && inputValue.length >= minChars && options.length === 0 && (
        <div className="absolute z-50 w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 bg-white shadow-lg text-sm text-slate-400">
          {noResultsText}
        </div>
      )}

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
};
