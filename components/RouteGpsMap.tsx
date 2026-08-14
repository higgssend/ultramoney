import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Client, Loan } from '../types';
import { Navigation, Phone, DollarSign, Calendar, ExternalLink } from 'lucide-react';

interface RouteGpsMapProps {
  clients: Client[];
  loans: Loan[];
  filterType: 'all' | 'today' | 'overdue';
  onCollectPayment?: (client: Client, loan?: Loan) => void;
  selectedClientId?: string | null;
  onSelectClient?: (client: Client) => void;
}

// Santo Domingo default center coordinates
const DEFAULT_CENTER: [number, number] = [18.4861, -69.9312];

export const RouteGpsMap: React.FC<RouteGpsMapProps> = ({
  clients,
  loans,
  filterType,
  onCollectPayment,
  selectedClientId,
  onSelectClient
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Deterministic fallback coordinates generator for clients without exact lat/lng
  const getClientCoords = (client: Client, index: number): [number, number] => {
    if (client.lat && client.lng && !isNaN(Number(client.lat)) && !isNaN(Number(client.lng))) {
      return [Number(client.lat), Number(client.lng)];
    }
    // Generate gentle spread around default center
    const hash = (client.id || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + index * 17;
    const angle = (hash % 360) * (Math.PI / 180);
    const radius = 0.015 + ((hash % 100) / 100) * 0.045; // ~2-6 km spread
    return [
      DEFAULT_CENTER[0] + radius * Math.cos(angle),
      DEFAULT_CENTER[1] + radius * Math.sin(angle)
    ];
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper to determine status color & category
  const getClientLoanInfo = (clientId: string) => {
    const clientLoans = loans.filter(l => l.clientId === clientId && l.status !== 'Pagado' && l.status !== 'Rechazado');
    const isOverdue = clientLoans.some(l => l.status === 'Atrasado' || l.status === 'Vencido');
    const isDueToday = clientLoans.some(l => l.nextPaymentDate === todayStr);
    const totalRemaining = clientLoans.reduce((sum, l) => sum + (Number(l.remainingBalance) || 0), 0);
    const primaryLoan = clientLoans[0];

    return {
      clientLoans,
      primaryLoan,
      isOverdue,
      isDueToday,
      totalRemaining,
      installmentAmount: primaryLoan?.installmentAmount || 0,
      nextDate: primaryLoan?.nextPaymentDate || 'N/A'
    };
  };

  // Filter clients based on filterType
  const filteredClients = clients.filter(c => {
    const info = getClientLoanInfo(c.id);
    if (filterType === 'today') return info.isDueToday;
    if (filterType === 'overdue') return info.isOverdue;
    return true;
  });

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: DEFAULT_CENTER,
        zoom: 13,
        zoomControl: false
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Ultra-clean CartoDB Voyager / OpenStreetMap light tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();
    const bounds: [number, number][] = [];

    filteredClients.forEach((client, idx) => {
      const coords = getClientCoords(client, idx);
      bounds.push(coords);

      const info = getClientLoanInfo(client.id);

      // Marker pin color
      const pinColor = info.isOverdue 
        ? '#f43f5e' 
        : info.isDueToday 
        ? '#10b981' 
        : '#6366f1';

      const pinIcon = L.divIcon({
        className: 'custom-map-pin',
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
            box-shadow: 0 8px 16px rgba(0,0,0,0.25);
            cursor: pointer;
            transition: transform 0.2s;
          ">
            <span style="
              transform: rotate(45deg);
              font-size: 11px;
              font-weight: 900;
              font-family: sans-serif;
            ">${idx + 1}</span>
            ${info.isOverdue ? `
              <div style="
                position: absolute;
                inset: -6px;
                border-radius: 50%;
                border: 2px solid #f43f5e;
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

      const marker = L.marker(coords, { icon: pinIcon });

      // Custom HTML Popup
      const popupContent = `
        <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 220px; padding: 2px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: #e0e7ff; color: #4338ca; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 12px;">
              ${client.name.charAt(0)}
            </div>
            <div>
              <h4 style="margin: 0; font-weight: 800; font-size: 14px; color: #0f172a;">${client.name}</h4>
              <p style="margin: 0; font-size: 11px; color: #64748b;">${client.address || 'Dirección no especificada'}</p>
            </div>
          </div>

          <div style="background: #f8fafc; padding: 8px; border-radius: 10px; margin-bottom: 10px; font-size: 11px; border: 1px solid #e2e8f0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: #64748b; font-weight: 600;">Cuota:</span>
              <strong style="color: #4338ca;">RD$ ${info.installmentAmount.toLocaleString()}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: #64748b; font-weight: 600;">Deuda Total:</span>
              <strong style="color: #0f172a;">RD$ ${info.totalRemaining.toLocaleString()}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b; font-weight: 600;">Vencimiento:</span>
              <strong style="color: ${info.isOverdue ? '#e11d48' : info.isDueToday ? '#059669' : '#475569'};">${info.nextDate}</strong>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
            <a 
              href="https://www.google.com/maps/dir/?api=1&destination=${coords[0]},${coords[1]}" 
              target="_blank" 
              rel="noopener noreferrer"
              style="display: flex; align-items: center; justify-content: center; gap: 4px; padding: 6px 8px; background: #4f46e5; color: white; border-radius: 8px; font-size: 11px; font-weight: 700; text-decoration: none;"
            >
              🧭 Maps
            </a>
            <a 
              href="https://waze.com/ul?ll=${coords[0]},${coords[1]}&navigate=yes" 
              target="_blank" 
              rel="noopener noreferrer"
              style="display: flex; align-items: center; justify-content: center; gap: 4px; padding: 6px 8px; background: #06b6d4; color: white; border-radius: 8px; font-size: 11px; font-weight: 700; text-decoration: none;"
            >
              🚙 Waze
            </a>
          </div>

          ${client.phone ? `
            <a 
              href="https://wa.me/${client.phone.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(client.name)},%20le%20escribimos%20de%20UltraMoney%20para%20coordinar%20su%20pago."
              target="_blank" 
              rel="noopener noreferrer"
              style="display: block; text-align: center; margin-top: 6px; padding: 6px; background: #10b981; color: white; border-radius: 8px; font-size: 11px; font-weight: 700; text-decoration: none;"
            >
              💬 WhatsApp (${client.phone})
            </a>
          ` : ''}
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 280 });

      marker.on('click', () => {
        if (onSelectClient) onSelectClient(client);
      });

      markersGroup.addLayer(marker);
    });

    // Auto-fit map bounds
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [filteredClients, loans, filterType]);

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-3xl overflow-hidden shadow-inner border border-slate-200 dark:border-slate-800">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      
      {/* Legend Badge */}
      <div className="absolute top-4 left-4 z-[400] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 flex items-center gap-3 text-xs font-bold">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-slate-700 dark:text-slate-300">Hoy</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-rose-500" />
          <span className="text-slate-700 dark:text-slate-300">Atrasado</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-indigo-500" />
          <span className="text-slate-700 dark:text-slate-300">Al Día</span>
        </div>
      </div>
    </div>
  );
};

export default RouteGpsMap;
