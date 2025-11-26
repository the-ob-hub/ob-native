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

// Balance tal como lo devuelve el backend (snake_case)
export interface BackendBalance {
  id: string;
  user_id: string;
  asset_code: string; // "USD" | "UYU" | "USDc"
  available_balance: string; // Decimal como string
  pending_balance: string;
  total_balance: string;
  asset_type: string; // "fiat" | "crypto"
  account_type: string; // "main"
  created_at: string;
  updated_at: string;
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

// Usuario tal como lo devuelve el backend (snake_case)
export interface BackendUser {
  id: string;
  full_name: string;
  document_type: string;
  document_number: string;
  birth_date: string; // ISO date string
  nationality: string;
  email: string;
  phone: string;
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_country: string;
  address_postal_code?: string;
  country_of_residence: string;
  country_of_funds_origin: string;
  is_pep: boolean;
  pep_details?: string;
  status: string;
  identity_pending_manual_review: boolean;
  created_at: string;
  updated_at: string;
}

// Respuesta del backend para usuario
export interface BackendUserResponse {
  success: boolean;
  data: BackendUser;
  error?: string;
}

// Input para crear usuario en el backend (snake_case)
export interface CreateUserInput {
  id?: string; // UUID del usuario (sub de Cognito)
  full_name: string;
  document_type: string;
  document_number: string;
  birth_date: string; // ISO date string
  nationality: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city?: string;
    state?: string;
    country: string;
    postal_code?: string;
  };
  country_of_residence: string;
  country_of_funds_origin: string;
  is_pep?: boolean;
  pep_details?: string;
  device_fingerprint?: string;
  ip_address?: string;
  user_agent?: string;
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

// Movement tal como lo devuelve el backend (snake_case)
export interface BackendMovement {
  id: string;
  user_id: string;
  balance_id: string;
  movement_type: string; // "deposit" | "withdrawal" | "transfer_in" | "transfer_out" | "fee" | "refund" | "adjustment" | "swap" | "stake" | "unstake"
  amount: string; // Decimal como string
  asset_type: string; // "fiat" | "crypto"
  asset_code: string; // "USD" | "UYU" | "USDc" | etc
  direction: string; // "in" | "out"
  status: string; // "pending" | "processing" | "completed" | "failed" | "cancelled" | "reversed"
  description?: string;
  metadata?: any;
  external_reference?: string;
  balance_before?: string; // Decimal como string
  balance_after?: string; // Decimal como string
  counterpart_user_id?: string;
  counterpart_account?: string;
  counterpart_name?: string;
  scheduled_at?: string;
  processed_at?: string;
  failed_at?: string;
  failure_reason?: string;
  created_at: string;
  updated_at: string;
}

// Respuesta del backend para movements
export interface BackendMovementsResponse {
  success: boolean;
  data: BackendMovement[];
  error?: string;
}

