import { Client, Loan, LoanStatus } from '../types';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface RouteStop {
  client: Client;
  loan?: Loan;
  coords: GeoPoint;
  order: number;
  distanceFromPreviousKm: number;
  cumulativeDistanceKm: number;
  estimatedArrivalMins: number;
  installmentAmount: number;
  totalRemaining: number;
  isOverdue: boolean;
  isDueToday: boolean;
  overdueDays: number;
}

export interface OptimizedRouteResult {
  origin: GeoPoint;
  originName: string;
  stops: RouteStop[];
  totalDistanceKm: number;
  totalEstimatedTimeMins: number;
  totalInstallmentsToCollect: number;
  totalPortfolioAtRisk: number;
  googleMapsUrl: string;
  wazeFirstStopUrl: string;
}

export interface SectorRiskSummary {
  sectorName: string;
  municipality: string;
  centerCoords: GeoPoint;
  totalClients: number;
  activeLoansCount: number;
  totalDisbursedAmount: number;
  totalRemainingBalance: number;
  totalOverdueBalance: number;
  overduePercentage: number;
  riskLevel: 'Bajo' | 'Medio' | 'Alto' | 'Critico';
}

// Default reference coordinates for Dominican Republic locations
export const DEFAULT_OFFICE_COORDS: GeoPoint = { lat: 18.4861, lng: -69.9312 }; // Santo Domingo

// Province and Municipality reference centers in RD for smart fallback
export const MUNICIPALITY_GEO_CENTERS: Record<string, GeoPoint> = {
  'distrito nacional': { lat: 18.4861, lng: -69.9312 },
  'santo domingo este': { lat: 18.4883, lng: -69.8571 },
  'santo domingo oeste': { lat: 18.4988, lng: -69.9886 },
  'santo domingo norte': { lat: 18.5358, lng: -69.8972 },
  'santiago': { lat: 19.4517, lng: -70.6970 },
  'la vega': { lat: 19.2220, lng: -70.5296 },
  'san cristobal': { lat: 18.4167, lng: -70.1000 },
  'san pedro de macoris': { lat: 18.4539, lng: -69.3086 },
  'la romana': { lat: 18.4273, lng: -68.9728 },
  'higuey': { lat: 18.6150, lng: -68.7079 },
  'puerto plata': { lat: 19.7934, lng: -70.6884 },
  'san francisco de macoris': { lat: 19.3009, lng: -70.2526 },
  'moca': { lat: 19.3935, lng: -70.5259 },
  'bona': { lat: 18.9442, lng: -70.4093 },
  'bani': { lat: 18.2796, lng: -70.3319 },
  'azua': { lat: 18.4532, lng: -70.7349 },
  'barahona': { lat: 18.2085, lng: -71.1008 }
};

/**
 * Calculates Haversine distance in kilometers between two geo coordinates
 */
export const calculateHaversineDistanceKm = (
  p1: GeoPoint,
  p2: GeoPoint
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLon = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
};

/**
 * Deterministically resolves or generates coordinates for any client
 * Guaranteed to return valid coordinates so existing clients without GPS work seamlessly
 */
