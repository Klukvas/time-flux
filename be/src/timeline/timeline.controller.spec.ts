import { Test, TestingModule } from '@nestjs/testing';
import { TimelineController } from './timeline.controller.js';
import { TimelineService } from './timeline.service.js';
import { TimelineQueryDto, WeekQueryDto } from './dto/timeline-query.dto.js';
import { JwtPayload } from '../common/decorators/current-user.decorator.js';

describe('TimelineController', () => {
  let controller: TimelineController;
  let service: {
    getTimeline: jest.Mock;
    getWeekTimeline: jest.Mock;
  };

  const mockUser: JwtPayload = {
    sub: 'user-1',
    email: 'test@example.com',
    timezone: 'UTC',
  };

  beforeEach(async () => {
    service = {
      getTimeline: jest.fn(),
      getWeekTimeline: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TimelineController],
      providers: [{ provide: TimelineService, useValue: service }],
    }).compile();

    controller = module.get<TimelineController>(TimelineController);
  });

  describe('getTimeline', () => {
    it('should delegate to timelineService.getTimeline with user.sub and query', async () => {
      const query: TimelineQueryDto = { from: '2024-01-01', to: '2024-01-31' };
      const expected = { days: [], periods: [] };
      service.getTimeline.mockResolvedValue(expected);

      const result = await controller.getTimeline(mockUser, query);

      expect(service.getTimeline).toHaveBeenCalledWith('user-1', query, 'UTC');
      expect(result).toEqual(expected);
    });

    it('should pass through the service result unchanged', async () => {
      const query = {} as TimelineQueryDto;
      const serviceResult = { days: [{ id: 'd1' }], periods: [{ id: 'p1' }] };
      service.getTimeline.mockResolvedValue(serviceResult);

      const result = await controller.getTimeline(mockUser, query);

      expect(result).toBe(serviceResult);
    });

    it('should propagate service errors', async () => {
      const query = {} as TimelineQueryDto;
      service.getTimeline.mockRejectedValue(new Error('Service error'));

      await expect(controller.getTimeline(mockUser, query)).rejects.toThrow(
        'Service error',
      );
    });
  });

  describe('getWeekTimeline', () => {
    it('should delegate to timelineService.getWeekTimeline with user.sub and query', async () => {
      const query: WeekQueryDto = { date: '2024-01-01' };
      const expected = { week: [] };
      service.getWeekTimeline.mockResolvedValue(expected);

      const result = await controller.getWeekTimeline(mockUser, query);

      expect(service.getWeekTimeline).toHaveBeenCalledWith(
        'user-1',
        query,
        'UTC',
      );
      expect(result).toEqual(expected);
    });

    it('should pass through the service result unchanged', async () => {
      const query = {} as WeekQueryDto;
      const serviceResult = { week: [{ date: '2024-01-01' }] };
      service.getWeekTimeline.mockResolvedValue(serviceResult);

      const result = await controller.getWeekTimeline(mockUser, query);

      expect(result).toBe(serviceResult);
    });

    it('should propagate service errors', async () => {
      const query = {} as WeekQueryDto;
      service.getWeekTimeline.mockRejectedValue(
        new Error('Week service error'),
      );

      await expect(controller.getWeekTimeline(mockUser, query)).rejects.toThrow(
        'Week service error',
      );
    });
  });
});
