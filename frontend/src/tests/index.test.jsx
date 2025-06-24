import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Queries from '../pages/queries/index.jsx'; // ✅ adjust if your path differs
import axios from 'axios';
import { vi } from 'vitest';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('axios');

const mockQueries = [
  {
    _id: '1',
    customername: 'Charlie',
    description: 'Test description',
    resolution: 'Resolve soon',
    status: 'open',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe('Queries Component', () => {
  beforeEach(() => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        result: mockQueries,
        total: 1,
      },
    });
  });

  it('renders table with query data', async () => {
    render(<Queries />);
    expect(await screen.findByText('Charlie')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('opens modal on eye icon click', async () => {
    render(<Queries />);
    const viewBtn = await screen.findByTestId('view-query');
    fireEvent.click(viewBtn);

    await waitFor(() => expect(screen.getByText(/Query Details - Charlie/)).toBeInTheDocument());
  });
});
