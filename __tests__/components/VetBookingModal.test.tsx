import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import VetBookingModal from '../../components/VetBookingModal';
import type { Vet } from '../../types';

jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    AnimatePresence: ({ children }: any) => <>{children}</>,
    motion: {
      div: React.forwardRef(({ children, ...props }: any, ref: any) => (
        <div ref={ref} {...props}>
          {children}
        </div>
      )),
      form: React.forwardRef(({ children, ...props }: any, ref: any) => (
        <form ref={ref} {...props}>
          {children}
        </form>
      )),
    },
  };
});

jest.mock('../../hooks/useHaptics', () => ({
  useHaptics: () => ({
    hapticLight: jest.fn(),
    hapticSuccess: jest.fn(),
    hapticError: jest.fn(),
    triggerCustom: jest.fn(),
  }),
}));

const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();

jest.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({
    success: mockToastSuccess,
    error: mockToastError,
  }),
}));

const mockVet: Vet = {
  id: 1,
  name: 'Dr. Fatima Ahmed',
  specialization: 'General Pet Health',
  clinicName: 'Paws & Claws Clinic',
  address: 'House 15, Road 7, Banani, Dhaka',
  phone: '+8801712-345678',
  imageUrl: 'https://picsum.photos/seed/vet1/200/200',
  availability: 'Available Today',
  bio: 'Experienced vet.',
  qualifications: ['DVM, BAU'],
  services: [{ name: 'Online Consultation', price: 600, type: 'online' }],
  reviews: [],
};

describe('VetBookingModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <VetBookingModal vet={mockVet} isOpen={false} onClose={jest.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders modal dialog with vet name and time slots in Step 1', () => {
    render(<VetBookingModal vet={mockVet} isOpen={true} onClose={jest.fn()} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Book Online Consultation')).toBeInTheDocument();
    expect(screen.getByText('Dr. Fatima Ahmed')).toBeInTheDocument();
    expect(screen.getByText('Select a preferred consultation time:')).toBeInTheDocument();

    const slots = ['10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'];
    slots.forEach((slot) => {
      expect(screen.getByRole('button', { name: slot })).toBeInTheDocument();
    });
  });

  it('advances to Step 2 upon selecting a time slot and allows returning to Step 1', () => {
    render(<VetBookingModal vet={mockVet} isOpen={true} onClose={jest.fn()} />);

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: '10:00 AM' }));
      jest.advanceTimersByTime(300);
    });

    // Step 2: Issue description form
    expect(screen.getByText(/Selected time slot:/i)).toBeInTheDocument();
    expect(screen.getByText('10:00 AM')).toBeInTheDocument();
    expect(screen.getByLabelText(/Briefly describe your pet's issue:/i)).toBeInTheDocument();

    // Proceed button disabled when textarea is empty
    const proceedButton = screen.getByRole('button', { name: /Proceed to Confirmation/i });
    expect(proceedButton).toBeDisabled();

    // Back to time selection
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /Back to time selection/i }));
      jest.advanceTimersByTime(300);
    });
    expect(screen.getByText('Select a preferred consultation time:')).toBeInTheDocument();
  });

  it('advances to Step 3 confirmation upon submitting the issue description', async () => {
    render(<VetBookingModal vet={mockVet} isOpen={true} onClose={jest.fn()} />);

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: '02:00 PM' }));
      jest.advanceTimersByTime(300);
    });

    const textarea = screen.getByLabelText(/Briefly describe your pet's issue:/i);
    fireEvent.change(textarea, {
      target: { value: 'Cat has mild ear inflammation and scratches frequently.' },
    });

    const proceedButton = screen.getByRole('button', { name: /Proceed to Confirmation/i });
    expect(proceedButton).not.toBeDisabled();

    act(() => {
      fireEvent.click(proceedButton);
    });

    expect(screen.getByRole('button', { name: /Processing.../i })).toBeInTheDocument();

    // Fast forward simulated 800ms API boundary
    act(() => {
      jest.advanceTimersByTime(800);
    });

    // Step 3: Confirmation
    expect(screen.getByText('Consultation Request Received')).toBeInTheDocument();
    expect(
      screen.getByText(/Your request for an online consultation with Dr. Fatima Ahmed/i)
    ).toBeInTheDocument();
    expect(screen.getByText('02:00 PM')).toBeInTheDocument();
  });

  it('calls onClose when close icon or confirmation Close button is clicked', () => {
    const handleClose = jest.fn();
    render(<VetBookingModal vet={mockVet} isOpen={true} onClose={handleClose} />);

    // Close via header button
    const closeBtn = screen.getByRole('button', { name: /Close booking modal/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape key press', () => {
    const handleClose = jest.fn();
    render(<VetBookingModal vet={mockVet} isOpen={true} onClose={handleClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalled();
  });
});
