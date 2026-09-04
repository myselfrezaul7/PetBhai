import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ServicesPage from '../../pages/ServicesPage';

jest.mock('../../contexts/VetContext', () => ({
  useVets: () => ({
    vets: [
      {
        id: 1,
        name: 'Dr. Fatima Ahmed',
        specialization: 'General Pet Health',
        clinicName: 'Paws & Claws Clinic',
        address: 'Banani, Dhaka',
        phone: '+8801712-345678',
        imageUrl: 'https://picsum.photos/seed/vet1/200/200',
        availability: 'Available Today',
        bio: 'Experienced veterinarian.',
        qualifications: ['DVM, BAU'],
        services: [{ name: 'Online Consultation', price: 600, type: 'online' }],
        reviews: [],
      },
    ],
    loading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

const renderComponent = () =>
  render(
    <BrowserRouter>
      <ServicesPage />
    </BrowserRouter>
  );

describe('ServicesPage', () => {
  it('renders page header, badge, and title correctly', () => {
    renderComponent();

    expect(screen.getByText(/Trusted Professionals/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Professional Pet Services/i })).toBeInTheDocument();
    expect(
      screen.getByText(/Find and book trusted local professionals for every pet need/i)
    ).toBeInTheDocument();
  });

  it('renders all four service tabs with Vets active by default', () => {
    renderComponent();

    const vetsTab = screen.getByRole('button', { name: 'Vets' });
    const groomersTab = screen.getByRole('button', { name: 'Groomers' });
    const trainersTab = screen.getByRole('button', { name: 'Trainers' });
    const sittersTab = screen.getByRole('button', { name: 'Sitters' });

    expect(vetsTab).toBeInTheDocument();
    expect(groomersTab).toBeInTheDocument();
    expect(trainersTab).toBeInTheDocument();
    expect(sittersTab).toBeInTheDocument();

    // Vets tab is active by default
    expect(vetsTab).toHaveClass('border-orange-500');

    // Default Vets preview services
    expect(screen.getByText('Home Consultation')).toBeInTheDocument();
    expect(screen.getByText('Video Vet Session')).toBeInTheDocument();
    expect(screen.getByText('Emergency Support')).toBeInTheDocument();

    // Renders verified veterinarians
    expect(screen.getByText('Verified Veterinarians')).toBeInTheDocument();
    expect(screen.getByText('Dr. Fatima Ahmed')).toBeInTheDocument();
  });

  it('switches service cards when switching tabs', () => {
    renderComponent();

    // Click Groomers tab
    fireEvent.click(screen.getByRole('button', { name: 'Groomers' }));
    expect(screen.getByText('At-Home Grooming')).toBeInTheDocument();
    expect(screen.getByText('Spa & Coat Care')).toBeInTheDocument();
    expect(screen.getByText('Nail & Ear Care')).toBeInTheDocument();

    // Click Trainers tab
    fireEvent.click(screen.getByRole('button', { name: 'Trainers' }));
    expect(screen.getByText('Puppy Basics')).toBeInTheDocument();
    expect(screen.getByText('Behavior Reset')).toBeInTheDocument();

    // Click Sitters tab
    fireEvent.click(screen.getByRole('button', { name: 'Sitters' }));
    expect(screen.getByText('Drop-In Sitting')).toBeInTheDocument();
    expect(screen.getByText('Overnight Care')).toBeInTheDocument();
  });

  it('contains links to /services/booking for service requests', () => {
    renderComponent();

    const requestLinks = screen.getAllByRole('link', { name: /Request/i });
    expect(requestLinks.length).toBeGreaterThan(0);

    requestLinks.forEach((link) => {
      expect(link.getAttribute('href')).toContain('/services/booking');
    });
  });

  it('renders specialized service CTAs for Pet Taxi and Pet Photography', () => {
    renderComponent();

    const taxiCta = screen.getByRole('link', { name: /Pet Taxi & Transport/i });
    const photoCta = screen.getByRole('link', { name: /Pet Photography/i });

    expect(taxiCta.getAttribute('href')).toContain('/services/booking?service=transport');
    expect(photoCta.getAttribute('href')).toContain('/services/booking?service=photography');
  });

  it('renders district location selector with options', () => {
    renderComponent();

    const select = screen.getByLabelText(/Location:/i);
    expect(select).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'All Bangladesh' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Dhaka' })).toBeInTheDocument();

    fireEvent.change(select, { target: { value: 'Dhaka' } });
    expect((select as HTMLSelectElement).value).toBe('Dhaka');
  });
});
