import { render, screen } from '@testing-library/react';
import Home from '../app/page';
import '@testing-library/jest-dom';

describe('Dashboard (Home)', () => {
  it('renders the dashboard heading', () => {
    render(<Home />);
    const heading = screen.getByText(/WinRepo Dashboard/i);
    expect(heading).toBeInTheDocument();
  });

  it('renders stats cards', () => {
    render(<Home />);
    expect(screen.getByText(/Total Downloads/i)).toBeInTheDocument();
    expect(screen.getByText(/Software Packages/i)).toBeInTheDocument();
    expect(screen.getByText(/Endpoints Managed/i)).toBeInTheDocument();
    expect(screen.getByText(/KB Articles/i)).toBeInTheDocument();
  });
});