export const resolveClientCoords = (client: Client, fallbackIndex: number = 0): GeoPoint => {
  if (client.coordinates && typeof client.coordinates.lat === 'number' && typeof client.coordinates.lng === 'number') {
    return { lat: client.coordinates.lat, lng: client.coordinates.lng };
  }
  if (client.lat && client.lng && !isNaN(Number(client.lat)) && !isNaN(Number(client.lng))) {
    return { lat: Number(client.lat), lng: Number(client.lng) };
  }

  // Check municipality / province match
  const munKey = (client.municipality || client.province || '').toLowerCase().trim();
  let baseCoords = DEFAULT_OFFICE_COORDS;
  for (const [key, coords] of Object.entries(MUNICIPALITY_GEO_CENTERS)) {
    if (munKey.includes(key)) {
      baseCoords = coords;
      break;
    }
  }

  // Spread gentle pseudo-random offset based on client ID / index
  const hash = (client.id || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + fallbackIndex * 29;
  const angle = (hash % 360) * (Math.PI / 180);
  const radius = 0.008 + ((hash % 80) / 80) * 0.025; // ~1-4 km dispersion

  return {
    lat: baseCoords.lat + radius * Math.cos(angle),
    lng: baseCoords.lng + radius * Math.sin(angle)
  };
};

/**
 * Calculates overdue days for a loan
 */
export const calculateOverdueDays = (nextPaymentDate?: string): number => {
  if (!nextPaymentDate) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(nextPaymentDate);
  dueDate.setHours(0, 0, 0, 0);
  const diffTime = today.getTime() - dueDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

/**
 * Solves the Shortest Path / Traveling Salesperson Problem (TSP) using Nearest Neighbor Heuristic
 */
export const optimizeCollectionRoute = (
  origin: GeoPoint,
  originName: string,
  targetClients: Client[],
  loans: Loan[]
): OptimizedRouteResult => {
  if (targetClients.length === 0) {
    return {
      origin,
      originName,
      stops: [],
      totalDistanceKm: 0,
      totalEstimatedTimeMins: 0,
      totalInstallmentsToCollect: 0,
      totalPortfolioAtRisk: 0,
      googleMapsUrl: '',
      wazeFirstStopUrl: ''
    };
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const unvisited = targetClients.map((client, idx) => {
    const coords = resolveClientCoords(client, idx);
    const clientLoans = loans.filter(
      l => l.clientId === client.id && l.status !== LoanStatus.PAID && l.status !== LoanStatus.REJECTED
    );
    const isOverdue = clientLoans.some(
      l => l.status === LoanStatus.OVERDUE || (l.status as string) === 'Vencido'
    );
    const isDueToday = clientLoans.some(l => l.nextPaymentDate === todayStr);
    const totalRemaining = clientLoans.reduce((sum, l) => sum + (Number(l.remainingBalance) || 0), 0);
    const primaryLoan = clientLoans[0];
    const installmentAmount = primaryLoan?.installmentAmount || (primaryLoan ? Math.round(primaryLoan.totalToPay / (primaryLoan.installments || 1)) : 0);
    const overdueDays = primaryLoan ? calculateOverdueDays(primaryLoan.nextPaymentDate) : 0;

    return {
      client,
      loan: primaryLoan,
      coords,
      isOverdue,
      isDueToday,
      totalRemaining,
      installmentAmount,
      overdueDays
    };
  });

  let currentPoint = origin;
  let cumulativeDist = 0;
  let cumulativeTimeMins = 0;
  const orderedStops: RouteStop[] = [];

  let totalInstallments = 0;
  let totalAtRisk = 0;

  while (unvisited.length > 0) {
    // Find nearest neighbor
    let nearestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const dist = calculateHaversineDistanceKm(currentPoint, unvisited[i].coords);
      if (dist < minDistance) {
        minDistance = dist;
        nearestIndex = i;
      }
    }

    const [nearest] = unvisited.splice(nearestIndex, 1);
    cumulativeDist += minDistance;
    
    // Average 25 km/h urban speed -> minDistance / 25 * 60 mins + 8 mins per collection stop
    const travelTimeMins = Math.round((minDistance / 25) * 60);
    cumulativeTimeMins += travelTimeMins + 8; // 8 mins collection time buffer

    totalInstallments += nearest.installmentAmount;
    if (nearest.isOverdue) {
      totalAtRisk += nearest.totalRemaining;
    }

    orderedStops.push({
      client: nearest.client,
      loan: nearest.loan,
      coords: nearest.coords,
      order: orderedStops.length + 1,
      distanceFromPreviousKm: minDistance,
      cumulativeDistanceKm: Math.round(cumulativeDist * 10) / 10,
      estimatedArrivalMins: cumulativeTimeMins,
      installmentAmount: nearest.installmentAmount,
      totalRemaining: nearest.totalRemaining,
      isOverdue: nearest.isOverdue,
      isDueToday: nearest.isDueToday,
      overdueDays: nearest.overdueDays
    });

    currentPoint = nearest.coords;
  }

  // Generate Google Maps Multi-Stop Navigation URL (Supports up to 10 waypoints natively)
  const waypointLimit = orderedStops.slice(0, 9);
  const destination = orderedStops[orderedStops.length - 1];
  
  let googleMapsUrl = '';
  if (orderedStops.length > 0) {
    const originParam = `${origin.lat},${origin.lng}`;
    const destParam = destination ? `${destination.coords.lat},${destination.coords.lng}` : originParam;
    const waypointsParam = waypointLimit
      .slice(0, -1)
      .map(s => `${s.coords.lat},${s.coords.lng}`)
      .join('|');

    googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
      originParam
    )}&destination=${encodeURIComponent(destParam)}${
      waypointsParam ? `&waypoints=${encodeURIComponent(waypointsParam)}` : ''
    }&travelmode=driving`;
  }

  const firstStop = orderedStops[0];
  const wazeFirstStopUrl = firstStop
    ? `https://waze.com/ul?ll=${firstStop.coords.lat},${firstStop.coords.lng}&navigate=yes`
    : '';

  return {
    origin,
    originName,
    stops: orderedStops,
    totalDistanceKm: Math.round(cumulativeDist * 10) / 10,
    totalEstimatedTimeMins: cumulativeTimeMins,
    totalInstallmentsToCollect: totalInstallments,
    totalPortfolioAtRisk: totalAtRisk,
    googleMapsUrl,
    wazeFirstStopUrl
  };
};

/**
 * Aggregates clients and loans by geographic sector / neighborhood to compute risk zoning
 */
export const calculateSectorRiskZoning = (
  clients: Client[],
  loans: Loan[]
): SectorRiskSummary[] => {
  const sectorMap = new Map<string, { clients: Client[]; coordsList: GeoPoint[] }>();

  clients.forEach((c, idx) => {
    const sectorRaw = (c.sector || c.municipality || c.province || 'Sector General').trim();
    const sectorKey = sectorRaw.toLowerCase();
    const coords = resolveClientCoords(c, idx);

    if (!sectorMap.has(sectorKey)) {
      sectorMap.set(sectorKey, { clients: [], coordsList: [] });
    }
    const entry = sectorMap.get(sectorKey)!;
    entry.clients.push(c);
    entry.coordsList.push(coords);
  });

  const summaries: SectorRiskSummary[] = [];

  sectorMap.forEach((entry, _key) => {
    const clientIds = new Set(entry.clients.map(c => c.id));
    const activeLoans = loans.filter(
      l => clientIds.has(l.clientId) && l.status !== LoanStatus.PAID && l.status !== LoanStatus.REJECTED
    );

    const totalDisbursed = activeLoans.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
    const totalRemaining = activeLoans.reduce((sum, l) => sum + (Number(l.remainingBalance) || 0), 0);
    const overdueLoans = activeLoans.filter(
      l => l.status === LoanStatus.OVERDUE || (l.status as string) === 'Vencido'
    );
    const totalOverdue = overdueLoans.reduce((sum, l) => sum + (Number(l.remainingBalance) || 0), 0);

    const overduePercentage =
      totalRemaining > 0 ? Math.round((totalOverdue / totalRemaining) * 1000) / 10 : 0;

    let riskLevel: SectorRiskSummary['riskLevel'] = 'Bajo';
    if (overduePercentage >= 25) riskLevel = 'Critico';
    else if (overduePercentage >= 15) riskLevel = 'Alto';
    else if (overduePercentage >= 5) riskLevel = 'Medio';

    // Average coordinates to get centroid
    const avgLat = entry.coordsList.reduce((sum, p) => sum + p.lat, 0) / entry.coordsList.length;
    const avgLng = entry.coordsList.reduce((sum, p) => sum + p.lng, 0) / entry.coordsList.length;

    const repClient = entry.clients[0];
    const sectorName = repClient?.sector || repClient?.municipality || 'Sector General';
    const municipality = repClient?.municipality || repClient?.province || 'Distrito Nacional';

    summaries.push({
      sectorName,
      municipality,
      centerCoords: { lat: avgLat, lng: avgLng },
      totalClients: entry.clients.length,
      activeLoansCount: activeLoans.length,
      totalDisbursedAmount: totalDisbursed,
      totalRemainingBalance: totalRemaining,
      totalOverdueBalance: totalOverdue,
      overduePercentage,
      riskLevel
    });
  });

  // Sort by highest overdue percentage
  return summaries.sort((a, b) => b.overduePercentage - a.overduePercentage);
};
