import React, { useEffect, useRef, useCallback } from 'react';

// Skip to main content link - should be first focusable element
export const SkipToContent: React.FC<{ targetId?: string }> = ({ targetId = 'main-content' }) => {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-orange-500 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:outline-none"
    >
      Skip to main content
    </a>
  );
};

// Accessible button with proper ARIA attributes
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  loading = false,
  loadingText = 'Loading...',
  icon,
  iconPosition = 'left',
  variant = 'primary',
  disabled,
  className = '',
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-500',
    secondary:
      'bg-slate-200 text-slate-800 hover:bg-slate-300 focus:ring-slate-400 dark:bg-slate-700 dark:text-slate-200',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
    ghost:
      'bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-300 dark:text-slate-300 dark:hover:bg-slate-800',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading ? 'true' : undefined}
      aria-disabled={disabled || loading ? 'true' : undefined}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="sr-only">{loadingText}</span>
          <span aria-hidden="true">{loadingText}</span>
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <span className="mr-2" aria-hidden="true">
              {icon}
            </span>
          )}
          {children}
          {icon && iconPosition === 'right' && (
            <span className="ml-2" aria-hidden="true">
              {icon}
            </span>
          )}
        </>
      )}
    </button>
  );
};

// Focus trap for modals and dialogs
export const useFocusTrap = (isActive: boolean): React.RefObject<HTMLDivElement> => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Focus first element on mount
    firstElement?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  return containerRef;
};

// Announce to screen readers
export const useAnnounce = () => {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.setAttribute('class', 'sr-only');
    document.body.appendChild(announcer);

    // Small delay to ensure screen reader picks up the change
    setTimeout(() => {
      announcer.textContent = message;
    }, 100);

    // Clean up after announcement
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  }, []);

  return announce;
};

// Screen reader only text
export const VisuallyHidden: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="sr-only">{children}</span>
);

// Accessible modal/dialog wrapper
interface AccessibleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export const AccessibleDialog: React.FC<AccessibleDialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
}) => {
  const dialogRef = useFocusTrap(isOpen);
  const titleId = `dialog-title-${title.replace(/\s+/g, '-').toLowerCase()}`;
  const descId = description
    ? `dialog-desc-${title.replace(/\s+/g, '-').toLowerCase()}`
    : undefined;

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="presentation">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-auto"
      >
        <div className="p-6">
          <h2 id={titleId} className="text-xl font-bold text-slate-800 dark:text-white mb-2">
            {title}
          </h2>
          {description && (
            <p id={descId} className="text-slate-600 dark:text-slate-400 mb-4">
              {description}
            </p>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};

// Keyboard navigation hook for lists/grids
export const useArrowNavigation = <T extends HTMLElement>(
  itemCount: number,
  orientation: 'horizontal' | 'vertical' | 'grid' = 'vertical',
  columns?: number
): [number, React.RefObject<T>, (index: number) => void] => {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const containerRef = useRef<T>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      let newIndex = activeIndex;

      switch (e.key) {
        case 'ArrowDown':
          if (orientation === 'vertical' || orientation === 'grid') {
            newIndex =
              orientation === 'grid' && columns
                ? Math.min(activeIndex + columns, itemCount - 1)
                : Math.min(activeIndex + 1, itemCount - 1);
            e.preventDefault();
          }
          break;
        case 'ArrowUp':
          if (orientation === 'vertical' || orientation === 'grid') {
            newIndex =
              orientation === 'grid' && columns
                ? Math.max(activeIndex - columns, 0)
                : Math.max(activeIndex - 1, 0);
            e.preventDefault();
          }
          break;
        case 'ArrowRight':
          if (orientation === 'horizontal' || orientation === 'grid') {
            newIndex = Math.min(activeIndex + 1, itemCount - 1);
            e.preventDefault();
          }
          break;
        case 'ArrowLeft':
          if (orientation === 'horizontal' || orientation === 'grid') {
            newIndex = Math.max(activeIndex - 1, 0);
            e.preventDefault();
          }
          break;
        case 'Home':
          newIndex = 0;
          e.preventDefault();
          break;
        case 'End':
          newIndex = itemCount - 1;
          e.preventDefault();
          break;
      }

      if (newIndex !== activeIndex) {
        setActiveIndex(newIndex);
        // Focus the new active element
        const items = container.querySelectorAll('[role="option"], [role="menuitem"], li, button');
        (items[newIndex] as HTMLElement)?.focus();
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, itemCount, orientation, columns]);

  return [activeIndex, containerRef, setActiveIndex];
};

// Live region for dynamic content updates
export const LiveRegion: React.FC<{
  message: string;
  priority?: 'polite' | 'assertive';
}> = ({ message, priority = 'polite' }) => {
  return (
    <div aria-live={priority} aria-atomic="true" className="sr-only">
      {message}
    </div>
  );
};

// Accessible tooltip
export const Tooltip: React.FC<{
  content: string;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
}> = ({ content, children, position = 'top' }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const tooltipId = `tooltip-${Math.random().toString(36).substring(7)}`;

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative inline-block">
      {React.cloneElement(children, {
        'aria-describedby': isVisible ? tooltipId : undefined,
        onMouseEnter: () => setIsVisible(true),
        onMouseLeave: () => setIsVisible(false),
        onFocus: () => setIsVisible(true),
        onBlur: () => setIsVisible(false),
      })}
      {isVisible && (
        <div
          id={tooltipId}
          role="tooltip"
          className={`absolute z-50 px-3 py-2 text-sm bg-slate-900 text-white rounded-lg shadow-lg whitespace-nowrap ${positionClasses[position]}`}
        >
          {content}
          <span
            className="absolute w-2 h-2 bg-slate-900 rotate-45"
            aria-hidden="true"
            style={{
              [position === 'top'
                ? 'bottom'
                : position === 'bottom'
                  ? 'top'
                  : position === 'left'
                    ? 'right'
                    : 'left']: '-4px',
              left: position === 'top' || position === 'bottom' ? '50%' : undefined,
              top: position === 'left' || position === 'right' ? '50%' : undefined,
              transform:
                position === 'top' || position === 'bottom'
                  ? 'translateX(-50%)'
                  : 'translateY(-50%)',
            }}
          />
        </div>
      )}
    </div>
  );
};
