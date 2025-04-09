/**
 * Utility functions for product engagement API interactions
 */

import { EngagementStats } from '../types/product';

const API_BASE_URL = 'http://localhost:8000/api';

// Throttling mechanism to prevent too many concurrent requests
const pendingRequests = new Map<string, Promise<EngagementStats>>();

/**
 * Updates engagement stats for a product
 * @param productId - The product ID
 * @param engagementType - The type of engagement (likes, dislikes, views, routines, rerolls)
 * @param increment - Value to increment by (default: 1)
 * @returns Promise with updated engagement stats
 */
export const updateProductEngagement = async (
  productId: string,
  engagementType: keyof EngagementStats,
  increment: number = 1
): Promise<EngagementStats> => {
  // Create a unique key for this request
  const requestKey = `${productId}-${String(engagementType)}`;
  
  // If there's already a pending request for this product and engagement type, return that promise
  if (pendingRequests.has(requestKey)) {
    return pendingRequests.get(requestKey)!;
  }
  
  // Create the promise for this request
  const requestPromise = (async () => {
    try {
      // Use a simpler approach that relies on the backend to handle the increment
      // This avoids the potential race condition of reading then writing
      const updateData = {
        [engagementType]: increment  // Just send what needs to be incremented
      };
      
      // Send update request to API
      const updateResponse = await fetch(`${API_BASE_URL}/products/${productId}/engagement`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      
      if (!updateResponse.ok) throw new Error('Failed to update engagement');
      
      const result = await updateResponse.json();
      return result.engagement_stats;
    } catch (error) {
      console.error('Error updating product engagement:', error);
      throw error;
    } finally {
      // Remove this request from the pending map once it's done
      pendingRequests.delete(requestKey);
    }
  })();
  
  // Store the promise in the map
  pendingRequests.set(requestKey, requestPromise);
  
  // Return the promise
  return requestPromise;
};