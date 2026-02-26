import { Test, TestingModule } from '@nestjs/testing';
import { DaysController } from './days.controller.js';
import { DaysService } from './days.service.js';
import { UpsertDayDto } from './dto/upsert-day.dto.js';
import { UpdateDayLocationDto } from './dto/update-day-location.dto.js';
import { DayQueryDto } from './dto/day-query.dto.js';
import { JwtPayload } from '../common/decorators/current-user.decorator.js';
import { ParseDatePipe } from '../common/pipes/parse-date.pipe.js';

describe('DaysController', () => {
  let controller: DaysController;
  let service: {
    upsert: jest.Mock;
    updateLocation: jest.Mock;
    findAll: jest.Mock;
  };

  const mockUser: JwtPayload = { sub: 'user-1', email: 'test@example.com' };

  beforeEach(async () => {
    service = {
      upsert: jest.fn(),
      updateLocation: jest.fn(),
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DaysController],
      providers: [{ provide: DaysService, useValue: service }, ParseDatePipe],
    }).compile();

    controller = module.get<DaysController>(DaysController);
  });

  describe('upsert', () => {
    it('should delegate to daysService.upsert with user.sub, date and dto', async () => {
      const dto: UpsertDayDto = { dayStateId: 'state-1' } as UpsertDayDto;
      const expected = { id: 'day-1', date: '2024-01-15' };
      service.upsert.mockResolvedValue(expected);

      const result = await controller.upsert(mockUser, '2024-01-15', dto);

      expect(service.upsert).toHaveBeenCalledWith('user-1', '2024-01-15', dto);
      expect(result).toEqual(expected);
    });

    it('should pass through the service result unchanged', async () => {
      const dto = {} as UpsertDayDto;
      const serviceResult = { id: 'day-1' };
      service.upsert.mockResolvedValue(serviceResult);

      const result = await controller.upsert(mockUser, '2024-01-15', dto);

      expect(result).toBe(serviceResult);
    });

    it('should propagate service errors', async () => {
      const dto = {} as UpsertDayDto;
      service.upsert.mockRejectedValue(new Error('Upsert failed'));

      await expect(
        controller.upsert(mockUser, '2024-01-15', dto),
      ).rejects.toThrow('Upsert failed');
    });
  });

  describe('updateLocation', () => {
    it('should delegate to daysService.updateLocation with user.sub, date and dto', async () => {
      const dto: UpdateDayLocationDto = {
        latitude: 48.8566,
        longitude: 2.3522,
        locationName: 'Paris',
      } as UpdateDayLocationDto;
      const expected = { id: 'day-1', locationName: 'Paris' };
      service.updateLocation.mockResolvedValue(expected);

      const result = await controller.updateLocation(
        mockUser,
        '2024-01-15',
        dto,
      );

      expect(service.updateLocation).toHaveBeenCalledWith(
        'user-1',
        '2024-01-15',
        dto,
      );
      expect(result).toEqual(expected);
    });

    it('should handle location clear (null values)', async () => {
      const dto: UpdateDayLocationDto = {
        latitude: null,
        longitude: null,
        locationName: null,
      } as unknown as UpdateDayLocationDto;
      const expected = { id: 'day-1', locationName: null };
      service.updateLocation.mockResolvedValue(expected);

      const result = await controller.updateLocation(
        mockUser,
        '2024-01-15',
        dto,
      );

      expect(service.updateLocation).toHaveBeenCalledWith(
        'user-1',
        '2024-01-15',
        dto,
      );
      expect(result).toEqual(expected);
    });

    it('should propagate service errors', async () => {
      const dto = {} as UpdateDayLocationDto;
      service.updateLocation.mockRejectedValue(
        new Error('Location update failed'),
      );

      await expect(
        controller.updateLocation(mockUser, '2024-01-15', dto),
      ).rejects.toThrow('Location update failed');
    });
  });

  describe('findAll', () => {
    it('should delegate to daysService.findAll with user.sub and query', async () => {
      const query: DayQueryDto = { from: '2024-01-01', to: '2024-01-31' };
      const expected = [{ id: 'day-1', date: '2024-01-15' }];
      service.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(mockUser, query);

      expect(service.findAll).toHaveBeenCalledWith('user-1', query);
      expect(result).toEqual(expected);
    });

    it('should return empty array when no days exist', async () => {
      const query = {} as DayQueryDto;
      service.findAll.mockResolvedValue([]);

      const result = await controller.findAll(mockUser, query);

      expect(result).toEqual([]);
    });

    it('should propagate service errors', async () => {
      const query = {} as DayQueryDto;
      service.findAll.mockRejectedValue(new Error('Fetch failed'));

      await expect(controller.findAll(mockUser, query)).rejects.toThrow(
        'Fetch failed',
      );
    });
  });
});
