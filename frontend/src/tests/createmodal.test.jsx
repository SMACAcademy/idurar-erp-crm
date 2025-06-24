import { render, screen } from '@testing-library/react';
import CreateQuery from '../pages/queries/createquery.jsx';
import { vi } from 'vitest';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('@/components/AutoCompleteAsync', () => ({
  default: () => <input placeholder="customer autocomplete" />,
}));

vi.mock('axios');

describe('CreateQuery Component', () => {
  it('renders form and submit button', () => {
    render(<CreateQuery />);
    expect(screen.getByText('Create a New Query')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Query/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
  });
});
