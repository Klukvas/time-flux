import { Test, TestingModule } from '@nestjs/testing';
import { DayStatesService } from './day-states.service.js';
import { DayStatesRepository } from './day-states.repository.js';
import {
  DayStateInUseError,
  DayStateNotFoundError,
  RecommendationNotFoundError,
} from '../common/errors/app.error.js';

describe('DayStatesService', () => {
  let service: DayStatesService;
  let repo: jest.Mocked<DayStatesRepository>;

  const userId = 'user-1';

  const mockDayState = {
    id: 'ds-1',
    userId,
    name: 'Great',
    color: '#22C55E',
    isSystem: false,
    order: 0,
    score: 9,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DayStatesService,
        {
          provide: DayStatesRepository,
          useValue: {
            findAllByUserId: jest.fn(),
            findByIdAndUserId: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            countByUserId: jest.fn(),
            countDaysForDayState: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(DayStatesService);
    repo = module.get(DayStatesRepository);
  });

  // ─── DELETE CONSTRAINTS ────────────────────────────────────

  describe('delete', () => {
    it('should reject deleting mood used by existing days', async () => {
      repo.findByIdAndUserId.mockResolvedValue(mockDayState);
      repo.countDaysForDayState.mockResolvedValue(10);

      await expect(service.delete(userId, 'ds-1')).rejects.toThrow(DayStateInUseError);
    });

    it('should allow deleting mood not used by any day', async () => {
      repo.findByIdAndUserId.mockResolvedValue(mockDayState);
      repo.countDaysForDayState.mockResolvedValue(0);
      repo.delete.mockResolvedValue(undefined as any);

      await expect(service.delete(userId, 'ds-1')).resolves.toBeUndefined();
      expect(repo.delete).toHaveBeenCalledWith('ds-1');
    });

    it('should reject deleting non-existent mood', async () => {
      repo.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.delete(userId, 'nonexistent')).rejects.toThrow(
        DayStateNotFoundError,
      );
    });
  });

  // ─── CREATE ────────────────────────────────────────────────

  describe('create', () => {
    it('should store score value from DTO', async () => {
      repo.countByUserId.mockResolvedValue(0);
      repo.create.mockResolvedValue(mockDayState);

      await service.create(userId, {
        name: 'Custom',
        color: '#FF0000',
        score: 7,
      });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ score: 7 }),
      );
    });

    it('should auto-assign order when not provided', async () => {
      repo.countByUserId.mockResolvedValue(5);
      repo.create.mockResolvedValue({ ...mockDayState, order: 5 });

      await service.create(userId, {
        name: 'New Mood',
        color: '#FF0000',
        score: 5,
      });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ order: 5 }),
      );
    });

    it('should use provided order when specified', async () => {
      repo.countByUserId.mockResolvedValue(5);
      repo.create.mockResolvedValue({ ...mockDayState, order: 0 });

      await service.create(userId, {
        name: 'New Mood',
        color: '#FF0000',
        score: 5,
        order: 0,
      });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ order: 0 }),
      );
    });
  });

  // ─── CREATE FROM RECOMMENDATION ────────────────────────────

  describe('createFromRecommendation', () => {
    it('should create mood with recommendation color and score', async () => {
      repo.countByUserId.mockResolvedValue(0);
      repo.create.mockResolvedValue(mockDayState);

      await service.createFromRecommendation(userId, { key: 'great' as any, name: 'Great' });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          color: '#22C55E', // Great recommendation color
          score: 9,         // Great recommendation score
        }),
      );
    });

    it('should set correct scores for each recommendation', async () => {
      repo.countByUserId.mockResolvedValue(0);
      repo.create.mockResolvedValue(mockDayState);

      const expectedScores: Record<string, number> = {
        great: 9,
        good: 7,
        okay: 5,
        bad: 3,
        terrible: 1,
      };

      for (const [key, expectedScore] of Object.entries(expectedScores)) {
        repo.create.mockClear();
        await service.createFromRecommendation(userId, { key: key as any, name: key });

        expect(repo.create).toHaveBeenCalledWith(
          expect.objectContaining({ score: expectedScore }),
        );
      }
    });

    it('should reject invalid recommendation key', async () => {
      await expect(
        service.createFromRecommendation(userId, {
          key: 'nonexistent' as any,
          name: 'Bad Key',
        }),
      ).rejects.toThrow(RecommendationNotFoundError);
    });
  });

  // ─── UPDATE ────────────────────────────────────────────────

  describe('update', () => {
    it('should reject updating non-existent mood', async () => {
      repo.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        service.update(userId, 'nonexistent', { name: 'Updated' }),
      ).rejects.toThrow(DayStateNotFoundError);
    });

    it('should allow updating score', async () => {
      repo.findByIdAndUserId.mockResolvedValue(mockDayState);
      repo.update.mockResolvedValue({ ...mockDayState, score: 3 });

      await service.update(userId, 'ds-1', { score: 3 });

      expect(repo.update).toHaveBeenCalledWith('ds-1', expect.objectContaining({ score: 3 }));
    });
  });
});
