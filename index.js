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
  
  export interface Inventory {
    id?: number;
    productName: string;
    harvestedDate: string;
    quality?: string;
    quantity: number;
    packUnit: string;
    pricePerUnit: number;
    sku: string;
    continueSellingWhenOutOfStock: boolean;
    notifyWhenInventoryLessThan: number;
  }
  
  export interface Env {
    DB: D1Database;
  }
  
  export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    details?: string;
  }
