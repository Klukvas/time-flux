import { Test, TestingModule } from '@nestjs/testing';
import { MediaController } from './media.controller.js';
import { MediaService } from './media.service.js';
import { CreateDayMediaDto } from './dto/create-day-media.dto.js';
import { JwtPayload } from '../common/decorators/current-user.decorator.js';
import { ParseDatePipe } from '../common/pipes/parse-date.pipe.js';

describe('MediaController', () => {
  let controller: MediaController;
  let service: {
    addMedia: jest.Mock;
    getMediaForDay: jest.Mock;
    deleteMedia: jest.Mock;
  };

  const mockUser: JwtPayload = { sub: 'user-1', email: 'test@example.com' };

  beforeEach(async () => {
    service = {
      addMedia: jest.fn(),
      getMediaForDay: jest.fn(),
      deleteMedia: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MediaController],
      providers: [{ provide: MediaService, useValue: service }, ParseDatePipe],
    }).compile();

    controller = module.get<MediaController>(MediaController);
  });

  describe('addMedia', () => {
    it('should delegate to mediaService.addMedia with user.sub, date and dto', async () => {
      const dto: CreateDayMediaDto = {
        s3Key: 'uploads/photo.jpg',
        fileName: 'photo.jpg',
        contentType: 'image/jpeg',
        size: 1024,
      };
      const expected = { id: 'media-1', s3Key: 'uploads/photo.jpg' };
      service.addMedia.mockResolvedValue(expected);

      const result = await controller.addMedia(mockUser, '2024-01-15', dto);

      expect(service.addMedia).toHaveBeenCalledWith(
        'user-1',
        '2024-01-15',
        dto,
      );
      expect(result).toEqual(expected);
    });

    it('should pass through the service result unchanged', async () => {
      const dto = {} as CreateDayMediaDto;
      const serviceResult = { id: 'media-new' };
      service.addMedia.mockResolvedValue(serviceResult);

      const result = await controller.addMedia(mockUser, '2024-01-15', dto);

      expect(result).toBe(serviceResult);
    });

    it('should propagate service errors', async () => {
      const dto = {} as CreateDayMediaDto;
      service.addMedia.mockRejectedValue(new Error('Add media failed'));

      await expect(
        controller.addMedia(mockUser, '2024-01-15', dto),
      ).rejects.toThrow('Add media failed');
    });
  });

  describe('getMediaForDay', () => {
    it('should delegate to mediaService.getMediaForDay with user.sub and date', async () => {
      const expected = [{ id: 'media-1', s3Key: 'uploads/photo.jpg' }];
      service.getMediaForDay.mockResolvedValue(expected);

      const result = await controller.getMediaForDay(mockUser, '2024-01-15');

      expect(service.getMediaForDay).toHaveBeenCalledWith(
        'user-1',
        '2024-01-15',
      );
      expect(result).toEqual(expected);
    });

    it('should return empty array when no media exists for the day', async () => {
      service.getMediaForDay.mockResolvedValue([]);

      const result = await controller.getMediaForDay(mockUser, '2024-01-15');

      expect(result).toEqual([]);
    });

    it('should propagate service errors', async () => {
      service.getMediaForDay.mockRejectedValue(new Error('Fetch failed'));

      await expect(
        controller.getMediaForDay(mockUser, '2024-01-15'),
      ).rejects.toThrow('Fetch failed');
    });
  });

  describe('deleteMedia', () => {
    it('should delegate to mediaService.deleteMedia with user.sub and id', async () => {
      service.deleteMedia.mockResolvedValue(undefined);

      await controller.deleteMedia(mockUser, 'media-1');

      expect(service.deleteMedia).toHaveBeenCalledWith('user-1', 'media-1');
    });

    it('should return void on success', async () => {
      service.deleteMedia.mockResolvedValue(undefined);

      const result = await controller.deleteMedia(mockUser, 'media-1');

      expect(result).toBeUndefined();
    });

    it('should propagate not-found errors', async () => {
      service.deleteMedia.mockRejectedValue(new Error('Media not found'));

      await expect(
        controller.deleteMedia(mockUser, 'missing-id'),
      ).rejects.toThrow('Media not found');
    });
  });
});
