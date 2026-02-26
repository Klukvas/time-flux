import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller.js';
import { CategoriesService } from './categories.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { CreateFromRecommendationDto } from './dto/create-from-recommendation.dto.js';
import { JwtPayload } from '../common/decorators/current-user.decorator.js';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let service: {
    findAll: jest.Mock;
    create: jest.Mock;
    createFromRecommendation: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  const mockUser: JwtPayload = { sub: 'user-1', email: 'test@example.com' };

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      create: jest.fn(),
      createFromRecommendation: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [{ provide: CategoriesService, useValue: service }],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
  });

  describe('findAll', () => {
    it('should delegate to categoriesService.findAll with user.sub', async () => {
      const expected = [{ id: 'cat-1', name: 'Work' }];
      service.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(mockUser);

      expect(service.findAll).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(expected);
    });

    it('should return empty array when no categories exist', async () => {
      service.findAll.mockResolvedValue([]);

      const result = await controller.findAll(mockUser);

      expect(result).toEqual([]);
    });

    it('should propagate service errors', async () => {
      service.findAll.mockRejectedValue(new Error('Fetch failed'));

      await expect(controller.findAll(mockUser)).rejects.toThrow('Fetch failed');
    });
  });

  describe('create', () => {
    it('should delegate to categoriesService.create with user.sub and dto', async () => {
      const dto: CreateCategoryDto = { name: 'Health', color: '#10B981' } as CreateCategoryDto;
      const expected = { id: 'cat-1', name: 'Health', color: '#10B981' };
      service.create.mockResolvedValue(expected);

      const result = await controller.create(mockUser, dto);

      expect(service.create).toHaveBeenCalledWith('user-1', dto);
      expect(result).toEqual(expected);
    });

    it('should pass through the service result unchanged', async () => {
      const dto = {} as CreateCategoryDto;
      const serviceResult = { id: 'cat-new' };
      service.create.mockResolvedValue(serviceResult);

      const result = await controller.create(mockUser, dto);

      expect(result).toBe(serviceResult);
    });

    it('should propagate service errors', async () => {
      const dto = {} as CreateCategoryDto;
      service.create.mockRejectedValue(new Error('Creation failed'));

      await expect(controller.create(mockUser, dto)).rejects.toThrow('Creation failed');
    });
  });

  describe('createFromRecommendation', () => {
    it('should delegate to categoriesService.createFromRecommendation with user.sub and dto', async () => {
      const dto: CreateFromRecommendationDto = { key: 'work' } as CreateFromRecommendationDto;
      const expected = { id: 'cat-1', name: 'Work', color: '#3B82F6' };
      service.createFromRecommendation.mockResolvedValue(expected);

      const result = await controller.createFromRecommendation(mockUser, dto);

      expect(service.createFromRecommendation).toHaveBeenCalledWith('user-1', dto);
      expect(result).toEqual(expected);
    });

    it('should propagate service errors for unknown recommendation key', async () => {
      const dto = { key: 'unknown' } as CreateFromRecommendationDto;
      service.createFromRecommendation.mockRejectedValue(new Error('Unknown recommendation key'));

      await expect(controller.createFromRecommendation(mockUser, dto)).rejects.toThrow('Unknown recommendation key');
    });
  });

  describe('update', () => {
    it('should delegate to categoriesService.update with user.sub, id and dto', async () => {
      const dto: UpdateCategoryDto = { name: 'Updated Work' } as UpdateCategoryDto;
      const expected = { id: 'cat-1', name: 'Updated Work' };
      service.update.mockResolvedValue(expected);

      const result = await controller.update(mockUser, 'cat-1', dto);

      expect(service.update).toHaveBeenCalledWith('user-1', 'cat-1', dto);
      expect(result).toEqual(expected);
    });

    it('should propagate not-found errors', async () => {
      const dto = {} as UpdateCategoryDto;
      service.update.mockRejectedValue(new Error('Category not found'));

      await expect(controller.update(mockUser, 'missing-id', dto)).rejects.toThrow('Category not found');
    });
  });

  describe('delete', () => {
    it('should delegate to categoriesService.delete with user.sub and id', async () => {
      service.delete.mockResolvedValue(undefined);

      await controller.delete(mockUser, 'cat-1');

      expect(service.delete).toHaveBeenCalledWith('user-1', 'cat-1');
    });

    it('should return void on success', async () => {
      service.delete.mockResolvedValue(undefined);

      const result = await controller.delete(mockUser, 'cat-1');

      expect(result).toBeUndefined();
    });

    it('should propagate not-found errors', async () => {
      service.delete.mockRejectedValue(new Error('Category not found'));

      await expect(controller.delete(mockUser, 'missing-id')).rejects.toThrow('Category not found');
    });
  });
});
