import { Test, TestingModule } from '@nestjs/testing';
import { EventPeriodsController } from './event-periods.controller.js';
import { EventGroupsService } from './event-groups.service.js';
import { UpdateEventPeriodDto } from './dto/update-event-period.dto.js';
import { CloseEventPeriodDto } from './dto/close-event-period.dto.js';

describe('EventPeriodsController', () => {
  let controller: EventPeriodsController;
  let service: {
    updatePeriod: jest.Mock;
    deletePeriod: jest.Mock;
    closePeriod: jest.Mock;
  };

  const mockUser = {
    sub: 'user-1',
    email: 'test@example.com',
    timezone: 'UTC',
  };

  beforeEach(async () => {
    service = {
      updatePeriod: jest.fn(),
      deletePeriod: jest.fn(),
      closePeriod: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventPeriodsController],
      providers: [{ provide: EventGroupsService, useValue: service }],
    }).compile();

    controller = module.get<EventPeriodsController>(EventPeriodsController);
  });

  describe('update', () => {
    it('should delegate to service.updatePeriod with user.sub, id and dto', async () => {
      const dto: UpdateEventPeriodDto = {
        comment: 'Updated comment',
      } as UpdateEventPeriodDto;
      const expected = { id: 'period-1', comment: 'Updated comment' };
      service.updatePeriod.mockResolvedValue(expected);

      const result = await controller.update(mockUser, 'period-1', dto);

      expect(service.updatePeriod).toHaveBeenCalledWith(
        'user-1',
        'period-1',
        dto,
        'UTC',
      );
      expect(result).toEqual(expected);
    });

    it('should pass through the service result unchanged', async () => {
      const dto = {} as UpdateEventPeriodDto;
      const serviceResult = { id: 'period-1' };
      service.updatePeriod.mockResolvedValue(serviceResult);

      const result = await controller.update(mockUser, 'period-1', dto);

      expect(result).toBe(serviceResult);
    });

    it('should propagate service errors', async () => {
      const dto = {} as UpdateEventPeriodDto;
      service.updatePeriod.mockRejectedValue(new Error('Update failed'));

      await expect(
        controller.update(mockUser, 'period-1', dto),
      ).rejects.toThrow('Update failed');
    });
  });

  describe('remove', () => {
    it('should delegate to service.deletePeriod with user.sub and id', async () => {
      service.deletePeriod.mockResolvedValue(undefined);

      const result = await controller.remove(mockUser, 'period-1');

      expect(service.deletePeriod).toHaveBeenCalledWith('user-1', 'period-1');
      expect(result).toBeUndefined();
    });

    it('should propagate service errors', async () => {
      service.deletePeriod.mockRejectedValue(new Error('Delete failed'));

      await expect(controller.remove(mockUser, 'period-1')).rejects.toThrow(
        'Delete failed',
      );
    });
  });

  describe('close', () => {
    it('should delegate to service.closePeriod with user.sub, id and dto', async () => {
      const dto: CloseEventPeriodDto = {
        endDate: '2024-06-30',
      } as CloseEventPeriodDto;
      const expected = { id: 'period-1', endDate: '2024-06-30' };
      service.closePeriod.mockResolvedValue(expected);

      const result = await controller.close(mockUser, 'period-1', dto);

      expect(service.closePeriod).toHaveBeenCalledWith(
        'user-1',
        'period-1',
        dto,
        'UTC',
      );
      expect(result).toEqual(expected);
    });

    it('should pass through the service result unchanged', async () => {
      const dto = {} as CloseEventPeriodDto;
      const serviceResult = { id: 'period-1', endDate: '2024-12-31' };
      service.closePeriod.mockResolvedValue(serviceResult);

      const result = await controller.close(mockUser, 'period-1', dto);

      expect(result).toBe(serviceResult);
    });

    it('should propagate service errors', async () => {
      const dto = {} as CloseEventPeriodDto;
      service.closePeriod.mockRejectedValue(new Error('Close failed'));

      await expect(controller.close(mockUser, 'period-1', dto)).rejects.toThrow(
        'Close failed',
      );
    });
  });
});
