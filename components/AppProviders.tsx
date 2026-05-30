import React from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from '../contexts/ThemeContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { ConfirmationProvider } from '../contexts/ConfirmationContext';
import { ToastProvider } from '../contexts/ToastContext';
import { ArticleProvider } from '../contexts/ArticleContext';
import { ProductProvider } from '../contexts/ProductContext';
import { RecentlyViewedProvider } from '../contexts/RecentlyViewedContext';
import { VetProvider } from '../contexts/VetContext';
import { AnimalProvider } from '../contexts/AnimalContext';
import { BrandProvider } from '../contexts/BrandContext';
import { AuthProvider } from '../contexts/AuthContext';
import { VaccinationProvider } from '../contexts/VaccinationContext';
import { PetManagementProvider } from '../contexts/PetManagementContext';
import { CartProvider } from '../contexts/CartContext';
import { CookieConsentProvider } from '../components/CookieConsentBanner';
import { DynamicIslandProvider } from '../contexts/DynamicIslandContext';

/**
 * Composes all application providers into a single wrapper.
 * This eliminates the deeply-nested "provider tree" in App.tsx
 * and makes it easy to add / reorder providers in one place.
 */

// Generic compose utility: takes an array of providers and nests them automatically.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Provider = React.ComponentType<{ children: React.ReactNode } & any>;

function composeProviders(...providers: Provider[]): React.FC<{ children: React.ReactNode }> {
  const ComposedProviders: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    providers.reduceRight<React.ReactNode>(
      (acc, Provider) => <Provider>{acc}</Provider>,
      children
    ) as React.ReactElement;

  ComposedProviders.displayName = 'AppProviders';
  return ComposedProviders;
}

const AppProviders = composeProviders(
  HelmetProvider,
  ThemeProvider,
  LanguageProvider,
  ConfirmationProvider,
  ToastProvider,
  ArticleProvider,
  ProductProvider,
  RecentlyViewedProvider,
  VetProvider,
  AnimalProvider,
  BrandProvider,
  AuthProvider,
  VaccinationProvider,
  PetManagementProvider,
  CartProvider,
  CookieConsentProvider,
  DynamicIslandProvider
);

export default AppProviders;
