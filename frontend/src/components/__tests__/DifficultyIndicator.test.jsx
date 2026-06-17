/**
 * Unit tests for DifficultyIndicator component
 * Tests difficulty display, sizing, and interactivity
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DifficultyIndicator from '../DifficultyIndicator.jsx';

describe('DifficultyIndicator Component', () => {
  describe('rendering', () => {
    test('should render Easy difficulty indicator', () => {
      render(<DifficultyIndicator difficulty="Easy" />);
      
      const badge = screen.getByRole('img', { name: /Easy difficulty/i });
      expect(badge).toBeInTheDocument();
    });

    test('should render Medium difficulty indicator', () => {
      render(<DifficultyIndicator difficulty="Medium" />);
      
      const badge = screen.getByRole('img', { name: /Medium difficulty/i });
      expect(badge).toBeInTheDocument();
    });

    test('should render Hard difficulty indicator', () => {
      render(<DifficultyIndicator difficulty="Hard" />);
      
      const badge = screen.getByRole('img', { name: /Hard difficulty/i });
      expect(badge).toBeInTheDocument();
    });

    test('should render label by default', () => {
      render(<DifficultyIndicator difficulty="Easy" showLabel={true} />);
      
      expect(screen.getByText('Easy')).toBeInTheDocument();
    });

    test('should hide label when showLabel is false', () => {
      render(<DifficultyIndicator difficulty="Easy" showLabel={false} />);
      
      expect(screen.queryByText('Easy')).not.toBeInTheDocument();
    });

    test('should render description when showDescription is true', () => {
      render(<DifficultyIndicator difficulty="Easy" showDescription={true} />);
      
      expect(screen.getByText(/beginners/i)).toBeInTheDocument();
    });

    test('should not render description by default', () => {
      render(<DifficultyIndicator difficulty="Easy" showDescription={false} />);
      
      expect(screen.queryByText(/beginners/i)).not.toBeInTheDocument();
    });

    test('should render age range in label', () => {
      render(<DifficultyIndicator difficulty="Easy" showLabel={true} />);
      
      expect(screen.getByText('Ages 3-5')).toBeInTheDocument();
    });
  });

  describe('size variants', () => {
    test('should apply small size class', () => {
      const { container } = render(<DifficultyIndicator difficulty="Easy" size="small" />);
      
      expect(container.querySelector('.difficulty-small')).toBeInTheDocument();
    });

    test('should apply medium size class', () => {
      const { container } = render(<DifficultyIndicator difficulty="Easy" size="medium" />);
      
      expect(container.querySelector('.difficulty-medium')).toBeInTheDocument();
    });

    test('should apply large size class', () => {
      const { container } = render(<DifficultyIndicator difficulty="Easy" size="large" />);
      
      expect(container.querySelector('.difficulty-large')).toBeInTheDocument();
    });
  });

  describe('interactive mode', () => {
    test('should render difficulty selector when interactive is true', () => {
      render(<DifficultyIndicator difficulty="Easy" interactive={true} />);
      
      expect(screen.getByRole('button', { name: 'Easy' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Medium' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Hard' })).toBeInTheDocument();
    });

    test('should not render selector when interactive is false', () => {
      render(<DifficultyIndicator difficulty="Easy" interactive={false} />);
      
      expect(screen.queryByRole('button', { name: 'Easy' })).not.toBeInTheDocument();
    });

    test('should mark current difficulty as active', () => {
      render(<DifficultyIndicator difficulty="Medium" interactive={true} />);
      
      const mediumButton = screen.getByRole('button', { name: 'Medium' });
      expect(mediumButton).toHaveClass('active');
    });

    test('should call onDifficultyChange when difficulty option is clicked', () => {
      const handleChange = jest.fn();
      render(
        <DifficultyIndicator
          difficulty="Easy"
          interactive={true}
          onDifficultyChange={handleChange}
        />
      );
      
      const mediumButton = screen.getByRole('button', { name: 'Medium' });
      fireEvent.click(mediumButton);
      
      expect(handleChange).toHaveBeenCalledWith('Medium');
    });

    test('should not call onDifficultyChange if callback is not provided', () => {
      render(<DifficultyIndicator difficulty="Easy" interactive={true} />);
      
      const mediumButton = screen.getByRole('button', { name: 'Medium' });
      expect(() => fireEvent.click(mediumButton)).not.toThrow();
    });
  });

  describe('accessibility', () => {
    test('should have proper aria-label on badge', () => {
      render(<DifficultyIndicator difficulty="Easy" />);
      
      const badge = screen.getByRole('img', { name: /Easy difficulty/i });
      expect(badge).toHaveAttribute('aria-label', 'Easy difficulty');
    });

    test('should have aria-pressed on difficulty options', () => {
      render(<DifficultyIndicator difficulty="Easy" interactive={true} />);
      
      const easyButton = screen.getByRole('button', { name: 'Easy' });
      const mediumButton = screen.getByRole('button', { name: 'Medium' });
      
      expect(easyButton).toHaveAttribute('aria-pressed', 'true');
      expect(mediumButton).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('default props', () => {
    test('should use Medium as default difficulty', () => {
      render(<DifficultyIndicator />);
      
      const badge = screen.getByRole('img', { name: /Medium difficulty/i });
      expect(badge).toBeInTheDocument();
    });

    test('should show label by default', () => {
      render(<DifficultyIndicator difficulty="Easy" />);
      
      expect(screen.getByText('Easy')).toBeInTheDocument();
    });

    test('should use medium size by default', () => {
      const { container } = render(<DifficultyIndicator difficulty="Easy" />);
      
      expect(container.querySelector('.difficulty-medium')).toBeInTheDocument();
    });

    test('should not be interactive by default', () => {
      render(<DifficultyIndicator difficulty="Easy" />);
      
      expect(screen.queryByRole('button', { name: 'Easy' })).not.toBeInTheDocument();
    });
  });

  describe('content accuracy', () => {
    test('should display correct description for Easy', () => {
      render(<DifficultyIndicator difficulty="Easy" showDescription={true} />);
      
      expect(screen.getByText(/Great for beginners/i)).toBeInTheDocument();
    });

    test('should display correct description for Medium', () => {
      render(<DifficultyIndicator difficulty="Medium" showDescription={true} />);
      
      expect(screen.getByText(/appropriate challenge/i)).toBeInTheDocument();
    });

    test('should display correct description for Hard', () => {
      render(<DifficultyIndicator difficulty="Hard" showDescription={true} />);
      
      expect(screen.getByText(/advanced learners/i)).toBeInTheDocument();
    });

    test('should display correct age range for Easy', () => {
      render(<DifficultyIndicator difficulty="Easy" showLabel={true} />);
      
      expect(screen.getByText('Ages 3-5')).toBeInTheDocument();
    });

    test('should display correct age range for Medium', () => {
      render(<DifficultyIndicator difficulty="Medium" showLabel={true} />);
      
      expect(screen.getByText('Ages 6-8')).toBeInTheDocument();
    });

    test('should display correct age range for Hard', () => {
      render(<DifficultyIndicator difficulty="Hard" showLabel={true} />);
      
      expect(screen.getByText('Ages 9-12')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    test('should have difficulty-indicator class', () => {
      const { container } = render(<DifficultyIndicator difficulty="Easy" />);
      
      expect(container.querySelector('.difficulty-indicator')).toBeInTheDocument();
    });

    test('should have difficulty-badge element', () => {
      const { container } = render(<DifficultyIndicator difficulty="Easy" />);
      
      expect(container.querySelector('.difficulty-badge')).toBeInTheDocument();
    });

    test('should have difficulty-label element when label is shown', () => {
      const { container } = render(<DifficultyIndicator difficulty="Easy" showLabel={true} />);
      
      expect(container.querySelector('.difficulty-label')).toBeInTheDocument();
    });

    test('should have difficulty-description element when description is shown', () => {
      const { container } = render(<DifficultyIndicator difficulty="Easy" showDescription={true} />);
      
      expect(container.querySelector('.difficulty-description')).toBeInTheDocument();
    });

    test('should have difficulty-selector element when interactive', () => {
      const { container } = render(<DifficultyIndicator difficulty="Easy" interactive={true} />);
      
      expect(container.querySelector('.difficulty-selector')).toBeInTheDocument();
    });
  });
});
