import { useState, useEffect, useRef } from "react";
import {
  searchHotelDestinations,
  type HotelDestination,
} from "@/api/hotelApi";

export function useHotelDestinations(query: string, debounceMs = 300) {
  const [results, setResults] = useState<HotelDestination[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    timerRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await searchHotelDestinations(query);
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, debounceMs]);

  const clear = () => setResults([]);

  return { results, isLoading, clear };
}
