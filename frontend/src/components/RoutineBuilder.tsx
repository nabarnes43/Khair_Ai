import { FC, useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { RefreshCw, Lock } from 'lucide-react'
import Product from './Product'
// Import the products data and type
import allProductsData from '../data/all_products.json'
import { Product as ProductType } from '../types/product'
import { PRODUCT_CATEGORIES } from '../lib/constants'

/**
 * A component for building hair care routines
 */
const RoutineBuilder: FC = () => {
  const [lockedProducts, setLockedProducts] = useState<Record<string, boolean>>({});
  const [filteredProducts, setFilteredProducts] = useState<Record<string, ProductType>>({});
  const hairType = "4C Curly Hair Type";
  
  // Categories to include in the routine - updated to match exact names in data
  const routineCategories = [
    PRODUCT_CATEGORIES.SHAMPOO,
    PRODUCT_CATEGORIES.CONDITIONER, 
    PRODUCT_CATEGORIES.LEAVE_IN_CONDITIONER,
    PRODUCT_CATEGORIES.SCALP_SCRUB,
    PRODUCT_CATEGORIES.HAIR_OIL
  ];

  /**
   * Search function to find products by category
   * @param category - The product category to search for
   * @returns An array of products matching the category
   */
  const searchProductsByCategory = (category: string) => {
    return (allProductsData as ProductType[]).filter(product => product.category === category);
  };

  /**
   * Get a random product from a specific category
   * @param category - The product category
   * @returns A random product from the specified category or undefined if none found
   */
  const getRandomProductByCategory = (category: string) => {
    const products = searchProductsByCategory(category);
    if (products.length === 0) return undefined;
    
    const randomIndex = Math.floor(Math.random() * products.length);
    return products[randomIndex];
  };

  // Initialize the products on component mount
  useEffect(() => {
    // Select one random product per category
    const selectedProducts: Record<string, ProductType> = {};
    
    routineCategories.forEach(category => {
      const randomProduct = getRandomProductByCategory(category);
      if (randomProduct) {
        selectedProducts[category] = randomProduct;
      }
    });
    
    setFilteredProducts(selectedProducts);
  }, []);

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
    routineCategories.forEach(category => {
      const currentProduct = filteredProducts[category];
      // Skip if the current product is locked
      if (currentProduct && lockedProducts[currentProduct.id]) {
        return;
      }
      
      // Get a random product for this category
      const randomProduct = getRandomProductByCategory(category);
      if (randomProduct) {
        newSelection[category] = randomProduct;
      }
    });
    
    setFilteredProducts(newSelection);
  };

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
                onToggleLock={() => handleToggleProductLock(product.id)}
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