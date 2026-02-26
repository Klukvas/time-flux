import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationsController } from './recommendations.controller.js';
import {
  CATEGORY_RECOMMENDATIONS,
  MOOD_RECOMMENDATIONS,
} from '../common/constants/recommendations.js';

describe('RecommendationsController', () => {
  let controller: RecommendationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecommendationsController],
    }).compile();

    controller = module.get<RecommendationsController>(RecommendationsController);
  });

  describe('getRecommendations', () => {
    it('should return categories and moods', () => {
      const result = controller.getRecommendations();

      expect(result).toHaveProperty('categories');
      expect(result).toHaveProperty('moods');
    });

    it('should return categories mapped to key and color only', () => {
      const result = controller.getRecommendations();

      expect(result.categories).toEqual(
        CATEGORY_RECOMMENDATIONS.map(({ key, color }) => ({ key, color })),
      );
    });

    it('should return moods mapped to key and color only (no score field)', () => {
      const result = controller.getRecommendations();

      expect(result.moods).toEqual(
        MOOD_RECOMMENDATIONS.map(({ key, color }) => ({ key, color })),
      );

      result.moods.forEach((mood) => {
        expect(mood).not.toHaveProperty('score');
      });
    });

    it('should return all 8 category recommendations', () => {
      const result = controller.getRecommendations();

      expect(result.categories).toHaveLength(8);
    });

    it('should return all 5 mood recommendations', () => {
      const result = controller.getRecommendations();

      expect(result.moods).toHaveLength(5);
    });

    it('should include expected category keys', () => {
      const result = controller.getRecommendations();
      const keys = result.categories.map((c) => c.key);

      expect(keys).toContain('work');
      expect(keys).toContain('health');
      expect(keys).toContain('travel');
    });

    it('should include expected mood keys', () => {
      const result = controller.getRecommendations();
      const keys = result.moods.map((m) => m.key);

      expect(keys).toContain('great');
      expect(keys).toContain('okay');
      expect(keys).toContain('terrible');
    });

    it('should include color for each category', () => {
      const result = controller.getRecommendations();

      result.categories.forEach((cat) => {
        expect(cat).toHaveProperty('key');
        expect(cat).toHaveProperty('color');
        expect(typeof cat.color).toBe('string');
        expect(cat.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });

    it('should include color for each mood', () => {
      const result = controller.getRecommendations();

      result.moods.forEach((mood) => {
        expect(mood).toHaveProperty('key');
        expect(mood).toHaveProperty('color');
        expect(typeof mood.color).toBe('string');
        expect(mood.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });

    it('should return consistent results across multiple calls', () => {
      const first = controller.getRecommendations();
      const second = controller.getRecommendations();

      expect(first).toEqual(second);
    });
  });
});
