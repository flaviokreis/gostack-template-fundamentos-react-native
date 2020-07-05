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
        const list = JSON.parse(productsFromStorage);
        setProducts(list);
      }
    }

    loadProducts();
  }, []);

  const findIndex = useCallback(
    id => products.findIndex(product => product.id === id),
    [products],
  );

  const saveProducts = useCallback(
    async (list: Product[]) => {
      setProducts(list);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const productIndex = findIndex(product.id);
      if (productIndex >= 0) {
        const foundProduct = products[productIndex];

        const productToSave = {
          ...foundProduct,
          quantity: foundProduct.quantity + 1,
        };

        const list = products;
        list[productIndex] = productToSave;

        saveProducts(list);
      } else {
        saveProducts([...products, { ...product, quantity: 1 }]);
      }
    },
    [saveProducts, findIndex, products],
  );

  const increment = useCallback(
    async id => {
      const productIndex = findIndex(id);
      if (productIndex >= 0) {
        const foundProduct = products[productIndex];

        const productToSave = {
          ...foundProduct,
          quantity: foundProduct.quantity + 1,
        };

        const list = products;
        list[productIndex] = productToSave;

        saveProducts(list);
      }
    },
    [saveProducts, findIndex, products],
  );

  const decrement = useCallback(
    async id => {
      const productIndex = findIndex(id);
      if (productIndex >= 0) {
        const foundProduct = products[productIndex];

        if (foundProduct.quantity <= 1) {
          const list = products.splice(productIndex, 1);
          saveProducts(list);
        } else {
          const productToSave = {
            ...foundProduct,
            quantity: foundProduct.quantity - 1,
          };

          const list = products;
          list[productIndex] = productToSave;

          saveProducts(list);
        }
      }
    },
    [saveProducts, findIndex, products],
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
