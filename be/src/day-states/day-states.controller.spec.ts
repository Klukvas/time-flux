import { Test, TestingModule } from '@nestjs/testing';
import { DayStatesController } from './day-states.controller.js';
import { DayStatesService } from './day-states.service.js';
import { CreateDayStateDto } from './dto/create-day-state.dto.js';
import { UpdateDayStateDto } from './dto/update-day-state.dto.js';
import { CreateDayStateFromRecommendationDto } from './dto/create-from-recommendation.dto.js';
import { JwtPayload } from '../common/decorators/current-user.decorator.js';

describe('DayStatesController', () => {
  let controller: DayStatesController;
  let service: {
    findAll: jest.Mock;
    create: jest.Mock;
    createFromRecommendation: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  const mockUser: JwtPayload = {
    sub: 'user-1',
    email: 'test@example.com',
    timezone: 'UTC',
  };

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      create: jest.fn(),
      createFromRecommendation: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DayStatesController],
      providers: [{ provide: DayStatesService, useValue: service }],
    }).compile();

    controller = module.get<DayStatesController>(DayStatesController);
  });

  describe('findAll', () => {
    it('should delegate to dayStatesService.findAll with user.sub', async () => {
      const expected = [{ id: 'state-1', label: 'Great' }];
      service.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(mockUser);

      expect(service.findAll).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(expected);
    });

    it('should return empty array when no states exist', async () => {
      service.findAll.mockResolvedValue([]);

      const result = await controller.findAll(mockUser);

      expect(result).toEqual([]);
    });

    it('should propagate service errors', async () => {
      service.findAll.mockRejectedValue(new Error('Fetch failed'));

      await expect(controller.findAll(mockUser)).rejects.toThrow(
        'Fetch failed',
      );
    });
  });

  describe('create', () => {
    it('should delegate to dayStatesService.create with user.sub and dto', async () => {
      const dto: CreateDayStateDto = {
        name: 'Amazing',
        color: '#FF0000',
        score: 10,
      };
      const expected = { id: 'state-1', label: 'Amazing', score: 10 };
      service.create.mockResolvedValue(expected);

      const result = await controller.create(mockUser, dto);

      expect(service.create).toHaveBeenCalledWith('user-1', dto);
      expect(result).toEqual(expected);
    });

    it('should pass through the service result unchanged', async () => {
      const dto = {} as CreateDayStateDto;
      const serviceResult = { id: 'state-new' };
      service.create.mockResolvedValue(serviceResult);

      const result = await controller.create(mockUser, dto);

      expect(result).toBe(serviceResult);
    });

    it('should propagate service errors', async () => {
      const dto = {} as CreateDayStateDto;
      service.create.mockRejectedValue(new Error('Creation failed'));

      await expect(controller.create(mockUser, dto)).rejects.toThrow(
        'Creation failed',
      );
    });
  });

  describe('createFromRecommendation', () => {
    it('should delegate to dayStatesService.createFromRecommendation with user.sub and dto', async () => {
      const dto: CreateDayStateFromRecommendationDto = {
        key: 'great',
      } as CreateDayStateFromRecommendationDto;
      const expected = { id: 'state-1', label: 'Great', score: 9 };
      service.createFromRecommendation.mockResolvedValue(expected);

      const result = await controller.createFromRecommendation(mockUser, dto);

      expect(service.createFromRecommendation).toHaveBeenCalledWith(
        'user-1',
        dto,
      );
      expect(result).toEqual(expected);
    });

    it('should propagate service errors for unknown recommendation key', async () => {
      const dto = { key: 'unknown' } as CreateDayStateFromRecommendationDto;
      service.createFromRecommendation.mockRejectedValue(
        new Error('Unknown recommendation key'),
      );

      await expect(
        controller.createFromRecommendation(mockUser, dto),
      ).rejects.toThrow('Unknown recommendation key');
    });
  });

  describe('update', () => {
    it('should delegate to dayStatesService.update with user.sub, id and dto', async () => {
      const dto: UpdateDayStateDto = {
        label: 'Updated Label',
      } as UpdateDayStateDto;
      const expected = { id: 'state-1', label: 'Updated Label' };
      service.update.mockResolvedValue(expected);

      const result = await controller.update(mockUser, 'state-1', dto);

      expect(service.update).toHaveBeenCalledWith('user-1', 'state-1', dto);
      expect(result).toEqual(expected);
    });

    it('should propagate not-found errors', async () => {
      const dto = {} as UpdateDayStateDto;
      service.update.mockRejectedValue(new Error('Day state not found'));

      await expect(
        controller.update(mockUser, 'missing-id', dto),
      ).rejects.toThrow('Day state not found');
    });
  });

  describe('delete', () => {
    it('should delegate to dayStatesService.delete with user.sub and id', async () => {
      service.delete.mockResolvedValue(undefined);

      await controller.delete(mockUser, 'state-1');

      expect(service.delete).toHaveBeenCalledWith('user-1', 'state-1');
    });

    it('should return void on success', async () => {
      service.delete.mockResolvedValue(undefined);

      const result = await controller.delete(mockUser, 'state-1');

      expect(result).toBeUndefined();
    });

    it('should propagate not-found errors', async () => {
      service.delete.mockRejectedValue(new Error('Day state not found'));

      await expect(controller.delete(mockUser, 'missing-id')).rejects.toThrow(
        'Day state not found',
      );
    });
  });
});
