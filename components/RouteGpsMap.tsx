import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Client, Loan, LoanStatus } from '../types';
import { 
  GeoPoint, 
  RouteStop, 
  SectorRiskSummary, 
  resolveClientCoords, 
  calculateOverdueDays,
  DEFAULT_OFFICE_COORDS 
} from '../utils/routeOptimizer';
import { 
  Maximize2, Minimize2, Layers, MapPin, 
  Check, RefreshCw, Compass
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface RouteGpsMapProps {
  clients: Client[];
  loans: Loan[];
  filterType?: 'all' | 'today' | 'overdue' | 'current';
  selectedClientId?: string | null;
  onSelectClient?: (client: Client) => void;
  optimizedStops?: RouteStop[] | null;
  originPoint?: GeoPoint;
  originName?: string;
  riskZones?: SectorRiskSummary[] | null;
  showRiskZones?: boolean;
  onUpdateClientCoords?: (clientId: string, coords: GeoPoint) => Promise<void>;
  height?: string;
}

type TileProvider = 'voyager' | 'dark' | 'satellite';

const TILE_CONFIGS: Record<TileProvider, { url: string; attribution: string }> = {
  voyager: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO'
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri World Imagery'
  }
};

export const RouteGpsMap: React.FC<RouteGpsMapProps> = ({
  clients,
  loans,
  filterType = 'all',
  selectedClientId,
  onSelectClient,
  optimizedStops = null,
  originPoint = DEFAULT_OFFICE_COORDS,
  originName = 'Oficina Central',
  riskZones = null,
  showRiskZones = false,
  onUpdateClientCoords,
  height = '580px'
}) => {
  const navigate = useNavigate();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const riskZonesLayerRef = useRef<L.LayerGroup | null>(null);

  const [activeTile, setActiveTile] = useState<TileProvider>('voyager');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPinModeActive, setIsPinModeActive] = useState(false);
  const [pinningClient, setPinningClient] = useState<Client | null>(null);
  const [isLocatingUser, setIsLocatingUser] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper to determine loan info for a client
  const getClientLoanInfo = (clientId: string) => {
    const clientLoans = loans.filter(
      l => l.clientId === clientId && l.status !== LoanStatus.PAID && l.status !== LoanStatus.REJECTED
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
      clientLoans,
      primaryLoan,
      isOverdue,
      isDueToday,
      totalRemaining,
      installmentAmount,
      overdueDays,
      nextDate: primaryLoan?.nextPaymentDate || 'Sin préstamos activos'
    };
  };

  // Filter clients
  const displayClients = clients.filter(c => {
    const info = getClientLoanInfo(c.id);
    if (filterType === 'today') return info.isDueToday;
    if (filterType === 'overdue') return info.isOverdue;
    if (filterType === 'current') return !info.isOverdue && !info.isDueToday && info.clientLoans.length > 0;
    return true;
  });

  const clientsWithGpsCount = useMemo(() => {
    return displayClients.filter(c => Boolean(resolveClientCoords(c))).length;
  }, [displayClients]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [DEFAULT_OFFICE_COORDS.lat, DEFAULT_OFFICE_COORDS.lng],
        zoom: 13,
        zoomControl: false
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const tileConfig = TILE_CONFIGS[activeTile];
      const tileLayer = L.tileLayer(tileConfig.url, {
        attribution: tileConfig.attribution,
        maxZoom: 19
      }).addTo(map);

      tileLayerRef.current = tileLayer;

      // Layers
      const markersGroup = L.layerGroup().addTo(map);
      const riskZonesGroup = L.layerGroup().addTo(map);

      markersLayerRef.current = markersGroup;
      riskZonesLayerRef.current = riskZonesGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer when changed
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !tileLayerRef.current) return;

    const tileConfig = TILE_CONFIGS[activeTile];
    tileLayerRef.current.setUrl(tileConfig.url);
  }, [activeTile]);

  // Click-to-Pin geolocation mode
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (isPinModeActive && pinningClient && onUpdateClientCoords) {
        const newCoords: GeoPoint = { lat: e.latlng.lat, lng: e.latlng.lng };
        void onUpdateClientCoords(pinningClient.id, newCoords);
        setIsPinModeActive(false);
        setPinningClient(null);
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [isPinModeActive, pinningClient, onUpdateClientCoords]);

  // Render Risk Zones
  useEffect(() => {
    const riskZonesGroup = riskZonesLayerRef.current;
    if (!riskZonesGroup) return;

    riskZonesGroup.clearLayers();

    if (showRiskZones && riskZones && riskZones.length > 0) {
      riskZones.forEach(zone => {
        const fillColor =
          zone.riskLevel === 'Critico'
            ? '#e11d48'
            : zone.riskLevel === 'Alto'
            ? '#f97316'
            : zone.riskLevel === 'Medio'
            ? '#eab308'
            : '#10b981';

        const circle = L.circle([zone.centerCoords.lat, zone.centerCoords.lng], {
          color: fillColor,
          fillColor,
          fillOpacity: 0.22,
          radius: Math.min(1200, 350 + zone.totalClients * 80),
          weight: 2
        });

        circle.bindTooltip(
          `<strong>${zone.sectorName}</strong><br/>Clientes: ${zone.totalClients}<br/>Mora: RD$ ${zone.totalOverdueBalance.toLocaleString()} (${zone.overduePercentage}%)<br/>Riesgo: ${zone.riskLevel}`,
          { sticky: true, className: 'risk-zone-tooltip' }
        );

        riskZonesGroup.addLayer(circle);
      });
    }
  }, [riskZones, showRiskZones]);

  // Render Markers & Route Polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();
    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }

    const bounds: [number, number][] = [];

    // 1. If Optimized Route is active, render the sequential stops and polyline
    if (optimizedStops && optimizedStops.length > 0) {
      const polylineCoords: [number, number][] = [
        [originPoint.lat, originPoint.lng]
      ];
      bounds.push([originPoint.lat, originPoint.lng]);

      // Origin Marker (Office / Collector Start)
      const originIcon = L.divIcon({
        className: 'origin-marker-icon',
        html: `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            background: #1e1b4b;
            color: #ffffff;
            border-radius: 50%;
            border: 3px solid #6366f1;
            box-shadow: 0 10px 20px rgba(0,0,0,0.35);
            font-size: 11px;
            font-weight: 900;
          ">
            INICIO
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const originMarker = L.marker([originPoint.lat, originPoint.lng], { icon: originIcon });
      originMarker.bindPopup(`
        <div style="font-family: system-ui; padding: 4px;">
          <h4 style="margin:0; font-weight:800; color:#1e1b4b;">Punto de Partida</h4>
          <p style="margin:2px 0 0; font-size:12px; color:#64748b;">${originName}</p>
        </div>
      `);
      markersGroup.addLayer(originMarker);

      // Render stops
      optimizedStops.forEach(stop => {
        const coords: [number, number] = [stop.coords.lat, stop.coords.lng];
        polylineCoords.push(coords);
        bounds.push(coords);

        const pinColor = stop.isOverdue ? '#e11d48' : stop.isDueToday ? '#d97706' : '#10b981';

        const stopIcon = L.divIcon({
          className: 'stop-pin-icon',
          html: `
            <div style="
              position: relative;
              display: flex;
              align-items: center;
              justify-content: center;
              width: 36px;
              height: 36px;
              background: ${pinColor};
              color: white;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              border: 2.5px solid white;
              box-shadow: 0 8px 16px rgba(0,0,0,0.3);
              cursor: pointer;
            ">
              <span style="
                transform: rotate(45deg);
                font-size: 12px;
                font-weight: 900;
              ">${stop.order}</span>
              ${stop.isOverdue ? `
                <div style="
                  position: absolute;
                  inset: -6px;
                  border-radius: 50%;
                  border: 2px solid #e11d48;
                  animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                  opacity: 0.75;
                "></div>
              ` : ''}
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          popupAnchor: [0, -36]
        });

        const marker = L.marker(coords, { icon: stopIcon });

        const phoneClean = (stop.client.phone || '').replace(/\D/g, '');
        const popupHtml = `
          <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 240px; padding: 2px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <span style="background: #e0e7ff; color: #4338ca; font-weight: 800; font-size: 11px; padding: 2px 8px; border-radius: 6px;">
                Parada #${stop.order} (+${stop.distanceFromPreviousKm} km)
              </span>
              <span style="font-size: 10px; font-weight: 700; color: #64748b;">
                ~${stop.estimatedArrivalMins} min
              </span>
            </div>

            <h4 style="margin: 0 0 2px; font-weight: 800; font-size: 14px; color: #0f172a;">${stop.client.name}</h4>
            <p style="margin: 0 0 8px; font-size: 11px; color: #64748b;">${stop.client.address || 'Dirección no especificada'}</p>

            <div style="background: #f8fafc; padding: 8px; border-radius: 8px; margin-bottom: 8px; font-size: 11px; border: 1px solid #e2e8f0;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="color: #64748b; font-weight: 600;">Cuota a Cobrar:</span>
                <strong style="color: #4338ca;">RD$ ${stop.installmentAmount.toLocaleString()}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="color: #64748b; font-weight: 600;">Balance Total:</span>
                <strong style="color: #0f172a;">RD$ ${stop.totalRemaining.toLocaleString()}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b; font-weight: 600;">Estado:</span>
                <strong style="color: ${stop.isOverdue ? '#e11d48' : stop.isDueToday ? '#d97706' : '#10b981'};">
                  ${stop.isOverdue ? `Mora (${stop.overdueDays} días)` : stop.isDueToday ? 'Vence Hoy' : 'Al Día'}
                </strong>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 6px;">
              <a 
                href="https://www.google.com/maps/dir/?api=1&destination=${coords[0]},${coords[1]}" 
                target="_blank" 
                rel="noopener noreferrer"
                style="display: flex; align-items: center; justify-content: center; gap: 4px; padding: 6px 8px; background: #4f46e5; color: white; border-radius: 8px; font-size: 11px; font-weight: 700; text-decoration: none;"
              >
                Maps
              </a>
              <a 
                href="https://waze.com/ul?ll=${coords[0]},${coords[1]}&navigate=yes" 
                target="_blank" 
                rel="noopener noreferrer"
                style="display: flex; align-items: center; justify-content: center; gap: 4px; padding: 6px 8px; background: #0284c7; color: white; border-radius: 8px; font-size: 11px; font-weight: 700; text-decoration: none;"
              >
                Waze
              </a>
            </div>

            ${phoneClean ? `
              <a 
                href="https://wa.me/${phoneClean}?text=Hola%20${encodeURIComponent(stop.client.name)},%20le%20escribimos%20de%20UltraMoney%20para%20coordinar%20el%20pago%20de%20su%20cuota." 
                target="_blank" 
                rel="noopener noreferrer"
                style="display: block; text-align: center; padding: 6px; background: #16a34a; color: white; border-radius: 8px; font-size: 11px; font-weight: 700; text-decoration: none; margin-bottom: 6px;"
              >
                WhatsApp (${stop.client.phone})
              </a>
            ` : ''}

            <button
              id="btn-collect-${stop.client.id}"
              style="width: 100%; padding: 6px; background: #0f172a; color: white; border-radius: 8px; font-size: 11px; font-weight: 700; border: none; cursor: pointer;"
            >
              Cobrar Cuota en Sistema
            </button>
          </div>
        `;

        marker.bindPopup(popupHtml, { maxWidth: 280 });

        marker.on('popupopen', () => {
          const btn = document.getElementById(`btn-collect-${stop.client.id}`);
          if (btn) {
            btn.onclick = () => {
              if (stop.loan) {
                navigate('/pagos', { state: { loanId: stop.loan.id } });
              } else {
                navigate(`/clientes/${stop.client.id}`);
              }
            };
          }
        });

        marker.on('click', () => {
          if (onSelectClient) onSelectClient(stop.client);
        });

        markersGroup.addLayer(marker);
      });

      // Add polyline
      const polyline = L.polyline(polylineCoords, {
        color: '#4f46e5',
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 8',
        lineJoin: 'round'
      }).addTo(map);
      routePolylineRef.current = polyline;

    } else {
      // 2. Standard Portfolio Map View (Only render clients with actual GPS coordinates)
      displayClients.forEach((client, idx) => {
        const coordsObj = resolveClientCoords(client);
        if (!coordsObj) return; // Eliminate default/fictitious map points
        const coords: [number, number] = [coordsObj.lat, coordsObj.lng];
        bounds.push(coords);

        const info = getClientLoanInfo(client.id);

        // Color coding
        const pinColor = info.isOverdue
          ? '#e11d48'
          : info.isDueToday
          ? '#d97706'
          : '#10b981';

        const isSelected = selectedClientId === client.id;

        const pinIcon = L.divIcon({
          className: 'portfolio-map-pin',
          html: `
            <div style="
              position: relative;
              display: flex;
              align-items: center;
              justify-content: center;
              width: ${isSelected ? '42px' : '34px'};
              height: ${isSelected ? '42px' : '34px'};
              background: ${pinColor};
              color: white;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              border: ${isSelected ? '3.5px solid #1e1b4b' : '2.5px solid white'};
              box-shadow: 0 8px 16px rgba(0,0,0,0.3);
              cursor: pointer;
              transition: all 0.2s ease;
            ">
              <span style="
                transform: rotate(45deg);
                font-size: 11px;
                font-weight: 900;
              ">${idx + 1}</span>
              ${info.isOverdue ? `
                <div style="
                  position: absolute;
                  inset: -6px;
                  border-radius: 50%;
                  border: 2px solid #e11d48;
                  animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                  opacity: 0.75;
                "></div>
              ` : ''}
            </div>
          `,
          iconSize: isSelected ? [42, 42] : [34, 34],
          iconAnchor: isSelected ? [21, 42] : [17, 34],
          popupAnchor: [0, -34]
        });

        const marker = L.marker(coords, { icon: pinIcon });

        const phoneClean = (client.phone || '').replace(/\D/g, '');
        const hasGpsCoordinates = Boolean(client.coordinates?.lat && client.coordinates?.lng);

        const popupHtml = `
          <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 240px; padding: 2px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <div style="width: 32px; height: 32px; border-radius: 50%; background: #e0e7ff; color: #4338ca; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 12px; shrink-0;">
                ${client.name.charAt(0)}
              </div>
              <div style="overflow: hidden;">
                <h4 style="margin: 0; font-weight: 800; font-size: 13px; color: #0f172a; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">${client.name}</h4>
                <p style="margin: 0; font-size: 10px; color: #64748b;">${client.address || client.sector || 'Dirección general'}</p>
              </div>
            </div>

            <div style="background: #f8fafc; padding: 8px; border-radius: 8px; margin-bottom: 8px; font-size: 11px; border: 1px solid #e2e8f0;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="color: #64748b; font-weight: 600;">Cuota Sugerida:</span>
                <strong style="color: #4338ca;">RD$ ${info.installmentAmount.toLocaleString()}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="color: #64748b; font-weight: 600;">Deuda Total:</span>
                <strong style="color: #0f172a;">RD$ ${info.totalRemaining.toLocaleString()}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b; font-weight: 600;">Estado:</span>
                <strong style="color: ${info.isOverdue ? '#e11d48' : info.isDueToday ? '#d97706' : '#10b981'};">
                  ${info.isOverdue ? `Atrasado (${info.overdueDays} d)` : info.isDueToday ? 'Vence Hoy' : 'Al Día'}
                </strong>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 6px;">
              <a 
                href="https://www.google.com/maps/dir/?api=1&destination=${coords[0]},${coords[1]}" 
                target="_blank" 
                rel="noopener noreferrer"
                style="display: flex; align-items: center; justify-content: center; gap: 4px; padding: 6px 8px; background: #4f46e5; color: white; border-radius: 8px; font-size: 11px; font-weight: 700; text-decoration: none;"
              >
                Maps
              </a>
              <a 
                href="https://waze.com/ul?ll=${coords[0]},${coords[1]}&navigate=yes" 
                target="_blank" 
                rel="noopener noreferrer"
                style="display: flex; align-items: center; justify-content: center; gap: 4px; padding: 6px 8px; background: #0284c7; color: white; border-radius: 8px; font-size: 11px; font-weight: 700; text-decoration: none;"
              >
                Waze
              </a>
            </div>

            ${phoneClean ? `
              <a 
                href="https://wa.me/${phoneClean}?text=Hola%20${encodeURIComponent(client.name)},%20le%20escribimos%20de%20UltraMoney%20para%20coordinar%20el%20pago%20de%20su%20cuota." 
                target="_blank" 
                rel="noopener noreferrer"
                style="display: block; text-align: center; padding: 6px; background: #16a34a; color: white; border-radius: 8px; font-size: 11px; font-weight: 700; text-decoration: none; margin-bottom: 6px;"
              >
                WhatsApp (${client.phone})
              </a>
            ` : ''}

            <div style="display: flex; gap: 6px;">
              <button
                id="btn-collect-std-${client.id}"
                style="flex: 1; padding: 6px; background: #0f172a; color: white; border-radius: 8px; font-size: 10px; font-weight: 700; border: none; cursor: pointer;"
              >
                Cobrar
              </button>
              <button
                id="btn-pin-${client.id}"
                style="padding: 6px 8px; background: ${hasGpsCoordinates ? '#f1f5f9' : '#fef3c7'}; color: ${hasGpsCoordinates ? '#475569' : '#b45309'}; border-radius: 8px; font-size: 10px; font-weight: 700; border: 1px solid ${hasGpsCoordinates ? '#cbd5e1' : '#fcd34d'}; cursor: pointer;"
              >
                ${hasGpsCoordinates ? 'Reubicar GPS' : 'Fijar GPS'}
              </button>
            </div>
          </div>
        `;

        marker.bindPopup(popupHtml, { maxWidth: 280 });

        marker.on('popupopen', () => {
          const btnCollect = document.getElementById(`btn-collect-std-${client.id}`);
          if (btnCollect) {
            btnCollect.onclick = () => {
              if (info.primaryLoan) {
                navigate('/pagos', { state: { loanId: info.primaryLoan.id } });
              } else {
                navigate(`/clientes/${client.id}`);
              }
            };
          }

          const btnPin = document.getElementById(`btn-pin-${client.id}`);
          if (btnPin) {
            btnPin.onclick = () => {
              setPinningClient(client);
              setIsPinModeActive(true);
              marker.closePopup();
            };
          }
        });

        marker.on('click', () => {
          if (onSelectClient) onSelectClient(client);
        });

        markersGroup.addLayer(marker);
      });
    }

    // Auto-fit bounds
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [displayClients, loans, filterType, selectedClientId, optimizedStops, originPoint]);

  // Center map on user GPS location
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocalización no soportada por el navegador');
      return;
    }
    setIsLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setIsLocatingUser(false);
        const map = mapInstanceRef.current;
        if (map) {
          map.setView([pos.coords.latitude, pos.coords.longitude], 16);
          L.circleMarker([pos.coords.latitude, pos.coords.longitude], {
            radius: 8,
            fillColor: '#3b82f6',
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9
          })
            .addTo(map)
            .bindPopup('Tu ubicación actual')
            .openPopup();
        }
      },
      _err => {
        setIsLocatingUser(false);
        alert('No se pudo obtener la ubicación GPS actual.');
      }
    );
  };

  return (
    <div
      className={`relative w-full rounded-3xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen min-h-screen' : ''
      }`}
      style={{ height: isFullscreen ? '100vh' : height }}
    >
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Pin Mode Alert Banner */}
      {isPinModeActive && pinningClient && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] bg-indigo-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold animate-bounce">
          <MapPin className="w-4 h-4 shrink-0" />
          <span>Haz clic en el mapa para fijar la ubicación exacta de <strong>{pinningClient.name}</strong></span>
          <button
            onClick={() => {
              setIsPinModeActive(false);
              setPinningClient(null);
            }}
            className="bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg text-white font-extrabold"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Map Legend */}
      <div className="absolute top-4 left-4 z-[400] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 flex items-center gap-3 text-xs font-bold">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-slate-700 dark:text-slate-300">Al Día</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="text-slate-700 dark:text-slate-300">Vence Hoy</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span className="text-slate-700 dark:text-slate-300">Mora Crítica</span>
        </div>
      </div>

      {/* Map Controls (Top Right) */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
        {/* Layer Selector */}
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1.5 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 flex items-center gap-1">
          <button
            onClick={() => setActiveTile('voyager')}
            className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all ${
              activeTile === 'voyager'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Vista Callejero"
          >
            Callejero
          </button>
          <button
            onClick={() => setActiveTile('satellite')}
            className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all ${
              activeTile === 'satellite'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Vista Satelital"
          >
            Satelital
          </button>
          <button
            onClick={() => setActiveTile('dark')}
            className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all ${
              activeTile === 'dark'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Vista Modo Oscuro"
          >
            Noche
          </button>
        </div>

        {/* Action Buttons: Locate Me & Fullscreen */}
        <div className="flex justify-end gap-2">
          <button
            onClick={handleLocateMe}
            disabled={isLocatingUser}
            className="p-2.5 bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition-all"
            title="Centrar en mi ubicación GPS"
          >
            <Compass className={`w-4 h-4 ${isLocatingUser ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2.5 bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition-all"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Ver en pantalla completa'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* No GPS coords info badge */}
      {!optimizedStops && clientsWithGpsCount === 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[400] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
          <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
          <span>No hay clientes con coordenadas GPS registradas en esta vista</span>
        </div>
      )}
    </div>
  );
};

export default RouteGpsMap;
