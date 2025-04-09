import { Product as ProductType } from '../types/product';

/**
 * Utility functions for working with product ingredients and engagement metrics for scoring
 */

// Type definition for categorized products
export type CategorizedProducts = {
  [category: string]: ProductType[];
};

/**
 * Categorize products by their category property for faster lookups
 * @param products - All products to categorize
 * @returns Object with products organized by category
 */
export const categorizeProducts = (products: ProductType[]): CategorizedProducts => {
  const categorized: CategorizedProducts = {};
  
  products.forEach(product => {
    const category = product.category;
    if (!categorized[category]) {
      categorized[category] = [];
    }
    categorized[category].push(product);
  });
  
  return categorized;
};

/**
 * Normalize ingredients to a standard format
 * @param ingredients - The ingredients list from a product
 * @returns A normalized array of ingredient strings
 */
export const normalizeIngredients = (ingredients: string[] | string | undefined): string[] => {
  if (!ingredients) return [];
  
  if (typeof ingredients === 'string') {
    return ingredients.split(',').map(ingredient => ingredient.trim().toLowerCase());
  }
  
  return ingredients.map(ingredient => 
    typeof ingredient === 'string' ? ingredient.trim().toLowerCase() : ''
  ).filter(ingredient => ingredient !== '');
};

/**
 * Calculate the normalized position of the earliest beneficial ingredient
 * @param product - The product to check
 * @param beneficialIngredients - List of ingredients to look for
 * @returns A value between 0 and 1 (0 = first ingredient, 1 = not found)
 */
export const getNormalizedPosition = (
  product: ProductType, 
  beneficialIngredients: string[]
): number => {
  const normalizedIngredients = normalizeIngredients(product.ingredients);
  
  if (normalizedIngredients.length === 0) return 1;

  let earliestPosition = normalizedIngredients.length;
  const totalIngredients = normalizedIngredients.length;

  normalizedIngredients.forEach((ingredient, index) => {
    for (const beneficial of beneficialIngredients) {
      if (ingredient === beneficial.toLowerCase() && index < earliestPosition) {
        earliestPosition = index;
        break;
      }
    }
  });

  if (earliestPosition === normalizedIngredients.length) return 1;
  return earliestPosition / totalIngredients;
};

/**
 * Calculate the normalized count of beneficial ingredients
 * @param product - The product to check
 * @param beneficialIngredients - List of ingredients to look for
 * @returns A value between 0 and 1 (0 = none found, 1 = all beneficial ingredients present)
 */
export const getNormalizedCount = (
  product: ProductType, 
  beneficialIngredients: string[]
): number => {
  const normalizedIngredients = normalizeIngredients(product.ingredients);
  
  if (normalizedIngredients.length === 0 || beneficialIngredients.length === 0) {
    return 0;
  }

  const foundBeneficial = new Set<string>();

  normalizedIngredients.forEach((ingredient) => {
    for (const beneficial of beneficialIngredients) {
      if (ingredient === beneficial.toLowerCase() && !foundBeneficial.has(beneficial)) {
        foundBeneficial.add(beneficial);
        break;
      }
    }
  });

  return foundBeneficial.size / beneficialIngredients.length;
};

/**
 * Calculate a normalized engagement score based on like ratio, engagement level, and volume
 * @param product - The product to check
 * @returns A value between 0 and 1, higher is better
 */
export const getEngagementScore = (product: ProductType): number => {
  const stats = product.engagement_stats;
  
  // If no engagement stats available, return neutral score
  if (!stats || !stats.views || stats.views === 0) {
    return 0.5; // Neutral score so ingredient score remains unaffected
  }
  
  // Calculate like ratio (likes - dislikes) normalized by views
  // This prioritizes positive feedback while accounting for volume
  const likeRatio = (stats.likes - stats.dislikes) / stats.views;
  
  // Calculate routine adoption rate (how often product is added to routines)
  const routineRate = stats.routines / stats.views;
  
  // Reroll rate (negative indicator, users are skipping this product)
  const rerollRate = stats.rerolls / stats.views;
  
  // Calculate total engagement volume per view
  // This gives a small boost to products with more overall engagement
  const totalActions = stats.likes + stats.dislikes + stats.routines + stats.rerolls;
  const actionRate = totalActions / stats.views;
  
  // Cap the action rate to prevent extremely high values from dominating
  // Most products will have 0-2 actions per view, so we cap at 2
  //const cappedActionRate = Math.min(actionRate, 2) / 2; // Normalized to [0,1]
  
  // Combine metrics, weighting positive indicators higher than negative ones
  // Likes/dislikes are most important (55%), routines show deeper commitment (25%), 
  // rerolls are a negative indicator (10%), and overall engagement volume matters a little (10%)
  const normalizedScore = (0.55 * Math.max(-1, Math.min(1, likeRatio))) + 
                          (0.25 * routineRate) - 
                          (0.10 * rerollRate) +
                          (0.10 * actionRate);
  
  // Convert from [-1,1] range to [0,1] range
  // Since we added a positive factor (cappedActionRate), we might exceed 1,
  // so we need to cap it again
  return Math.max(0, Math.min(1, (normalizedScore + 1) / 2));
};

