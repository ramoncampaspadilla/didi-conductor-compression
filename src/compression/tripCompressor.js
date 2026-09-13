/**
 * Sistema de Compresión de Datos de Viajes
 * Optimiza información completa de viajes para transmisión eficiente
 */

/**
 * Comprime datos completos de un viaje
 * @param {Object} trip - Objeto de viaje
 * @returns {Object} Viaje comprimido
 */
function compressTripData(trip) {
  return {
    // ID del viaje
    id: trip.id,
    // Estado: 0=pendiente, 1=activo, 2=completado, 3=cancelado
    st: encodeStatus(trip.status),
    // Pasajero (comprimido)
    psg: {
      id: trip.passenger.id,
      n: trip.passenger.name.substring(0, 20), // Primeros 20 caracteres
      r: Math.round(trip.passenger.rating * 10), // Rating * 10 (ej: 4.8 -> 48)
    },
    // Origen
    org: {
      lat: Math.round(trip.origin.lat * 1e6),
      lng: Math.round(trip.origin.lng * 1e6),
    },
    // Destino
    dst: {
      lat: Math.round(trip.destination.lat * 1e6),
      lng: Math.round(trip.destination.lng * 1e6),
    },
    // Distancia en metros
    dist: Math.round(trip.distance),
    // Tiempo estimado en segundos
    eta: Math.round(trip.estimatedTime),
    // Tarifa en centavos
    fare: Math.round(trip.fare * 100),
    // Timestamp
    ts: trip.timestamp,
  };
}

/**
 * Descomprime datos de viaje
 * @param {Object} compressed - Viaje comprimido
 * @returns {Object} Viaje en formato original
 */
function decompressTripData(compressed) {
  return {
    id: compressed.id,
    status: decodeStatus(compressed.st),
    passenger: {
      id: compressed.psg.id,
      name: compressed.psg.n,
      rating: compressed.psg.r / 10,
    },
    origin: {
      lat: compressed.org.lat / 1e6,
      lng: compressed.org.lng / 1e6,
    },
    destination: {
      lat: compressed.dst.lat / 1e6,
      lng: compressed.dst.lng / 1e6,
    },
    distance: compressed.dist,
    estimatedTime: compressed.eta,
    fare: compressed.fare / 100,
    timestamp: compressed.ts,
  };
}

/**
 * Codifica estado del viaje a número
 * @param {string} status - Estado: 'pending', 'active', 'completed', 'cancelled'
 * @returns {number} Código numérico
 */
function encodeStatus(status) {
  const statusMap = {
    pending: 0,
    active: 1,
    completed: 2,
    cancelled: 3,
  };
  return statusMap[status] || 0;
}

/**
 * Decodifica estado del viaje desde número
 * @param {number} code - Código numérico
 * @returns {string} Estado del viaje
 */
function decodeStatus(code) {
  const statusMap = {
    0: 'pending',
    1: 'active',
    2: 'completed',
    3: 'cancelled',
  };
  return statusMap[code] || 'pending';
}

/**
 * Comprime múltiples viajes (batch)
 * @param {Array} trips - Array de viajes
 * @returns {Array} Viajes comprimidos
 */
function compressTripsBatch(trips) {
  return trips.map(trip => compressTripData(trip));
}

/**
 * Descomprime múltiples viajes (batch)
 * @param {Array} compressed - Array de viajes comprimidos
 * @returns {Array} Viajes descomprimidos
 */
function decompressTripsBatch(compressed) {
  return compressed.map(trip => decompressTripData(trip));
}

/**
 * Gestor de historial de viajes con caché comprimido
 */
class TripCacheManager {
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    this.trips = [];
    this.index = new Map(); // Para búsqueda rápida por ID
  }

  /**
   * Agrega un viaje al caché (comprimido)
   * @param {Object} trip - Objeto de viaje
   */
  addTrip(trip) {
    const compressed = compressTripData(trip);
    this.trips.push(compressed);
    this.index.set(trip.id, this.trips.length - 1);

    // Limitar tamaño del caché
    if (this.trips.length > this.maxSize) {
      const removed = this.trips.shift();
      this.index.delete(removed.id);
    }

    return compressed;
  }

  /**
   * Obtiene un viaje del caché (descomprimido)
   * @param {string} tripId - ID del viaje
   * @returns {Object|null} Viaje descomprimido o null
   */
  getTrip(tripId) {
    const idx = this.index.get(tripId);
    if (idx === undefined) return null;
    return decompressTripData(this.trips[idx]);
  }

  /**
   * Obtiene todos los viajes (descomprimidos)
   * @returns {Array} Array de viajes
   */
  getAllTrips() {
    return decompressTripsBatch(this.trips);
  }

  /**
   * Obtiene todos los viajes comprimidos
   * @returns {Array} Array de viajes comprimidos
   */
  getAllCompressed() {
    return [...this.trips];
  }

  /**
   * Limpia el caché
   */
  clear() {
    this.trips = [];
    this.index.clear();
  }

  /**
   * Obtiene el tamaño del caché
   * @returns {number} Cantidad de viajes en caché
   */
  size() {
    return this.trips.length;
  }
}

// Exportar funciones y clases
export {
  compressTripData,
  decompressTripData,
  compressTripsBatch,
  decompressTripsBatch,
  encodeStatus,
  decodeStatus,
  TripCacheManager,
};
