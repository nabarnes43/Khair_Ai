import { Product as ProductType } from '../types/product';

/**
 * Utility functions for working with product ingredients by normalized position
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
  
  console.log('Products categorized:', Object.keys(categorized));
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
 * Calculate a composite score based on normalized position and normalized count
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
  
  // Position is more important (70% weight), but count still matters (30% weight)
  // Since lower position is better, we use (1 - normalizedPos) to flip the scale
  return (0.8 * (1 - normalizedPos)) + (0.2* normalizedCount);
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
 * Rank products based on their ingredient score
 * @param products - List of products to rank
 * @param beneficialIngredients - List of ingredients that are good for the specific hair type
 * @param excludeIds - Optional array of product IDs to exclude
 * @returns Array of products sorted by ingredient score (highest first)
 */
export const rankProductsByIngredientScore = (
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
 * Get best products for a category based on normalized ingredient scores
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
  console.log(`Finding top ${topN} products for ${category}`);
  
  const categoryProducts = categorizedProducts[category] || [];
  
  if (categoryProducts.length === 0) {
    console.log(`No products in category: ${category}`);
    return [];
  }
  
  const rankedProducts = rankProductsByIngredientScore(
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

  // Log all ranked products in a single console.log with newlines
  const productDetails = result.map((product, index) => 
    `Ranked #${index + 1} for ${category}: ${product.brand} - ${product.name} (Score: ${product.score ?? 0}%)`
  ).join('\n');
  
  if (result.length > 0) {
    console.log(`Top products for ${category}:\n${productDetails}`);
  }
  
  return result;
};
