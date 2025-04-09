import { FC, useState, useEffect, useMemo } from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { RefreshCw, Lock } from 'lucide-react'
import Product from './Product'
// Import the products data and type
import allProductsData from '../data/all_products.json'
import { Product as ProductType } from '../types/product'
import { PRODUCT_CATEGORIES } from '../lib/constants'
// Import our utility functions
import { 
  getBestProductsForCategory,
  getIngredientScore,
  categorizeProducts,
} from '../utils/IngredientUtils'

/**
 * A component for building hair care routines
 */
const RoutineBuilder: FC = () => {
  const [lockedProducts, setLockedProducts] = useState<Record<string, boolean>>({});
  const [filteredProducts, setFilteredProducts] = useState<Record<string, ProductType>>({});
  // Track recently rerolled products to avoid showing them again
  const [recentlyRerolled, setRecentlyRerolled] = useState<Record<string, string[]>>({});
  const hairType = "4C Curly Hair Type";
  
  // Categories to include in the routine
  const routineCategories = useMemo(() => [
    PRODUCT_CATEGORIES.SHAMPOO,
    PRODUCT_CATEGORIES.CONDITIONER, 
    PRODUCT_CATEGORIES.LEAVE_IN_CONDITIONER,
    PRODUCT_CATEGORIES.SCALP_SCRUB,
    PRODUCT_CATEGORIES.HAIR_OIL
  ], []);

  // Key beneficial ingredients for 4C curly hair (example)
  // These would ideally come from your AI system based on hair type & survey results
  const beneficialIngredients = useMemo(() => [
    "Butyrospermum Parkii Butter",
    "Cocos Nucifera Oil",
    "Aloe Barbadensis Leaf Extract",
    "Aloe Barbadensis Leaf Juice",
    "Glycerin",
    "Ricinus Communis Seed Oil",
    "Simmondsia Chinensis Seed Oil",
    "honey",
    "Persea Gratissima Oil"
  ], []);

  // Categorize products once on load (memoized to prevent recalculation)
  const categorizedProducts = useMemo(() => 
    categorizeProducts(allProductsData as ProductType[]), 
  []);

  // Initialize products on component mount
  useEffect(() => {
    const selectedProducts: Record<string, ProductType> = {};
    
    routineCategories.forEach(category => {
      const excludeIds = recentlyRerolled[category] || [];
      const topProducts = getBestProductsForCategory(
        categorizedProducts,
        category,
        beneficialIngredients,
        excludeIds,
        1
      );
      
      selectedProducts[category] = topProducts[0];
    });
    
    setFilteredProducts(selectedProducts);
  }, [routineCategories, beneficialIngredients, categorizedProducts, recentlyRerolled]);

  // Toggle product lock status
  const handleToggleProductLock = (productId: string) => {
    setLockedProducts(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  // Reroll unlocked products
  const handleReroll = () => {
    const newSelection = { ...filteredProducts };
    const newRecentlyRerolled = { ...recentlyRerolled };
    
    routineCategories.forEach(category => {
      const currentProduct = filteredProducts[category];
      if (!currentProduct || lockedProducts[currentProduct.id]) return;
      
      // Track the current product as recently rerolled
      const rerolledForCategory = newRecentlyRerolled[category] || [];
      newRecentlyRerolled[category] = [
        ...rerolledForCategory, 
        currentProduct.id
      ] // Keep all use slice(-5) to keep only 5 most recent
      
      // Get a new product for this category
      const topProducts = getBestProductsForCategory(
        categorizedProducts,
        category,
        beneficialIngredients,
        newRecentlyRerolled[category],
        1
      );
      
      newSelection[category] = topProducts[0];
    });
    
    setFilteredProducts(newSelection);
    setRecentlyRerolled(newRecentlyRerolled);
  };

  // Format the product score as a percentage
  const formatScore = (product: ProductType): string => 
    `${Math.round(getIngredientScore(product, beneficialIngredients) * 100)}% match`;

  // Save routine
  const handleSaveRoutine = () => {
    const selectedProductIds = Object.entries(lockedProducts)
      .filter(([_, isLocked]) => isLocked)
      .map(([id]) => id);
    alert(`Saving routine with products: ${selectedProductIds.join(", ")}`);
  };

  return (
    <div className="container mx-auto py-10">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-blue-600 mb-2">Your Personalized Hair Routine</h1>
        <p className="text-gray-600">Based on your {hairType}</p>
        <p className="text-sm text-gray-500 mt-2">
          Prioritizing ingredients: {beneficialIngredients.join(', ')}
        </p>
      </div>
      
      <Card className="bg-blue-50 mb-10 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-blue-700" />
            <span className="text-blue-900">Lock products you want to keep</span>
          </div>
          <Button 
            onClick={handleReroll}
            variant="outline" 
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reroll Unlocked
          </Button>
        </div>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
        {routineCategories.map(category => {
          const product = filteredProducts[category];
          return product ? (
            <div key={category} className="flex flex-col h-full">
              <h2 className="text-2xl font-bold mb-2 whitespace-nowrap">{category}</h2>
              <Product
                id={product.id}
                name={product.name}
                brand={product.brand}
                category={product.category}
                image_url={product.image_url || ""}
                ingredients={product.ingredients || []}
                isLocked={lockedProducts[product.id] || false}
                price={product.price}
                score={formatScore(product)}
                onToggleLock={() => handleToggleProductLock(product.id)}
                beneficialIngredients={beneficialIngredients}
              />
            </div>
          ) : null;
        })}
      </div>
    
      <div className="flex justify-center">
        <Button 
          onClick={handleSaveRoutine}
          className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-6 text-lg"
        >
          Save My Routine
        </Button>
      </div>
    </div>
  )
}

export default RoutineBuilder