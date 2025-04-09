import { FC, useState, useEffect } from 'react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Lock, Unlock, ThumbsUp, ThumbsDown, Eye, RefreshCw, Bookmark } from 'lucide-react'
import { updateProductEngagement } from '../utils/ProductEngagementApi'
import { EngagementStats } from '../types/product'

/**
 * Product interface representing a hair care product
 */
interface ProductProps {
  /** Unique product identifier */
  id?: string;
  /** Product brand name */
  brand: string;
  /** Product name */
  name: string; 
  /** Product category (Shampoo, Conditioner, etc.) */
  category?: string;
  /** Product price */
  price?: string;
  /** Product image URL */
  image_url: string;
  /** List of ingredients */
  ingredients: string[];
  /** Whether the product is locked (to keep in routine) */
  isLocked?: boolean;
  /** Function called when lock status is toggled */
  onToggleLock?: () => void;
  /** Match score percentage (0-1) */
  score?: string;
  /** List of beneficial ingredients to highlight */
  beneficialIngredients?: string[];
  /** Engagement stats for the product */
  engagementStats?: EngagementStats;
}

// Simplified Ingredients component
const ProductIngredients: FC<{
  ingredients: string[];
  beneficialIngredients?: string[];
}> = ({ ingredients, beneficialIngredients = [] }) => {
  const [showAll, setShowAll] = useState(false);
  
  if (ingredients.length === 0) return null;
  
  // Check if an ingredient matches any beneficial ingredient
  const isIngredientBeneficial = (ingredient: string): boolean => {
    return beneficialIngredients.some(beneficialIngredient => 
      ingredient.toLowerCase() === beneficialIngredient.toLowerCase()
    );
  };
  
  return (
    <div className="border-t pt-1">
      <h4 className="text-sm font-medium text-gray-500">Ingredients</h4>
      <p className={`text-sm ${!showAll ? 'line-clamp-3' : ''}`}>
        {ingredients.map((ingredient, index) => (
          <span key={index}>
            {index > 0 && ', '}
            <span className={isIngredientBeneficial(ingredient) ? 'text-green-600 font-semibold' : ''}>
              {ingredient}
            </span>
          </span>
        ))}
      </p>
      <button 
        className="text-xs text-blue-500 mt-1" 
        onClick={() => setShowAll(!showAll)}
      >
        {showAll ? 'Show less' : 'Show more'}
      </button>
    </div>
  );
};

// Simplified Engagement panel
const EngagementPanel: FC<{
  productId?: string;
  stats: EngagementStats;
  onStatsUpdate: (newStats: EngagementStats) => void;
}> = ({ productId, stats, onStatsUpdate }) => {
  // Handler for engagement button clicks
  const handleEngagement = async (type: keyof EngagementStats) => {
    if (!productId) return;
    
    try {
      const updatedStats = await updateProductEngagement(productId, type);
      onStatsUpdate(updatedStats);
    } catch (error) {
      console.error(`Error updating ${type}:`, error);
    }
  };
  
  return (
    <div className="flex items-center justify-between pt-2 pb-2">
      <div className="flex gap-2">
        <Button 
          variant="outline"
          size="sm"
          onClick={() => handleEngagement('likes')}
          className="flex items-center gap-1"
        >
          <ThumbsUp className="h-4 w-4" />
          <span>{stats.likes}</span>
        </Button>
        
        <Button 
          variant="outline"
          size="sm"
          onClick={() => handleEngagement('dislikes')}
          className="flex items-center gap-1"
        >
          <ThumbsDown className="h-4 w-4" />
          <span>{stats.dislikes}</span>
        </Button>
      </div>
      
      <div className="flex gap-2 text-gray-500 text-xs">
        <span className="flex items-center"><Eye className="h-4 w-4 mr-1" />{stats.views}</span>
        <span className="flex items-center"><Bookmark className="h-4 w-4 mr-1" />{stats.routines}</span>
        <span className="flex items-center"><RefreshCw className="h-4 w-4 mr-1" />{stats.rerolls}</span>
      </div>
    </div>
  );
};

/**
 * A component that displays a single hair care product
 * @returns Product component
 */
const Product: FC<ProductProps> = ({
  id,
  name,
  brand,
  image_url,
  ingredients,
  isLocked = false,
  onToggleLock,
  category,
  price,
  score,
  beneficialIngredients,
  engagementStats
}) => {
  // Local state for engagement stats
  const [stats, setStats] = useState<EngagementStats>(engagementStats || {
    likes: 0,
    dislikes: 0,
    rerolls: 0,
    routines: 0,
    views: 0,
    last_updated: new Date().toISOString()
  });

  // Update stats when props change
  useEffect(() => {
    if (engagementStats) {
      setStats(engagementStats);
    }
  }, [engagementStats]);

  return (
    <Card className="h-full">
      <CardContent className="p-4 flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between mb-2">
          <div>
            <h3 className="font-bold text-lg">{name}</h3>
            <p className="text-sm text-muted-foreground">{brand}</p>
            {category && <p className="text-xs text-muted-foreground">{category}</p>}
          </div>
          <div className="flex flex-col items-end">
            {onToggleLock && (
              <Button 
                variant="outline" 
                size="icon" 
                onClick={onToggleLock}
                className="h-8 w-8"
              >
                {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
              </Button>
            )}
            {score && <p className="text-xs font-medium text-green-600 whit">{score}</p>}
          </div>
        </div>
        
        {/* Image */}
        <div className="flex items-center justify-center h-40 mb-2">
          {image_url ? (
            <img src={image_url} alt={name} className="h-full w-full object-contain" />
          ) : (
            <div className="h-32 w-32 flex items-center justify-center bg-gray-100 rounded">No Image</div>
          )}
        </div>
        
        {/* Price */}
        {price && price !== "No price" && <p className="text-sm font-medium">{price}</p>}
        
        {/* Spacer to push the following elements to the bottom */}
        <div className="flex-grow"></div>
        
        {/* Engagement Panel - At bottom */}
        {id && (
          <EngagementPanel 
            productId={id} 
            stats={stats} 
            onStatsUpdate={setStats}
          />
        )}
                
        {/* Ingredients - At bottom */}
        {ingredients && ingredients.length > 0 && (
          <ProductIngredients 
            ingredients={ingredients} 
            beneficialIngredients={beneficialIngredients} 
          />
        )}
        

      </CardContent>
    </Card>
  );
};

export default Product