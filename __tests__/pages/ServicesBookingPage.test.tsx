import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ServicesBookingPage from '../../pages/ServicesBookingPage';

const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();

jest.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({
    success: mockToastSuccess,
    error: mockToastError,
  }),
}));

const renderComponent = () =>
  render(
    <BrowserRouter>
      <ServicesBookingPage />
    </BrowserRouter>
  );

describe('ServicesBookingPage', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    jest.clearAllMocks();
    delete (window as any).location;
    (window as any).location = { href: '' };
  });

  afterAll(() => {
    window.location = originalLocation;
  });

  it('renders Pet Taxi tab by default with required form inputs', () => {
    renderComponent();

    expect(screen.getByRole('button', { name: /Pet Taxi & Transport/i })).toHaveClass(
      'bg-orange-500'
    );
    expect(screen.getByText('Safe Rides for Your Best Friend')).toBeInTheDocument();

    const mobileInput = screen.getByLabelText(/Mobile Number/i);
    expect(mobileInput).toBeRequired();
    expect(mobileInput).toHaveAttribute('pattern', '[0-9]{11}');

    expect(screen.getByLabelText(/Pickup Location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Destination Type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Date & Time/i)).toBeRequired();
    expect(screen.getByRole('button', { name: /Book Pet Taxi/i })).toBeInTheDocument();
  });

  it('switches to Pet Photography tab and displays package choices', () => {
    renderComponent();

    const photoTab = screen.getByRole('button', { name: /Pet Photography/i });
    fireEvent.click(photoTab);

    expect(photoTab).toHaveClass('bg-pink-500');
    expect(screen.getByText('Capture Precious Moments')).toBeInTheDocument();
    expect(screen.getByText(/Mini Session \(2000 BDT\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Standard \(5000 BDT\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Premium \(10000 BDT\)/i)).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /Book Photoshoot/i })).toBeInTheDocument();
  });

  it('handles Pet Taxi booking submission and triggers mailto and toast', async () => {
    renderComponent();

    fireEvent.change(screen.getByLabelText(/Mobile Number/i), { target: { value: '01712345678' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/Pickup Location/i), { target: { value: 'Dhaka' } });
    fireEvent.change(screen.getByLabelText(/Destination Type/i), {
      target: { value: 'Veterinary Clinic' },
    });
    fireEvent.change(screen.getByLabelText(/Date & Time/i), {
      target: { value: '2026-10-15T14:30' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Book Pet Taxi/i }));

    await waitFor(() => {
      expect(window.location.href).toContain('mailto:petbhaibd@gmail.com');
      expect(window.location.href).toContain('01712345678');
      expect(mockToastSuccess).toHaveBeenCalledWith(
        expect.stringContaining('Booking request sent!')
      );
    });
  });

  it('handles Pet Photography booking submission with selected package', async () => {
    renderComponent();

    fireEvent.click(screen.getByRole('button', { name: /Pet Photography/i }));

    fireEvent.change(screen.getByLabelText(/Mobile Number/i), { target: { value: '01987654321' } });
    fireEvent.change(screen.getByLabelText(/Preferred Date/i), { target: { value: '2026-11-01' } });

    // Select Mini Session package
    const miniRadio = screen.getByDisplayValue('mini');
    fireEvent.click(miniRadio);

    fireEvent.click(screen.getByRole('button', { name: /Book Photoshoot/i }));

    await waitFor(() => {
      expect(window.location.href).toContain('mailto:petbhaibd@gmail.com');
      expect(window.location.href).toContain('mini');
      expect(mockToastSuccess).toHaveBeenCalled();
    });
  });
});
