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

