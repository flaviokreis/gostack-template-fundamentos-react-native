import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsFromStorage = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (productsFromStorage) {
        setProducts([JSON.parse(productsFromStorage)]);
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const findProduct = products.find(prod => prod.id === product.id);

      if (findProduct) {
        setProducts([
          ...products,
          { ...findProduct, quantity: findProduct.quantity + 1 },
        ]);
      } else {
        setProducts([...products, { ...product, quantity: 1 }]);
      }

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const productToIncrease = products.find(product => product.id === id);
      if (productToIncrease) {
        const productToSave = {
          ...productToIncrease,
          quantity: productToIncrease.quantity + 1,
        };

        setProducts([...products, productToSave]);

        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify(products),
        );
      }
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productToDecrease = products.find(product => product.id === id);
      if (productToDecrease) {
        const productToSave = {
          ...productToDecrease,
          quantity: productToDecrease.quantity - 1,
        };

        if (productToSave.quantity > 0) {
          setProducts([...products, productToSave]);
        } else {
          setProducts(
            products.filter(product => product.id !== productToSave.id),
          );
        }

        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify(products),
        );
      }
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
