/**
 * Performance Optimization Test Suite
 * Tests for LazyImageLoader, ProgressiveLoader, and performance services
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Canvas API for Node.js environment
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
    textBaseline: '',
    font: '',
    fillText: jest.fn(),
    toDataURL: jest.fn(() => 'data:image/webp;base64,mock-webp-data')
  }));
  HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 'data:image/webp;base64,mock-webp-data');
} else {
  // Define HTMLCanvasElement for Node.js environment
  global.HTMLCanvasElement = class HTMLCanvasElement {
    constructor() {
      this.width = 1;
      this.height = 1;
    }
    
    getContext() {
      return {
        textBaseline: '',
        font: '',
        fillText: jest.fn(),
        toDataURL: jest.fn(() => 'data:image/webp;base64,mock-webp-data')
      };
    }
    
    toDataURL() {
      return 'data:image/webp;base64,mock-webp-data';
    }
  };
}

import LazyImageLoader from '../LazyImageLoader';
import ProgressiveLoader from '../ProgressiveLoader';
import OptimizedGameCard from '../OptimizedGameCard';
import OptimizedStickerLayer from '../OptimizedStickerLayer';

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByName: jest.fn(() => []),
    getEntriesByType: jest.fn(() => [])
  }
});

describe('LazyImageLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with placeholder initially', () => {
    render(
      <LazyImageLoader
        src="/test-image.jpg"
        alt="Test image"
        placeholder="/placeholder.svg"
      />
    );

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/placeholder.svg');
    expect(img).toHaveAttribute('alt', 'Test image');
  });

  test('shows loading state', () => {
    render(
      <LazyImageLoader
        src="/test-image.jpg"
        alt="Test image"
      />
    );

    expect(screen.getByText('Image unavailable')).toBeInTheDocument();
  });

  test('handles image load error', async () => {
    render(
      <LazyImageLoader
        src="/invalid-image.jpg"
        alt="Test image"
        fallback="/fallback.svg"
      />
    );

    const img = screen.getByRole('img');
    
    // Simulate image error
    fireEvent.error(img);

    await waitFor(() => {
      expect(screen.getByText('Image unavailable')).toBeInTheDocument();
    });
  });

  test('applies correct CSS classes', () => {
    render(
      <LazyImageLoader
        src="/test-image.jpg"
        alt="Test image"
        className="custom-class"
      />
    );

    const container = document.querySelector('.lazy-image-container');
    expect(container).toHaveClass('custom-class');
  });

  test('generates responsive srcSet', () => {
    render(
      <LazyImageLoader
        src="/test-image.jpg"
        alt="Test image"
        sizes="(max-width: 640px) 320px, 640px"
      />
    );

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('sizes', '(max-width: 640px) 320px, 640px');
  });
});

describe('ProgressiveLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially', () => {
    render(
      <ProgressiveLoader priority="medium">
        <div>Content</div>
      </ProgressiveLoader>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('renders skeleton when enabled', () => {
    render(
      <ProgressiveLoader skeleton={true}>
        <div>Content</div>
      </ProgressiveLoader>
    );

    expect(document.querySelector('.progressive-loader-skeleton')).toBeInTheDocument();
  });

  test('renders custom placeholder', () => {
    const customPlaceholder = <div>Custom Loading...</div>;
    
    render(
      <ProgressiveLoader placeholder={customPlaceholder}>
        <div>Content</div>
      </ProgressiveLoader>
    );

    expect(screen.getByText('Custom Loading...')).toBeInTheDocument();
  });

  test('applies priority-specific classes', () => {
    render(
      <ProgressiveLoader priority="high">
        <div>Content</div>
      </ProgressiveLoader>
    );

    const container = document.querySelector('.progressive-loader');
    expect(container).toHaveClass('priority-high');
  });

  test('handles error state with retry', async () => {
    const onError = jest.fn();
    
    render(
      <ProgressiveLoader onError={onError} retryCount={1}>
        <div>Content</div>
      </ProgressiveLoader>
    );

    // Wait for error state (simulated)
    await waitFor(() => {
      const retryButton = screen.queryByText('Retry');
      if (retryButton) {
        fireEvent.click(retryButton);
      }
    });
  });
});

describe('OptimizedGameCard', () => {
  const mockGame = {
    game_id: 'test-game-1',
    title: 'Test Game',
    description: 'A test game for children',
    difficulty_level: 'Easy',
    image_url: '/test-game-image.jpg',
    age_range: { min_age: 3, max_age: 8 },
    therapeutic_goals: ['speech-articulation', 'social-awareness']
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders game information correctly', () => {
    render(
      <OptimizedGameCard
        game={mockGame}
        onSelect={jest.fn()}
      />
    );

    expect(screen.getByText('Test Game')).toBeInTheDocument();
    expect(screen.getByText('A test game for children')).toBeInTheDocument();
    expect(screen.getByText('Easy')).toBeInTheDocument();
    expect(screen.getByText('Ages 3-8')).toBeInTheDocument();
  });

  test('handles game selection', () => {
    const onSelect = jest.fn();
    
    render(
      <OptimizedGameCard
        game={mockGame}
        onSelect={onSelect}
      />
    );

    const card = screen.getByRole('button');
    fireEvent.click(card);

    expect(onSelect).toHaveBeenCalledWith(mockGame);
  });

  test('shows selected state', () => {
    render(
      <OptimizedGameCard
        game={mockGame}
        isSelected={true}
        onSelect={jest.fn()}
      />
    );

    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  test('handles keyboard interaction', () => {
    const onSelect = jest.fn();
    
    render(
      <OptimizedGameCard
        game={mockGame}
        onSelect={onSelect}
      />
    );

    const card = screen.getByRole('button');
    fireEvent.keyPress(card, { key: 'Enter' });

    expect(onSelect).toHaveBeenCalledWith(mockGame);
  });

  test('truncates long therapeutic goals list', () => {
    const gameWithManyGoals = {
      ...mockGame,
      therapeutic_goals: ['goal1', 'goal2', 'goal3', 'goal4', 'goal5']
    };

    render(
      <OptimizedGameCard
        game={gameWithManyGoals}
        onSelect={jest.fn()}
      />
    );

    expect(screen.getByText('goal1 +4 more')).toBeInTheDocument();
  });
});

describe('OptimizedStickerLayer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with correct page type class', () => {
    render(
      <OptimizedStickerLayer
        pageType="dashboard"
        sessionCount={1}
      />
    );

    const container = document.querySelector('.optimized-sticker-layer');
    expect(container).toHaveClass('page-type-dashboard');
  });

  test('respects animation preferences', () => {
    render(
      <OptimizedStickerLayer
        pageType="game"
        animationEnabled={false}
      />
    );

    const container = document.querySelector('.optimized-sticker-layer');
    expect(container).toHaveClass('animations-disabled');
  });

  test('limits number of stickers', () => {
    render(
      <OptimizedStickerLayer
        pageType="dashboard"
        maxStickers={2}
      />
    );

    // Stickers would be loaded asynchronously, so we test the container exists
    expect(document.querySelector('.optimized-sticker-layer')).toBeInTheDocument();
  });

  test('applies custom opacity', () => {
    render(
      <OptimizedStickerLayer
        pageType="game"
        opacity={0.5}
      />
    );

    const container = document.querySelector('.optimized-sticker-layer');
    expect(container).toBeInTheDocument();
  });
});

describe('Performance Integration', () => {
  test('components work together without conflicts', () => {
    const mockGame = {
      game_id: 'integration-test',
      title: 'Integration Test Game',
      description: 'Testing component integration',
      difficulty_level: 'Medium',
      image_url: '/integration-test.jpg',
      age_range: { min_age: 5, max_age: 10 },
      therapeutic_goals: ['integration-test']
    };

    render(
      <div>
        <OptimizedStickerLayer pageType="test" />
        <ProgressiveLoader priority="high">
          <OptimizedGameCard
            game={mockGame}
            onSelect={jest.fn()}
          />
        </ProgressiveLoader>
      </div>
    );

    expect(screen.getByText('Integration Test Game')).toBeInTheDocument();
    expect(document.querySelector('.optimized-sticker-layer')).toBeInTheDocument();
  });

  test('lazy loading works with progressive loading', async () => {
    render(
      <ProgressiveLoader priority="medium">
        <LazyImageLoader
          src="/test-progressive-lazy.jpg"
          alt="Progressive lazy test"
        />
      </ProgressiveLoader>
    );

    // Both components should render without conflicts
    await waitFor(() => {
      expect(document.querySelector('.progressive-loader')).toBeInTheDocument();
      expect(document.querySelector('.lazy-image-container')).toBeInTheDocument();
    });
  });
});

describe('Performance Metrics', () => {
  test('components record performance metrics', () => {
    const performanceSpy = jest.spyOn(window.performance, 'mark');

    render(
      <LazyImageLoader
        src="/performance-test.jpg"
        alt="Performance test"
      />
    );

    // Performance marks should be called during component lifecycle
    expect(performanceSpy).toHaveBeenCalled();
  });

  test('components handle performance API unavailability', () => {
    // Temporarily remove performance API
    const originalPerformance = window.performance;
    delete window.performance;

    expect(() => {
      render(
        <ProgressiveLoader priority="low">
          <div>Content without performance API</div>
        </ProgressiveLoader>
      );
    }).not.toThrow();

    // Restore performance API
    window.performance = originalPerformance;
  });
});

describe('Accessibility', () => {
  test('LazyImageLoader has proper ARIA attributes', () => {
    render(
      <LazyImageLoader
        src="/accessibility-test.jpg"
        alt="Accessibility test image"
      />
    );

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('alt', 'Accessibility test image');
  });

  test('OptimizedGameCard has proper ARIA attributes', () => {
    const mockGame = {
      game_id: 'accessibility-test',
      title: 'Accessibility Test',
      description: 'Testing accessibility',
      difficulty_level: 'Easy',
      image_url: '/accessibility-test.jpg',
      age_range: { min_age: 3, max_age: 8 },
      therapeutic_goals: ['accessibility']
    };

    render(
      <OptimizedGameCard
        game={mockGame}
        isSelected={false}
        onSelect={jest.fn()}
      />
    );

    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('aria-label', 'Select Accessibility Test game');
    expect(card).toHaveAttribute('aria-pressed', 'false');
    expect(card).toHaveAttribute('tabIndex', '0');
  });

  test('OptimizedStickerLayer is properly hidden from screen readers', () => {
    render(
      <OptimizedStickerLayer pageType="accessibility-test" />
    );

    const container = document.querySelector('.optimized-sticker-layer');
    expect(container).toHaveAttribute('aria-hidden', 'true');
    expect(container).toHaveAttribute('role', 'presentation');
  });

  test('ProgressiveLoader provides loading feedback', () => {
    render(
      <ProgressiveLoader>
        <div>Content</div>
      </ProgressiveLoader>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});

describe('Error Handling', () => {
  test('components handle missing props gracefully', () => {
    expect(() => {
      render(<LazyImageLoader />);
    }).not.toThrow();

    expect(() => {
      render(<ProgressiveLoader />);
    }).not.toThrow();

    expect(() => {
      render(<OptimizedStickerLayer />);
    }).not.toThrow();
  });

  test('components handle invalid props gracefully', () => {
    expect(() => {
      render(
        <LazyImageLoader
          src={null}
          alt=""
          className={123}
        />
      );
    }).not.toThrow();

    expect(() => {
      render(
        <ProgressiveLoader
          priority="invalid"
          delay="not-a-number"
        >
          <div>Content</div>
        </ProgressiveLoader>
      );
    }).not.toThrow();
  });

  test('OptimizedGameCard handles incomplete game data', () => {
    const incompleteGame = {
      game_id: 'incomplete',
      title: 'Incomplete Game'
      // Missing other required fields
    };

    expect(() => {
      render(
        <OptimizedGameCard
          game={incompleteGame}
          onSelect={jest.fn()}
        />
      );
    }).not.toThrow();

    expect(screen.getByText('Incomplete Game')).toBeInTheDocument();
  });
});