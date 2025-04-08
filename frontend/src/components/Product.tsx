import { FC, useState } from 'react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Lock, Unlock } from 'lucide-react'

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
}

// Header sub-component
const ProductHeader: FC<{
  name: string;
  brand: string;
  category?: string;
  isLocked?: boolean;
  onToggleLock?: () => void;
}> = ({ name, brand, category, isLocked, onToggleLock }) => (
  <div className="flex justify-between gap-2 mb-2">
    <div className="flex-grow-1">
      <h3 className="font-bold text-lg">{name}</h3>
      <p className="text-sm text-muted-foreground">{brand}</p>
      {category && <p className="text-xs text-muted-foreground mt-1">{category}</p>}
    </div>
    {onToggleLock && (
      <Button 
        variant="outline" 
        size="icon" 
        onClick={onToggleLock}
        className="h-8 w-8 flex-shrink-0"
      >
        {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
      </Button>
    )}
  </div>
);

// Image sub-component
const ProductImage: FC<{
  url: string;
  alt: string;
}> = ({ url, alt }) => (
  <div className="flex items-center justify-center h-40">
    {url ? (
      <img 
        src={url} 
        alt={alt} 
        className="h-full w-full object-contain"
      />
    ) : (
      <div className="h-32 w-32 flex items-center justify-center text-gray-400 bg-gray-100 rounded">
        No Image
      </div>
    )}
  </div>
);

// Ingredients sub-component
const ProductIngredients: FC<{
  ingredients: string[];
}> = ({ ingredients }) => {
  const [showAll, setShowAll] = useState(false);
  
  if (ingredients.length === 0) return null;
  
  return (
    <div className="mt-auto pt-3">
      <h4 className="text-sm uppercase font-medium text-gray-500 mb-1">Ingredients</h4>
      <div className="group">
        <p className={`text-sm ${!showAll ? 'line-clamp-3' : ''}`}>
          {ingredients.join(', ')}
        </p>
        <p 
          className="text-xs text-blue-500 cursor-pointer mt-1" 
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? 'Show less' : 'Show more'}
        </p>
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
  price
}) => {
  return (
    <Card className="h-full">
      <CardContent className="p-4 flex flex-col h-full">
        {/* Product Header */}
        <ProductHeader 
          name={name}
          brand={brand}
          category={category}
          isLocked={isLocked}
          onToggleLock={onToggleLock}
        />
        
        {/* Product Image */}
        <ProductImage url={image_url} alt={name} />
        
        {/* Price (optional) */}
        {price && <p className="text-sm font-medium">{price}</p>}
        
        {/* Product Ingredients */}
        <ProductIngredients ingredients={ingredients} />
      </CardContent>
    </Card>
  );
};

export default Product