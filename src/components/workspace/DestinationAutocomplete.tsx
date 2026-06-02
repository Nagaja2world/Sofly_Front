import { useState, useRef, useEffect, type ChangeEvent, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { searchPlaces, type PlaceResult } from '@/api/scheduleApi';

interface DestinationAutocompleteProps {
  value: string;
  onSelect: (destination: string, countryCode: string | null) => void | Promise<void>;
  onCancel: () => void;
  placeholder?: string;
  inputClassName?: string;
}

function extractCountryCode(place: PlaceResult): string | null {
  return place.addressComponents?.find((c) => c.types.includes('country'))?.shortText ?? null;
}

export default function DestinationAutocomplete({
  value,
  onSelect,
  onCancel,
  placeholder = '목적지 검색...',
  inputClassName = '',
}: DestinationAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const updateDropdownPos = () => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 240),
      zIndex: 9999,
    });
  };

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      updateDropdownPos();
      try {
        const places = await searchPlaces(text);
        setResults(places);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleSelect = async (place: PlaceResult) => {
    if (isSaving) return;
    setIsSaving(true);
    setResults([]);
    try {
      await onSelect(place.displayName.text, extractCountryCode(place));
    } catch (err) {
      console.warn('[DestinationAutocomplete] 저장 실패:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const showDropdown = results.length > 0 || isSearching;

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isSaving}
        className={inputClassName}
      />
      {showDropdown &&
        createPortal(
          <div
            style={dropdownStyle}
            className="bg-white border border-gray-200 rounded-xl shadow-xl py-1 overflow-auto max-h-[280px]"
          >
            {isSearching && results.length === 0 && (
              <div className="flex items-center justify-center py-4">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              </div>
            )}
            {results.map((place) => (
              <button
                key={place.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(place);
                }}
                className="flex flex-col w-full px-3 py-2 text-left hover:bg-gray-50 cursor-pointer border-none bg-transparent transition-colors"
              >
                <span className="font-pretendard text-body4 text-gray-900 truncate">
                  {place.displayName.text}
                </span>
                <span className="font-pretendard text-[11px] text-gray-400 truncate">
                  {place.formattedAddress}
                </span>
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
