export interface Product {
  id?: number;
  productName: string;
  category: string;
  shelfLife: number | null;
  shelfLifeUnit: string | null;
  unlimitedShelfLife: boolean;
  packUnit: string;
  description: string | null;
  productImage: string | null;
}

export interface Env {
  DB: D1Database;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T | null;
  error?: string;
  details?: string;
} 