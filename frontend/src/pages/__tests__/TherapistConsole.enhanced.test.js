import { render } from '@testing-library/react';
import TherapistConsole from '../TherapistConsole';

jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 1, full_name: 'Therapist' } })
}));

jest.mock('../../hooks/useToast', () => ({
  useToast: () => ({
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn()
  })
}));

describe('TherapistConsole enhanced (smoke)', () => {
  test('renders without crashing', () => {
    const { container } = render(<TherapistConsole />);
    expect(container).toBeDefined();
  });
});
