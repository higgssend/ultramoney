/**
 * dateUtils.ts
 * Utilidades centralizadas para el manejo preciso de fechas y horas sin desfases de zona horaria.
 */

/**
 * Formatea una fecha y hora de forma exacta en español dominicano (es-DO).
 * Ejemplo: "14 ago 2026, 03:45 PM"
 */
export const formatExactDateTime = (dateStr?: string | null): string => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return dateStr;
    }
    return d.toLocaleString('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return dateStr;
  }
};

/**
 * Formatea una fecha y hora con segundos exactos.
 * Ejemplo: "14/08/2026 03:45:12 PM"
 */
export const formatFullDateTimeSeconds = (dateStr?: string | null): string => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return dateStr;
    }
    return d.toLocaleString('es-DO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  } catch {
    return dateStr;
  }
};

/**
 * Obtiene la fecha y hora local actual formateada para campos de formulario HTML.
 */
export const getCurrentLocalDateTime = (): { date: string; time: string; datetimeLocal: string } => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  const date = `${year}-${month}-${day}`;
  const time = `${hours}:${minutes}`;
  const datetimeLocal = `${date}T${time}`;

  return { date, time, datetimeLocal };
};

/**
 * Convierte cualquier fecha en valores para inputs HTML
 */
export const parseToLocalDateTimeInputs = (dateStr?: string | null): { date: string; time: string; datetimeLocal: string } => {
  if (!dateStr) return getCurrentLocalDateTime();
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return getCurrentLocalDateTime();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    const date = `${year}-${month}-${day}`;
    const time = `${hours}:${minutes}`;
    const datetimeLocal = `${date}T${time}`;

    return { date, time, datetimeLocal };
  } catch {
    return getCurrentLocalDateTime();
  }
};

/**
 * Combina fecha YYYY-MM-DD y hora HH:mm en una cadena ISO completa con segundos.
 */
export const combineDateAndTimeToISO = (dateStr: string, timeStr?: string): string => {
  if (!dateStr) return new Date().toISOString();
  if (dateStr.includes('T')) return dateStr;
  const time = timeStr && timeStr.trim() !== '' ? timeStr : `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;
  const parts = time.split(':');
  const h = parts[0] || '00';
  const m = parts[1] || '00';
  const s = parts[2] || String(new Date().getSeconds()).padStart(2, '0');
  
  // Construir objeto Date local para obtener ISO correcto
  const [year, month, day] = dateStr.split('-').map(Number);
  if (year && month && day) {
    const localDate = new Date(year, month - 1, day, Number(h), Number(m), Number(s));
    return localDate.toISOString();
  }
  return `${dateStr}T${h}:${m}:${s}`;
};
