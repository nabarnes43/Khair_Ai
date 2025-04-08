/**
 * Interface representing a hair care product
 */
export interface Product {
  /** Unique product identifier */
  id: string;
  /** Product brand name */
  brand: string;
  /** Product name */
  name: string;
  /** Product category (Shampoo, Conditioner, etc.) */
  category: string;
  /** Product price */
  price?: string;
  /** Product URL */
  url?: string;
  /** Product image URL */
  image_url?: string;
  /** Product rating */
  rating?: string;
  /** Number of reviews */
  review_count?: string;
  /** List of ingredients */
  ingredients?: string[];
} 