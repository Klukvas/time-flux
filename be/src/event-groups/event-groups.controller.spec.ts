import { Test, TestingModule } from '@nestjs/testing';
import { EventGroupsController } from './event-groups.controller.js';
import { EventGroupsService } from './event-groups.service.js';
import { CreateEventGroupDto } from './dto/create-event-group.dto.js';
import { UpdateEventGroupDto } from './dto/update-event-group.dto.js';
import { CreateEventPeriodDto } from './dto/create-event-period.dto.js';

describe('EventGroupsController', () => {
  let controller: EventGroupsController;
  let service: {
    createGroup: jest.Mock;
    findAllGroups: jest.Mock;
    findGroupById: jest.Mock;
    updateGroup: jest.Mock;
    deleteGroup: jest.Mock;
    createPeriod: jest.Mock;
    getGroupDetails: jest.Mock;
  };

  const mockUser = { sub: 'user-1' };

  beforeEach(async () => {
    service = {
      createGroup: jest.fn(),
      findAllGroups: jest.fn(),
      findGroupById: jest.fn(),
      updateGroup: jest.fn(),
      deleteGroup: jest.fn(),
      createPeriod: jest.fn(),
      getGroupDetails: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventGroupsController],
      providers: [{ provide: EventGroupsService, useValue: service }],
    }).compile();

    controller = module.get<EventGroupsController>(EventGroupsController);
  });

  describe('create', () => {
    it('should delegate to service.createGroup with user.sub and dto', async () => {
      const dto: CreateEventGroupDto = {
        title: 'New Group',
        categoryId: 'cat-1',
      } as CreateEventGroupDto;
      const expected = { id: 'group-1', title: 'New Group' };
      service.createGroup.mockResolvedValue(expected);

      const result = await controller.create(mockUser, dto);

      expect(service.createGroup).toHaveBeenCalledWith('user-1', dto);
      expect(result).toEqual(expected);
    });

    it('should propagate service errors', async () => {
      const dto = {} as CreateEventGroupDto;
      service.createGroup.mockRejectedValue(new Error('Creation failed'));

      await expect(controller.create(mockUser, dto)).rejects.toThrow(
        'Creation failed',
      );
    });
  });

  describe('findAll', () => {
    it('should delegate to service.findAllGroups with user.sub', async () => {
      const expected = [{ id: 'group-1' }];
      service.findAllGroups.mockResolvedValue(expected);

      const result = await controller.findAll(mockUser);

      expect(service.findAllGroups).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(expected);
    });

    it('should return empty array when no groups exist', async () => {
      service.findAllGroups.mockResolvedValue([]);

      const result = await controller.findAll(mockUser);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should delegate to service.findGroupById with user.sub and id', async () => {
      const expected = { id: 'group-1', title: 'My Group' };
      service.findGroupById.mockResolvedValue(expected);

      const result = await controller.findOne(mockUser, 'group-1');

      expect(service.findGroupById).toHaveBeenCalledWith('user-1', 'group-1');
      expect(result).toEqual(expected);
    });

    it('should propagate not-found errors', async () => {
      service.findGroupById.mockRejectedValue(new Error('Not found'));

      await expect(controller.findOne(mockUser, 'missing-id')).rejects.toThrow(
        'Not found',
      );
    });
  });

  describe('update', () => {
    it('should delegate to service.updateGroup with user.sub, id and dto', async () => {
      const dto: UpdateEventGroupDto = {
        title: 'Updated',
      } as UpdateEventGroupDto;
      const expected = { id: 'group-1', title: 'Updated' };
      service.updateGroup.mockResolvedValue(expected);

      const result = await controller.update(mockUser, 'group-1', dto);

      expect(service.updateGroup).toHaveBeenCalledWith(
        'user-1',
        'group-1',
        dto,
      );
      expect(result).toEqual(expected);
    });

    it('should propagate service errors', async () => {
      const dto = {} as UpdateEventGroupDto;
      service.updateGroup.mockRejectedValue(new Error('Update failed'));

      await expect(controller.update(mockUser, 'group-1', dto)).rejects.toThrow(
        'Update failed',
      );
    });
  });

  describe('remove', () => {
    it('should delegate to service.deleteGroup with user.sub and id', async () => {
      service.deleteGroup.mockResolvedValue(undefined);

      const result = await controller.remove(mockUser, 'group-1');

      expect(service.deleteGroup).toHaveBeenCalledWith('user-1', 'group-1');
      expect(result).toBeUndefined();
    });

    it('should propagate service errors', async () => {
      service.deleteGroup.mockRejectedValue(new Error('Delete failed'));

      await expect(controller.remove(mockUser, 'group-1')).rejects.toThrow(
        'Delete failed',
      );
    });
  });

  describe('createPeriod', () => {
    it('should delegate to service.createPeriod with user.sub, id and dto', async () => {
      const dto: CreateEventPeriodDto = {
        startDate: '2024-01-01',
      } as CreateEventPeriodDto;
      const expected = { id: 'period-1', startDate: '2024-01-01' };
      service.createPeriod.mockResolvedValue(expected);

      const result = await controller.createPeriod(mockUser, 'group-1', dto);

      expect(service.createPeriod).toHaveBeenCalledWith(
        'user-1',
        'group-1',
        dto,
      );
      expect(result).toEqual(expected);
    });

    it('should propagate service errors', async () => {
      const dto = {} as CreateEventPeriodDto;
      service.createPeriod.mockRejectedValue(
        new Error('Period creation failed'),
      );

      await expect(
        controller.createPeriod(mockUser, 'group-1', dto),
      ).rejects.toThrow('Period creation failed');
    });
  });

  describe('getDetails', () => {
    it('should delegate to service.getGroupDetails with user.sub and id', async () => {
      const expected = { id: 'group-1', title: 'My Group', analytics: {} };
      service.getGroupDetails.mockResolvedValue(expected);

      const result = await controller.getDetails(mockUser, 'group-1');

      expect(service.getGroupDetails).toHaveBeenCalledWith('user-1', 'group-1');
      expect(result).toEqual(expected);
    });

    it('should propagate service errors', async () => {
      service.getGroupDetails.mockRejectedValue(
        new Error('Details fetch failed'),
      );

      await expect(controller.getDetails(mockUser, 'group-1')).rejects.toThrow(
        'Details fetch failed',
      );
    });
  });
});
