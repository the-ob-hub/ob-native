/**
 * Contact Models
 * Modelos para la API de Contactos (agenda personal del usuario)
 */

export interface UserContact {
  contactId?: string; // ID del usuario en /api/users (si es usuario de la app)
  cvu?: string; // CVU (puede ser externo)
  fullName: string;
  alias?: string;
  phone?: string;
  avatar?: string | null;
  hasDolarApp: boolean; // Si está registrado en la app
  isSaved: boolean; // Si el usuario lo guardó manualmente
  // Campos directos (para compatibilidad con JSONs)
  lastTransactionDate?: string;
  transactionCount?: number;
  // Metadata (para respuestas de API)
  metadata?: {
    transactionCount?: number;
    lastTransactionDate?: string;
    firstTransactionDate?: string;
    totalAmount?: number;
    hasPreviousTransaction?: boolean;
  };
}

export interface RecentContactsResponse {
  success: boolean;
  contacts: UserContact[];
}

export interface SearchContactsResponse {
  success: boolean;
  results: {
    contacts: UserContact[]; // Contactos del usuario con historial
    users: UserContact[]; // Usuarios de la app sin historial
    external: Array<{
      cvu: string;
      fullName?: string;
      hasDolarApp: false;
      hasPreviousTransaction: boolean;
      lastTransactionDate?: string;
    }>;
  };
}

export interface AllContactsResponse {
  success: boolean;
  contacts: UserContact[];
}

