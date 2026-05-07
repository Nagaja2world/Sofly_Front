const API_BASE = import.meta.env.VITE_API_BASE_URL;

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("accessToken");
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

interface ApiResponse<T> {
  success: boolean;
  code: string;
  message: string;
  data: T;
}

async function unwrap<T>(res: Response): Promise<T> {
  if (res.status === 204) return null as T;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json: ApiResponse<T> = await res.json();
  if (!json.success) throw new Error(json.message ?? "알 수 없는 오류");
  return json.data;
}

export type VisitStatus = "UNVISITED" | "PLANNED" | "VISITED";

export interface VisitedCountry {
  id: number;
  countryCode: string;
  countryName: string;
  status: VisitStatus;
  continent: string;
  continentName: string;
  visitCount: number;
}

export interface VisitedCity {
  id: number;
  cityName: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  status: VisitStatus;
  visitCount: number;
}

export interface ConquestMapData {
  countries: VisitedCountry[];
  cities: VisitedCity[];
}

export interface ContinentStat {
  continent: string;
  continentName: string;
  visitedCountryCount: number;
}

export interface ConquestStats {
  visitedCountryCount: number;
  totalCountryCount: number;
  visitedCountryPercentage: number;
  visitedCityCount: number;
  totalTravelDays: number;
  totalDistanceKm: number;
  continentStats: ContinentStat[];
}

export interface TripRoute {
  flightId: number;
  workspaceId: number;
  workspaceTitle: string;
  departureAirport: string;
  departureCity: string;
  departureCountryCode: string;
  departureLat: number;
  departureLng: number;
  arrivalAirport: string;
  arrivalCity: string;
  arrivalCountryCode: string;
  arrivalLat: number;
  arrivalLng: number;
  departureTime: string;
  arrivalTime: string;
  airline: string;
  flightNumber: string;
  distanceKm: number;
  routeType: string;
}

export interface WorkspaceConquest {
  id: number;
  title: string;
  destination: string;
  countryCode: string;
  startDate: string;
  endDate: string;
  coverImageUrl: string | null;
  memberCount: number;
}

export interface BulkImportBody {
  countries?: { countryCode: string; status: VisitStatus }[];
  cities?: {
    cityName: string;
    countryCode: string;
    latitude: number;
    longitude: number;
    status: VisitStatus;
  }[];
}

export async function getConquestMap(): Promise<ConquestMapData> {
  const res = await fetch(`${API_BASE}/api/conquest`, { headers: authHeaders() });
  return unwrap<ConquestMapData>(res);
}

export async function getConquestStats(): Promise<ConquestStats> {
  const res = await fetch(`${API_BASE}/api/conquest/stats`, { headers: authHeaders() });
  return unwrap<ConquestStats>(res);
}

export async function getConquestRoutes(): Promise<TripRoute[]> {
  const res = await fetch(`${API_BASE}/api/conquest/routes`, { headers: authHeaders() });
  return unwrap<TripRoute[]>(res);
}

export async function getCountryWorkspaces(countryCode: string): Promise<WorkspaceConquest[]> {
  const res = await fetch(`${API_BASE}/api/conquest/countries/${countryCode}/workspaces`, {
    headers: authHeaders(),
  });
  return unwrap<WorkspaceConquest[]>(res);
}

export async function updateCountryStatus(
  countryCode: string,
  status: VisitStatus
): Promise<VisitedCountry> {
  const res = await fetch(`${API_BASE}/api/conquest/countries/${countryCode}/status`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
  return unwrap<VisitedCountry>(res);
}

export async function updateCityStatus(cityId: number, status: VisitStatus): Promise<VisitedCity> {
  const res = await fetch(`${API_BASE}/api/conquest/cities/${cityId}/status`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
  return unwrap<VisitedCity>(res);
}

export async function bulkImport(body: BulkImportBody): Promise<void> {
  const res = await fetch(`${API_BASE}/api/conquest/bulk-import`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  await unwrap<null>(res);
}
