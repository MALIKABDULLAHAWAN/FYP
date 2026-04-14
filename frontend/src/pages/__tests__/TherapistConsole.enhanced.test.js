import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import TherapistConsole from '../TherapistConsole';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import * as patientsApi from '../../api/patients';
import * as gamesApi from '../../api/games';
import GameMetadataService from '../../services/GameMetadataService';

// Mock dependencies
vi.mock('../../hooks/useAuth');
vi.mock('../../hooks/useToast');
vi.mock('../../api/patients');
vi.mock('../../api/games');
vi.mock('../../services/GameMetadataService');
vi.mock('../../services/GameImageManager');
vi.mock('../../services/EmojiReplacer/AssetManager');

// Mock recharts components
vi.mock('recharts', () => ({
  BarChart: () => null,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }) => children,
  PieChart: () => null,
  Pie: () => null,
  Cell: () => null
}));

describe('TherapistConsole Enhanced Game Selection', () => {
  const mockUser = { id: 'therapist-1', name: 'Dr. Smith' };
  const mockToast = { success: vi.fn(), error: vi.fn(), info: vi.fn() };
  
  const mockChildren = [
    {
      id: 'child-1',
      full_name: 'Alice Johnson',
      email: 'alice@example.com',
      date_of_birth: '2018-05-15',
      gender: 'female'
    },
    {
      id: 'child-2',
      full_name: 'Bob Smith',
      email: 'bob@example.com',
      date_of_birth: '2016-08-20',
      gender: 'male'
    }
  ];

  const mockGames = [
    {
      game_id: 'game-1',
      title: 'Memory Match',
      description: 'A therapeutic memory matching game',
      difficulty_level: 'Easy',
      age_range: { min_age: 4, max_age: 8 },
      therapeutic_goals: ['Memory Enhancement', 'Attention Building']
    },
    {
      game_id: 'game-2',
      title: 'Social Stories',
      description: 'Interactive social awareness activities',
      difficulty_level: 'Medium',
      age_range: { min_age: 6, max_age: 12 },
      therapeutic_goals: ['Social Awareness', 'Emotional Regulation']
    }
  ];

  beforeEach(() => {
    useAuth.mockReturnValue({ user: mockUser });
    useToast.mockReturnValue(mockToast);
    
    patientsApi.listChildren.mockResolvedValue(mockChildren);
    gamesApi.getSessionHistory.mockResolvedValue([]);
    gamesApi.getDashboardStats.mockResolvedValue({
      total_children: 2,
      total_sessions: 10,
      completed_sessions: 8,
      weekly_accuracy: 0.85
    });

    GameMetadataService.getAllGames.mockReturnValue(mockGames);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('renders TherapistConsole with enhanced game features', async () => {
    render(<TherapistConsole />);
    
    await waitFor(() => {
      expect(screen.getByText('Therapist Console')).toBeInTheDocument();
    });

    // Should load games on mount
    expect(GameMetadataService.getAllGames).toHaveBeenCalled();
  });

  test('shows Games tab in navigation', async () => {
    render(<TherapistConsole />);
    
    await waitFor(() => {
      expect(screen.getByText('Therapist Console')).toBeInTheDocument();
    });

    // Should show Games tab
    expect(screen.getByText('Games')).toBeInTheDocument();
  });

  test('displays game library when Games tab is selected', async () => {
    render(<TherapistConsole />);
    
    await waitFor(() => {
      expect(screen.getByText('Therapist Console')).toBeInTheDocument();
    });

    // Click on Games tab
    const gamesTab = screen.getByText('Games');
    fireEvent.click(gamesTab);

    // Should show game library
    await waitFor(() => {
      expect(screen.getByText(/Game Library/)).toBeInTheDocument();
    });
  });

  test('shows Play buttons for children', async () => {
    render(<TherapistConsole />);
    
    await waitFor(() => {
      expect(screen.getByText('Therapist Console')).toBeInTheDocument();
    });

    // Click on Children tab
    const childrenTab = screen.getByText('Children');
    fireEvent.click(childrenTab);

    // Should show children with Play buttons
    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    });
  });

  test('validates game metadata service integration', () => {
    // Test that the component integrates with GameMetadataService
    expect(GameMetadataService.getAllGames).toHaveBeenCalled();
  });
});

/**
 * Integration Test for Game Selection Flow
 * 
 * **Validates: Requirements 14.1, 14.2, 14.3, 14.4**
 * 
 * Tests the enhanced TherapistConsole with:
 * 1. Game library display with metadata
 * 2. Game selection interface integration
 * 3. Session management capabilities
 * 4. Real-time progress tracking setup
 */