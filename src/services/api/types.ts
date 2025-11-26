/**
 * Tipos TypeScript basados en el Swagger/OpenAPI
 */

export interface Category {
  id?: number;
  name?: string;
}

export interface Tag {
  id?: number;
  name?: string;
}

export interface Pet {
  id?: number;
  name: string; // required
  category?: Category;
  photoUrls: string[]; // required
  tags?: Tag[];
  status?: 'available' | 'pending' | 'sold';
}

export interface Order {
  id?: number;
  petId?: number;
  quantity?: number;
  shipDate?: string; // date-time
  status?: 'placed' | 'approved' | 'delivered';
  complete?: boolean;
}

export interface User {
  id?: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  phone?: string;
  userStatus?: number;
}

export interface ApiResponse {
  code?: number;
  type?: string;
  message?: string;
}

export interface Error {
  code: string;
  message: string;
}

export interface Inventory {
  [key: string]: number; // Map de status a cantidad
}

/**
 * Tipos para la respuesta del Backend (Go)
 */

// Balance tal como lo devuelve el backend
export interface BackendBalance {
  id: string;
  userId: string;
  assetCode: string; // "USD" | "UYU" | "USDc"
  availableBalance: string; // Decimal como string
  pendingBalance: string;
  totalBalance: string;
  assetType: string; // "fiat" | "crypto"
  accountType: string; // "main"
  createdAt: string;
  updatedAt: string;
}

// Respuesta del backend para balances
export interface BackendBalancesResponse {
  success: boolean;
  data: BackendBalance[];
  error?: string;
}

/**
 * Tipos para la respuesta del Backend de Usuario (Go)
 */

// Usuario tal como lo devuelve el backend
export interface BackendUser {
  id: string;
  fullName: string;
  documentType: string;
  documentNumber: string;
  birthDate: string; // ISO date string
  nationality: string;
  email: string;
  phone: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressCountry: string;
  addressPostalCode?: string;
  countryOfResidence: string;
  countryOfFundsOrigin: string;
  isPEP: boolean;
  pepDetails?: string;
  status: string;
  identityPendingManualReview: boolean;
  createdAt: string;
  updatedAt: string;
}

// Respuesta del backend para usuario
export interface BackendUserResponse {
  success: boolean;
  data: BackendUser;
  error?: string;
}

// Input para crear usuario en el backend
export interface CreateUserInput {
  id?: string; // UUID del usuario (sub de Cognito)
  fullName: string;
  documentType: string;
  documentNumber: string;
  birthDate: string; // ISO date string
  nationality: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city?: string;
    state?: string;
    country: string;
    postalCode?: string;
  };
  countryOfResidence: string;
  countryOfFundsOrigin: string;
  isPEP?: boolean;
  pepDetails?: string;
  deviceFingerprint?: string;
  ipAddress?: string;
  userAgent?: string;
}

// Respuesta del backend al crear usuario
export interface CreateUserResponse {
  success: boolean;
  data: BackendUser;
  error?: string;
}

/**
 * Tipos para la respuesta del Backend de Movements (Go)
 */

// Movement tal como lo devuelve el backend
export interface BackendMovement {
  id: string;
  userId: string;
  balanceId: string;
  movementType: string; // "deposit" | "withdrawal" | "transfer_in" | "transfer_out" | "fee" | "refund" | "adjustment" | "swap" | "stake" | "unstake"
  amount: string; // Decimal como string
  assetType: string; // "fiat" | "crypto"
  assetCode: string; // "USD" | "UYU" | "USDc" | etc
  direction: string; // "in" | "out"
  status: string; // "pending" | "processing" | "completed" | "failed" | "cancelled" | "reversed"
  description?: string;
  metadata?: any;
  externalReference?: string;
  balanceBefore?: string; // Decimal como string
  balanceAfter?: string; // Decimal como string
  counterpartUserId?: string;
  counterpartAccount?: string;
  counterpartName?: string;
  scheduledAt?: string;
  processedAt?: string;
  failedAt?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

// Respuesta del backend para movements
export interface BackendMovementsResponse {
  success: boolean;
  data: BackendMovement[];
  error?: string;
}

