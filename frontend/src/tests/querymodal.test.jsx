import { render, screen } from '@testing-library/react';
import QueryModal from '../pages/queries/querymodal.jsx'; // adjust the path as needed

const mockQuery = {
  _id: '1',
  customername: 'Charlie',
  description: 'A regular customer',
  resolution: 'Resolved in 10 days',
  status: 'open',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('QueryModal', () => {
  it('renders modal title with customer name', () => {
    render(<QueryModal open={true} query={mockQuery} onClose={() => {}} onUpdate={() => {}} />);
    expect(screen.getByText(/Query Details - Charlie/)).toBeInTheDocument();
  });

  it('renders description field', () => {
    render(<QueryModal open={true} query={mockQuery} onClose={() => {}} onUpdate={() => {}} />);
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });
});
