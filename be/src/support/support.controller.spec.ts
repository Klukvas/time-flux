import { Test, type TestingModule } from '@nestjs/testing';
import { SupportController } from './support.controller.js';
import { SupportService } from './support.service.js';
import type { CreateSupportRequestDto } from './dto/create-support-request.dto.js';
import type { JwtPayload } from '../common/decorators/current-user.decorator.js';

// ── Fixtures ──────────────────────────────────────────────────

const mockUser: JwtPayload = {
  sub: 'user-1',
  email: 'test@example.com',
  timezone: 'Europe/Kyiv',
};

const makeDto = (
  overrides: Partial<CreateSupportRequestDto> = {},
): CreateSupportRequestDto => ({
  subject: 'Bug report',
  body: 'Something is broken',
  page: '/timeline',
  platform: 'web',
  ...overrides,
});

// ── Tests ─────────────────────────────────────────────────────

describe('SupportController', () => {
  let controller: SupportController;
  let supportService: jest.Mocked<SupportService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SupportController],
      providers: [
        {
          provide: SupportService,
          useValue: {
            sendSupportRequest: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    controller = module.get<SupportController>(SupportController);
    supportService = module.get(SupportService);
  });

  it('delegates to SupportService with dto and user email', async () => {
    const dto = makeDto();
    await controller.create(mockUser, dto);

    expect(supportService.sendSupportRequest).toHaveBeenCalledTimes(1);
    expect(supportService.sendSupportRequest).toHaveBeenCalledWith(
      dto,
      mockUser.email,
    );
  });

  it('returns void (204 No Content)', async () => {
    const result = await controller.create(mockUser, makeDto());
    expect(result).toBeUndefined();
  });

  it('propagates service errors', async () => {
    supportService.sendSupportRequest.mockRejectedValueOnce(
      new Error('Telegram down'),
    );

    await expect(controller.create(mockUser, makeDto())).rejects.toThrow(
      'Telegram down',
    );
  });
});
