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
  /** Product score */
  score?: number;
  /** Engagement statistics */
  engagement_stats?: EngagementStats;
}

/**
 * Interface representing engagement statistics for a product
 */
export interface EngagementStats {
  /** Number of likes received */
  likes: number;
  /** Number of dislikes received */
  dislikes: number;
  /** Number of times the product has been rerolled */
  rerolls: number;
  /** Number of times the product has been added to routines */
  routines: number;
  /** Number of times the product has been viewed */
  views: number;
  /** Last time the stats were updated */
  last_updated: string;
}