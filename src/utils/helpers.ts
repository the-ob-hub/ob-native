/**
 * Helpers
 */

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const formatDate = (date: Date): string => {
  return date.toISOString();
};

/**
 * Formatear número como moneda
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  const currencySymbols: { [key: string]: string } = {
    USD: '$',
    UYU: '$',
    USDc: '$',
  };
  
  const symbol = currencySymbols[currency] || '$';
  
  const formatted = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  
  return `${symbol}${formatted}`;
};

/**
 * Formatear fecha para mostrar
 */
export const formatDateForDisplay = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Resetear horas para comparar solo fechas
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

  if (dateOnly.getTime() === todayOnly.getTime()) {
    return `Hoy ${date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
  } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
    return `Ayer ${date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
};

/**
 * Obtener iniciales de un nombre
 */
export const getInitials = (name: string): string => {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Generar color basado en iniciales
 */
export const getColorFromInitials = (initials: string): string => {
  const colors = [
    '#3498db', // Azul
    '#2ecc71', // Verde
    '#e74c3c', // Rojo
    '#f39c12', // Naranja
    '#9b59b6', // Morado
    '#1abc9c', // Turquesa
    '#e67e22', // Naranja oscuro
    '#34495e', // Gris oscuro
    '#e91e63', // Rosa
    '#00bcd4', // Cyan
  ];
  let hash = 0;
  for (let i = 0; i < initials.length; i++) {
    hash = initials.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

/**
 * Valida si un string es un UUID válido
 */
export const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

/**
 * Valida si un string es un KSUID válido (con o sin prefijo)
 */
export const isValidKSUID = (str: string): boolean => {
  // KSUID tiene 27 caracteres base62 (0-9, A-Z, a-z)
  // Con prefijo usr- sería: usr- + 27 caracteres = 31 caracteres
  if (str.startsWith('usr-')) {
    const ksuidPart = str.substring(4);
    return ksuidPart.length === 27 && /^[0-9A-Za-z]{27}$/.test(ksuidPart);
  }
  // Sin prefijo, debe ser exactamente 27 caracteres base62
  return str.length === 27 && /^[0-9A-Za-z]{27}$/.test(str);
};

/**
 * Valida y normaliza un userId (acepta UUID o KSUID con prefijo usr-)
 * Retorna el userId tal cual si es válido, o null si no es válido
 */
export const validateUserId = (userId: string | null | undefined): string | null => {
  if (!userId) return null;
  
  // Si tiene prefijo usr-, es un KSUID válido
  if (userId.startsWith('usr-')) {
    return userId;
  }
  
  // Si es un UUID válido, retornarlo tal cual
  if (isValidUUID(userId)) {
    return userId;
  }
  
  // Si es un KSUID sin prefijo (27 caracteres base62)
  if (isValidKSUID(userId)) {
    return userId;
  }
  
  // No es válido
  return null;
};

/**
 * Normaliza un userId para enviarlo al backend
 * El backend acepta UUID o KSUID (con o sin prefijo)
 */
export const normalizeUserIdForBackend = (userId: string | null | undefined): string | null => {
  const validated = validateUserId(userId);
  if (!validated) return null;
  
  // Si tiene prefijo usr-, removerlo para el backend (el backend espera UUID o KSUID sin prefijo)
  // Pero primero verificamos: si el backend acepta ambos, podemos enviarlo tal cual
  // Por ahora, enviamos tal cual y el backend deberá aceptarlo
  return validated;
};

