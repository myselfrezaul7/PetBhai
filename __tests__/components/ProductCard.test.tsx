import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProductCard from '../../components/ProductCard';
import { CartProvider } from '../../contexts/CartContext';
import { LanguageProvider } from '../../contexts/LanguageContext';
import type { Product } from '../../types';

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: null,
    addToWishlist: jest.fn(),
    removeFromWishlist: jest.fn(),
  }),
}));

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

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <LanguageProvider>
        <CartProvider>{ui}</CartProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
};

describe('ProductCard', () => {
  it('renders product information correctly', () => {
    renderWithProviders(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('1kg')).toBeInTheDocument();
    expect(screen.getByText('1,500')).toBeInTheDocument();
    expect(screen.getByText('Dog Food')).toBeInTheDocument();
  });

  it('displays rating when rating is greater than 0', () => {
    renderWithProviders(<ProductCard product={mockProduct} />);

    expect(screen.getByText('4.5')).toBeInTheDocument();
  });

  it('renders add to cart button', () => {
    renderWithProviders(<ProductCard product={mockProduct} />);

    expect(screen.getByRole('button', { name: /aria_add_to_cart/i })).toBeInTheDocument();
  });

  it('calls addToCart when button is clicked', () => {
    renderWithProviders(<ProductCard product={mockProduct} />);

    const addButton = screen.getByRole('button', { name: /aria_add_to_cart/i });
    fireEvent.click(addButton);

    // After clicking, button text should change to "Added"
    expect(screen.getByText(/added/i)).toBeInTheDocument();
  });

  it('calls onQuickView when quick view button is clicked', () => {
    const mockQuickView = jest.fn();
    renderWithProviders(<ProductCard product={mockProduct} onQuickView={mockQuickView} />);

    const quickViewButton = screen.getByTitle('Quick View');
    fireEvent.click(quickViewButton);

    expect(mockQuickView).toHaveBeenCalledWith(mockProduct);
  });

  it('renders product link correctly', () => {
    renderWithProviders(<ProductCard product={mockProduct} />);

    const links = screen.getAllByRole('link');
    const productLink = links.find((link) => link.getAttribute('href') === '/product/1');
    expect(productLink).toBeInTheDocument();
  });
});
