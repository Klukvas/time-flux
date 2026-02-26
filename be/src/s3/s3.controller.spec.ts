import { Test, TestingModule } from '@nestjs/testing';
import { S3Controller } from './s3.controller.js';
import { S3Service } from './s3.service.js';
import { PresignedUrlRequestDto } from './dto/presigned-url.dto.js';
import { JwtPayload } from '../common/decorators/current-user.decorator.js';

describe('S3Controller', () => {
  let controller: S3Controller;
  let service: {
    generatePresignedUploadUrl: jest.Mock;
  };

  const mockUser: JwtPayload = { sub: 'user-1', email: 'test@example.com' };

  beforeEach(async () => {
    service = {
      generatePresignedUploadUrl: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [S3Controller],
      providers: [{ provide: S3Service, useValue: service }],
    }).compile();

    controller = module.get<S3Controller>(S3Controller);
  });

  describe('getPresignedUrl', () => {
    it('should delegate to s3Service.generatePresignedUploadUrl with user.sub, dto.contentType and dto.size', async () => {
      const dto: PresignedUrlRequestDto = { contentType: 'image/jpeg', size: 1024 } as PresignedUrlRequestDto;
      const expected = { uploadUrl: 'https://s3.example.com/upload', key: 'uploads/uuid.jpg' };
      service.generatePresignedUploadUrl.mockResolvedValue(expected);

      const result = await controller.getPresignedUrl(mockUser, dto);

      expect(service.generatePresignedUploadUrl).toHaveBeenCalledWith('user-1', 'image/jpeg', 1024);
      expect(result).toEqual(expected);
    });

    it('should extract contentType and size from dto, not pass dto directly', async () => {
      const dto: PresignedUrlRequestDto = { contentType: 'video/mp4', size: 5000000 } as PresignedUrlRequestDto;
      service.generatePresignedUploadUrl.mockResolvedValue({});

      await controller.getPresignedUrl(mockUser, dto);

      expect(service.generatePresignedUploadUrl).toHaveBeenCalledWith('user-1', 'video/mp4', 5000000);
      expect(service.generatePresignedUploadUrl).not.toHaveBeenCalledWith('user-1', dto);
    });

    it('should pass through the service result unchanged', async () => {
      const dto = { contentType: 'image/png', size: 2048 } as PresignedUrlRequestDto;
      const serviceResult = { uploadUrl: 'https://s3.example.com/presigned', key: 'uploads/file.png' };
      service.generatePresignedUploadUrl.mockResolvedValue(serviceResult);

      const result = await controller.getPresignedUrl(mockUser, dto);

      expect(result).toBe(serviceResult);
    });

    it('should propagate service errors', async () => {
      const dto = { contentType: 'image/jpeg', size: 1024 } as PresignedUrlRequestDto;
      service.generatePresignedUploadUrl.mockRejectedValue(new Error('S3 unavailable'));

      await expect(controller.getPresignedUrl(mockUser, dto)).rejects.toThrow('S3 unavailable');
    });

    it('should handle large file sizes', async () => {
      const dto = { contentType: 'video/mp4', size: 104857600 } as PresignedUrlRequestDto;
      const expected = { uploadUrl: 'https://s3.example.com/large', key: 'uploads/large.mp4' };
      service.generatePresignedUploadUrl.mockResolvedValue(expected);

      const result = await controller.getPresignedUrl(mockUser, dto);

      expect(service.generatePresignedUploadUrl).toHaveBeenCalledWith('user-1', 'video/mp4', 104857600);
      expect(result).toEqual(expected);
    });
  });
});
