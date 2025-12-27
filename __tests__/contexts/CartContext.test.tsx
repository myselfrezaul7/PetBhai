import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CartProvider, useCart } from '../../contexts/CartContext';
import type { Product } from '../../types';

const mockProduct: Product = {
  id: 1,
  name: 'Test Product',
  category: 'Dog Food',
  price: 1500,
  imageUrl: 'https://picsum.photos/seed/test/400/300',
  description: 'Test description',
  weight: '1kg',
  brandId: 1,
  rating: 4.5,
  reviews: [],
};

const mockProduct2: Product = {
  id: 2,
  name: 'Second Product',
  category: 'Cat Food',
  price: 2000,
  imageUrl: 'https://picsum.photos/seed/test2/400/300',
  description: 'Second test description',
  weight: '2kg',
  brandId: 2,
  rating: 4.0,
  reviews: [],
};

// Test component that uses the cart context
const TestComponent: React.FC = () => {
  const {
    cartItems,
    cartTotal,
    cartCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isCartOpen,
    openCart,
    closeCart,
  } = useCart();

  return (
    <div>
      <p data-testid="cart-count">{cartCount}</p>
      <p data-testid="cart-total">{cartTotal}</p>
      <p data-testid="cart-open">{isCartOpen.toString()}</p>
      <ul data-testid="cart-items">
        {cartItems.map((item) => (
          <li key={item.id}>
            {item.name} - Qty: {item.quantity}
          </li>
        ))}
      </ul>
      <button onClick={() => addToCart(mockProduct)}>Add Product 1</button>
      <button onClick={() => addToCart(mockProduct2)}>Add Product 2</button>
      <button onClick={() => removeFromCart(mockProduct.id)}>Remove Product 1</button>
      <button onClick={() => updateQuantity(mockProduct.id, 5)}>Set Qty to 5</button>
      <button onClick={() => clearCart()}>Clear Cart</button>
      <button onClick={() => openCart()}>Open Cart</button>
      <button onClick={() => closeCart()}>Close Cart</button>
    </div>
  );
};

describe('CartContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('provides initial empty cart state', () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    expect(screen.getByTestId('cart-count')).toHaveTextContent('0');
    expect(screen.getByTestId('cart-total')).toHaveTextContent('0');
    expect(screen.getByTestId('cart-open')).toHaveTextContent('false');
  });

  it('adds item to cart correctly', () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    const addButton = screen.getByText('Add Product 1');

    act(() => {
      fireEvent.click(addButton);
    });

    expect(screen.getByTestId('cart-count')).toHaveTextContent('1');
    expect(screen.getByTestId('cart-total')).toHaveTextContent('1500');
    expect(screen.getByTestId('cart-items')).toHaveTextContent('Test Product - Qty: 1');
  });

  it('increments quantity when adding same item again', () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    const addButton = screen.getByText('Add Product 1');

    act(() => {
      fireEvent.click(addButton);
      fireEvent.click(addButton);
    });

    expect(screen.getByTestId('cart-count')).toHaveTextContent('2');
    expect(screen.getByTestId('cart-total')).toHaveTextContent('3000');
    expect(screen.getByTestId('cart-items')).toHaveTextContent('Test Product - Qty: 2');
  });

  it('adds multiple different items to cart', () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    const addButton1 = screen.getByText('Add Product 1');
    const addButton2 = screen.getByText('Add Product 2');

    act(() => {
      fireEvent.click(addButton1);
      fireEvent.click(addButton2);
    });

    expect(screen.getByTestId('cart-count')).toHaveTextContent('2');
    expect(screen.getByTestId('cart-total')).toHaveTextContent('3500');
  });

  it('removes item from cart correctly', () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    const addButton = screen.getByText('Add Product 1');
    const removeButton = screen.getByText('Remove Product 1');

    act(() => {
      fireEvent.click(addButton);
    });

    expect(screen.getByTestId('cart-count')).toHaveTextContent('1');

    act(() => {
      fireEvent.click(removeButton);
    });

    expect(screen.getByTestId('cart-count')).toHaveTextContent('0');
  });

  it('updates item quantity correctly', () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    const addButton = screen.getByText('Add Product 1');
    const updateButton = screen.getByText('Set Qty to 5');

    act(() => {
      fireEvent.click(addButton);
      fireEvent.click(updateButton);
    });

    expect(screen.getByTestId('cart-count')).toHaveTextContent('5');
    expect(screen.getByTestId('cart-total')).toHaveTextContent('7500');
    expect(screen.getByTestId('cart-items')).toHaveTextContent('Test Product - Qty: 5');
  });

  it('clears cart correctly', () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    const addButton1 = screen.getByText('Add Product 1');
    const addButton2 = screen.getByText('Add Product 2');
    const clearButton = screen.getByText('Clear Cart');

    act(() => {
      fireEvent.click(addButton1);
      fireEvent.click(addButton2);
    });

    expect(screen.getByTestId('cart-count')).toHaveTextContent('2');

    act(() => {
      fireEvent.click(clearButton);
    });

    expect(screen.getByTestId('cart-count')).toHaveTextContent('0');
    expect(screen.getByTestId('cart-total')).toHaveTextContent('0');
  });

  it('opens and closes cart sidebar correctly', () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    const openButton = screen.getByText('Open Cart');
    const closeButton = screen.getByText('Close Cart');

    expect(screen.getByTestId('cart-open')).toHaveTextContent('false');

    act(() => {
      fireEvent.click(openButton);
    });

    expect(screen.getByTestId('cart-open')).toHaveTextContent('true');

    act(() => {
      fireEvent.click(closeButton);
    });

    expect(screen.getByTestId('cart-open')).toHaveTextContent('false');
  });
});
