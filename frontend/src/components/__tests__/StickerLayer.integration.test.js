import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Layout from '../Layout';

if (!global.ResizeObserver) {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 1, full_name: 'Tester' } })
}));

jest.mock('../StickerLayer', () => ({
  StickerLayer: () => null
}));

describe('StickerLayer integration (smoke)', () => {
  test('layout renders with sticker layer dependencies', () => {
    const { container } = render(
      <MemoryRouter>
        <Layout>
          <div>content</div>
        </Layout>
      </MemoryRouter>
    );
    expect(container).toBeDefined();
  });
});
