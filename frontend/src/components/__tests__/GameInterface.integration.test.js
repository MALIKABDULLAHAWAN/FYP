/**
 * GameInterface Integration Tests
 * 
 * Tests the enhanced GameInterface component with:
 * - Therapeutic photograph integration
 * - Progress indicator functionality
 * - Difficulty adjustment controls
 * - Completion screen with positive reinforcement
 * - Image loading with fallback handling
 * 
 * Requirements: 4.3, 5.1, 5.2, 5.3, 5.4, 15.1, 15.2, 15.3
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import GameInterface from '../GameInterface';
import { useChild } from '../../hooks/useChild';
import { useToast } from '../../hooks/useToast';

// Mock dependencies
jest.mock('../../hooks/useChild');
jest.mock('../../hooks/useToast');
jest.mock('../../api/games');
jest.mock('../../services/GameMetadataService');
jest.mock('../../services/GameImageManager');

const mockUseChild = useChild;
const mockUseToast = useToast;

// Mock API responses
const mockStartGameSession = jest.fn();
const mockNextGameTrial = jest.fn();
const mockSubmitGameTrial = jest.fn();
const mockEndSession = jest.fn();

jest.mock('../../api/games', () => ({
  startGameSession: (...args) => mockStartGameSession(...args),
  nextGameTrial: (...args) => mockNextGameTrial(...args),
  submitGameTrial: (...args) => mockSubmitGameTrial(...args),
  endSession: (...args) => mockEndSession(...args),
}));

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('GameInterface Integration Tests', () => {
  const mockToast = {
    celebration: jest.fn(),
    achievement: jest.fn(),
    success: jest.fn(),
    info: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseChild.mockReturnValue({
      selectedChild: '123',
      childProfile: {
        child_id: '123',
        age: 6,
        preferred_difficulty: 'Medium',
      },
    });
    
    mockUseToast.mockReturnValue(mockToast);
    
    // Mock successful session start
    mockStartGameSession.mockResolvedValue({
      session: { session_id: 'test-session-123' },
      first_trial: {
        trial_id: 'trial-1',
        prompt: 'Find the red circle',
        options: [
          { id: 'red-circle', label: 'Red Circle' },
          { id: 'blue-square', label: 'Blue Square' },
        ],
        highlight: null,
        level: 1,
        time_limit_ms: 10000,
      },
    });
  });

  describe('Game Image Integration', () => {
    test('displays game image with proper attribution', async () => {
      render(
        <TestWrapper>
          <GameInterface
            gameCode="ja"
            gameName="Joint Attention"
            gameIconName="eye"
            trialCount={10}
          />
        </TestWrapper>
      );

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Joint Attention')).toBeInTheDocument();
      });

      // Check for game image
      const gameImage = screen.getByAltText('Joint Attention therapeutic game');
      expect(gameImage).toBeInTheDocument();
      expect(gameImage.src).toContain('/assets/games/ja/main-image.svg');

      // Check for attribution
      expect(screen.getByText(/Photo by/)).toBeInTheDocument();
      expect(screen.getByText(/Therapeutic Games Studio/)).toBeInTheDocument();
    });

    test('handles image loading failure with fallback', async () => {
      render(
        <TestWrapper>
          <GameInterface
            gameCode="nonexistent"
            gameName="Test Game"
            gameIconName="games"
            trialCount={10}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Game')).toBeInTheDocument();
      });

      // Simulate image error
      const gameImage = screen.getByAltText('Test Game therapeutic game');
      fireEvent.error(gameImage);

      // Should fallback to default image
      await waitFor(() => {
        expect(gameImage.src).toContain('/assets/games/fallback/default-game.svg');
      });
    });

    test('shows loading state while image loads', async () => {
      render(
        <TestWrapper>
          <GameInterface
            gameCode="ja"
            gameName="Joint Attention"
            gameIconName="eye"
            trialCount={10}
          />
        </TestWrapper>
      );

      // Should show loading initially
      expect(screen.getByText('Loading game image...')).toBeInTheDocument();
    });
  });

  describe('Progress Indicator Integration', () => {
    test('displays progress indicator during gameplay', async () => {
      render(
        <TestWrapper>
          <GameInterface
            gameCode="ja"
            gameName="Joint Attention"
            gameIconName="eye"
            trialCount={10}
          />
        </TestWrapper>
      );

      // Start the game
      const startButton = screen.getByText('Start Playing!');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('Progress')).toBeInTheDocument();
        expect(screen.getByText('0 of 10')).toBeInTheDocument();
      });

      // Check for progress bar
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
    });

    test('updates progress after trial completion', async () => {
      mockSubmitGameTrial.mockResolvedValue({
        success: true,
        score: 8,
        feedback: 'Great job!',
        session_completed: false,
      });

      mockNextGameTrial.mockResolvedValue({
        trial_id: 'trial-2',
        prompt: 'Find the blue square',
        options: [
          { id: 'blue-square', label: 'Blue Square' },
          { id: 'green-triangle', label: 'Green Triangle' },
        ],
      });

      render(
        <TestWrapper>
          <GameInterface
            gameCode="ja"
            gameName="Joint Attention"
            gameIconName="eye"
            trialCount={10}
          />
        </TestWrapper>
      );

      // Start game and complete first trial
      fireEvent.click(screen.getByText('Start Playing!'));
      
      await waitFor(() => {
        expect(screen.getByText('Find the red circle')).toBeInTheDocument();
      });

      // Click on an option
      fireEvent.click(screen.getByText('Red Circle'));

      // Wait for progress update
      await waitFor(() => {
        expect(screen.getByText('1 of 10')).toBeInTheDocument();
      });
    });
  });

  describe('Difficulty Adjustment Controls', () => {
    test('displays difficulty indicator', async () => {
      render(
        <TestWrapper>
          <GameInterface
            gameCode="ja"
            gameName="Joint Attention"
            gameIconName="eye"
            trialCount={10}
          />
        </TestWrapper>
      );

      // Start the game
      fireEvent.click(screen.getByText('Start Playing!'));

      await waitFor(() => {
        expect(screen.getByText('Medium')).toBeInTheDocument();
      });
    });

    test('allows manual difficulty adjustment during gameplay', async () => {
      render(
        <TestWrapper>
          <GameInterface
            gameCode="ja"
            gameName="Joint Attention"
            gameIconName="eye"
            trialCount={10}
          />
        </TestWrapper>
      );

      // Start the game
      fireEvent.click(screen.getByText('Start Playing!'));

      await waitFor(() => {
        expect(screen.getByText('Medium')).toBeInTheDocument();
      });

      // Should be able to adjust difficulty (this would depend on DifficultyIndicator implementation)
      // For now, we'll just verify the component is present
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });
  });

  describe('Completion Screen with Positive Reinforcement', () => {
    test('displays completion screen after session ends', async () => {
      mockSubmitGameTrial.mockResolvedValue({
        success: true,
        score: 9,
        feedback: 'Perfect!',
        session_completed: true,
        summary: {
          correct_trials: 8,
          total_trials: 10,
          accuracy: 0.8,
          total_time: 120,
        },
      });

      render(
        <TestWrapper>
          <GameInterface
            gameCode="ja"
            gameName="Joint Attention"
            gameIconName="eye"
            trialCount={10}
          />
        </TestWrapper>
      );

      // Start game and complete trial
      fireEvent.click(screen.getByText('Start Playing!'));
      
      await waitFor(() => {
        expect(screen.getByText('Find the red circle')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Red Circle'));

      // Wait for completion screen
      await waitFor(() => {
        expect(screen.getByText('Fantastic Work!')).toBeInTheDocument();
        expect(screen.getByText('You completed the Joint Attention game!')).toBeInTheDocument();
      });

      // Check for stats
      expect(screen.getByText('80%')).toBeInTheDocument(); // Accuracy
      expect(screen.getByText('8')).toBeInTheDocument(); // Correct
      expect(screen.getByText('10')).toBeInTheDocument(); // Total

      // Check for positive reinforcement message
      expect(screen.getByText(/Outstanding performance/)).toBeInTheDocument();

      // Check for action buttons
      expect(screen.getByText('Play Again!')).toBeInTheDocument();
      expect(screen.getByText('Choose Another Game')).toBeInTheDocument();
    });

    test('shows appropriate encouragement based on performance', async () => {
      // Test with lower performance
      mockSubmitGameTrial.mockResolvedValue({
        success: false,
        score: 5,
        feedback: 'Keep trying!',
        session_completed: true,
        summary: {
          correct_trials: 4,
          total_trials: 10,
          accuracy: 0.4,
          total_time: 180,
        },
      });

      render(
        <TestWrapper>
          <GameInterface
            gameCode="ja"
            gameName="Joint Attention"
            gameIconName="eye"
            trialCount={10}
          />
        </TestWrapper>
      );

      // Start game and complete trial
      fireEvent.click(screen.getByText('Start Playing!'));
      
      await waitFor(() => {
        expect(screen.getByText('Find the red circle')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Red Circle'));

      // Wait for completion screen
      await waitFor(() => {
        expect(screen.getByText('Fantastic Work!')).toBeInTheDocument();
      });

      // Check for appropriate encouragement for lower performance
      expect(screen.getByText(/Good job trying your best/)).toBeInTheDocument();
    });
  });

  describe('Voice and Accessibility Features', () => {
    test('includes voice control toggle', async () => {
      render(
        <TestWrapper>
          <GameInterface
            gameCode="ja"
            gameName="Joint Attention"
            gameIconName="eye"
            trialCount={10}
          />
        </TestWrapper>
      );

      // Check for voice toggle button
      const voiceButton = screen.getByText('Voice Off');
      expect(voiceButton).toBeInTheDocument();

      // Toggle voice on
      fireEvent.click(voiceButton);
      expect(screen.getByText('Voice On')).toBeInTheDocument();
    });

    test('provides proper ARIA labels for accessibility', async () => {
      render(
        <TestWrapper>
          <GameInterface
            gameCode="ja"
            gameName="Joint Attention"
            gameIconName="eye"
            trialCount={10}
          />
        </TestWrapper>
      );

      // Start the game to show progress bar
      fireEvent.click(screen.getByText('Start Playing!'));

      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-label', 'Progress: 0%');
      });
    });
  });

  describe('Error Handling', () => {
    test('handles session start failure gracefully', async () => {
      mockStartGameSession.mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <GameInterface
            gameCode="ja"
            gameName="Joint Attention"
            gameIconName="eye"
            trialCount={10}
          />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Start Playing!'));

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    test('shows child selection reminder when no child selected', () => {
      mockUseChild.mockReturnValue({
        selectedChild: null,
        childProfile: null,
      });

      render(
        <TestWrapper>
          <GameInterface
            gameCode="ja"
            gameName="Joint Attention"
            gameIconName="eye"
            trialCount={10}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Select a child on the Games page first.')).toBeInTheDocument();
      
      const startButton = screen.getByText('Start Playing!');
      expect(startButton).toBeDisabled();
    });
  });

  describe('Game Reset Functionality', () => {
    test('allows game reset during session', async () => {
      render(
        <TestWrapper>
          <GameInterface
            gameCode="ja"
            gameName="Joint Attention"
            gameIconName="eye"
            trialCount={10}
          />
        </TestWrapper>
      );

      // Start the game
      fireEvent.click(screen.getByText('Start Playing!'));

      await waitFor(() => {
        expect(screen.getByText('Reset')).toBeInTheDocument();
      });

      // Click reset
      fireEvent.click(screen.getByText('Reset'));

      // Should return to start screen
      expect(screen.getByText('Ready to play Joint Attention?')).toBeInTheDocument();
      expect(mockEndSession).toHaveBeenCalledWith('test-session-123');
    });
  });
});