/**
 * Calculate a composite score based on normalized position, normalized count, and engagement
 * @param product - The product to check
 * @param beneficialIngredients - List of ingredients to look for
 * @returns A score between 0 and 1, higher is better
 */
export const getIngredientScore = (
  product: ProductType, 
  beneficialIngredients: string[]
): number => {
  const normalizedPos = getNormalizedPosition(product, beneficialIngredients);
  const normalizedCount = getNormalizedCount(product, beneficialIngredients);
  const engagementScore = getEngagementScore(product);
  
  // Create a composite score that weights ingredients and engagement
  // Ingredients still matter (60%), but user feedback is significant (40%)
  // Within ingredients, position is more important (80%) than count (20%)
  const ingredientScore = (0.8 * (1 - normalizedPos)) + (0.2 * normalizedCount);
  return (0.4 * ingredientScore) + (0.6 * engagementScore);
};

/**
 * Find the beneficial ingredients in a product
 * @param product - The product to check
 * @param beneficialIngredients - List of ingredients to look for
 * @returns Array of found beneficial ingredients with their positions
 */
export const findBeneficialIngredients = (
  product: ProductType,
  beneficialIngredients: string[]
): Array<{name: string, position: number}> => {
  const normalizedIngredients = normalizeIngredients(product.ingredients);
  const foundIngredients: Array<{name: string, position: number}> = [];
  
  if (normalizedIngredients.length === 0) {
    return [];
  }
  
  // Check each ingredient against our beneficial list
  normalizedIngredients.forEach((ingredient, index) => {
    for (const beneficial of beneficialIngredients) {
      if (ingredient === beneficial.toLowerCase()) {
        foundIngredients.push({
          name: beneficial,
          position: index + 1 // Make position 1-based for user display
        });
        break;
      }
    }
  });
  
  // Sort by position
  return foundIngredients.sort((a, b) => a.position - b.position);
};

/**
 * Rank products based on their overall score (ingredients + engagement)
 * @param products - List of products to rank
 * @param beneficialIngredients - List of ingredients that are good for the specific hair type
 * @param excludeIds - Optional array of product IDs to exclude
 * @returns Array of products sorted by overall score (highest first)
 */
export const rankProductsByScore = (
  products: ProductType[],
  beneficialIngredients: string[],
  excludeIds: string[] = []
): ProductType[] => {
  const filteredProducts = products.filter(product => !excludeIds.includes(product.id));
  
  const scoredProducts = filteredProducts.map(product => ({
    ...product,
    score: getIngredientScore(product, beneficialIngredients)
  }));
  
  return scoredProducts.sort((a, b) => (b.score || 0) - (a.score || 0));
};

/**
 * Get best products for a category based on overall scores (ingredients + engagement)
 * @param categorizedProducts - All products or pre-categorized products
 * @param category - Product category to filter by
 * @param beneficialIngredients - Ingredients to prioritize
 * @param excludeIds - Products to exclude
 * @param topN - How many top products to return
 * @returns Array of top products
 */
export const getBestProductsForCategory = (
  categorizedProducts: CategorizedProducts,
  category: string,
  beneficialIngredients: string[],
  excludeIds: string[] = [],
  topN: number = 5
): ProductType[] => {
  const categoryProducts = categorizedProducts[category] || [];
  
  if (categoryProducts.length === 0) {
    return [];
  }
  
  const rankedProducts = rankProductsByScore(
    categoryProducts,
    beneficialIngredients,
    excludeIds
  );
  
  if (rankedProducts.length === 0 && excludeIds.length > 0) {
    // If all products were excluded, try again without exclusions
    return getBestProductsForCategory(
      categorizedProducts,
      category,
      beneficialIngredients,
      [],
      topN
    );
  }
  
  const result = rankedProducts.slice(0, Math.min(topN, rankedProducts.length));

  // Only log the final selected products that will be displayed
  if (result.length > 0) {
    console.log(`${category} top products:`);
    
    result.forEach((product, index) => {
      const stats = product.engagement_stats || { likes: 0, dislikes: 0, routines: 0, rerolls: 0, views: 0 };
      console.log(
        `${index + 1}. ${product.brand} - ${product.name} | ` +
        `Score: ${(product.score ?? 0).toFixed(2)} | ` +
        `L: ${stats.likes} D: ${stats.dislikes} R: ${stats.routines} X: ${stats.rerolls} V: ${stats.views}`
      );
    });
  }
  
  return result;
};
