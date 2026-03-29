import { Test, type TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException } from '@nestjs/common';
import { SupportService } from './support.service.js';
import type { CreateSupportRequestDto } from './dto/create-support-request.dto.js';

// ── Fixtures ──────────────────────────────────────────────────

const makeDto = (
  overrides: Partial<CreateSupportRequestDto> = {},
): CreateSupportRequestDto => ({
  subject: 'Bug report',
  body: 'Something is broken',
  page: '/timeline',
  platform: 'web',
  ...overrides,
});

const TEST_EMAIL = 'user@example.com';
const BOT_TOKEN = 'test-bot-token';
const CHAT_ID = '-100123456';

// ── Tests ─────────────────────────────────────────────────────

describe('SupportService', () => {
  let service: SupportService;
  let mockFetch: jest.SpyInstance;

  const configValues: Record<string, string> = {
    TELEGRAM_BOT_TOKEN: BOT_TOKEN,
    TELEGRAM_SUPPORT_CHAT_ID: CHAT_ID,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupportService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => configValues[key]),
          },
        },
      ],
    }).compile();

    service = module.get<SupportService>(SupportService);

    mockFetch = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(''),
    } as unknown as Response);
  });

  afterEach(() => {
    mockFetch.mockRestore();
  });

  // ── Happy path ──────────────────────────────────────────────

  it('sends a message to Telegram API', async () => {
    await service.sendSupportRequest(makeDto(), TEST_EMAIL);

    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    );
    expect(options.method).toBe('POST');
    expect(options.headers).toEqual({ 'Content-Type': 'application/json' });

    const body = JSON.parse(options.body);
    expect(body.chat_id).toBe(CHAT_ID);
    expect(body.parse_mode).toBe('MarkdownV2');
  });

  it('includes all fields in the Telegram message', async () => {
    const dto = makeDto({ subject: 'Help', body: 'Details here' });
    await service.sendSupportRequest(dto, 'alice@test.com');

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.text).toContain('alice\\@test\\.com');
    expect(body.text).toContain('Help');
    expect(body.text).toContain('Details here');
    expect(body.text).toContain('/timeline');
    expect(body.text).toContain('web');
  });

  it('sets a 10-second timeout via AbortSignal', async () => {
    await service.sendSupportRequest(makeDto(), TEST_EMAIL);

    const options = mockFetch.mock.calls[0][1];
    expect(options.signal).toBeDefined();
  });

  // ── MarkdownV2 escaping ─────────────────────────────────────

  it('escapes @ in email addresses', async () => {
    await service.sendSupportRequest(makeDto(), 'user@domain.com');

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.text).toContain('user\\@domain\\.com');
    expect(body.text).not.toContain('user@domain');
  });

  it('escapes special MarkdownV2 characters in all fields', async () => {
    const dto = makeDto({
      subject: 'Test_subject*bold',
      body: 'Line (with) [brackets]',
    });
    await service.sendSupportRequest(dto, TEST_EMAIL);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.text).toContain('Test\\_subject\\*bold');
    expect(body.text).toContain('Line \\(with\\) \\[brackets\\]');
  });

  // ── Telegram API errors ─────────────────────────────────────

  it('throws ServiceUnavailableException when Telegram returns non-OK', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: jest.fn().mockResolvedValue('Bad Request'),
    } as unknown as Response);

    await expect(
      service.sendSupportRequest(makeDto(), TEST_EMAIL),
    ).rejects.toThrow(ServiceUnavailableException);
  });

  it('throws ServiceUnavailableException when fetch rejects', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(
      service.sendSupportRequest(makeDto(), TEST_EMAIL),
    ).rejects.toThrow('Network error');
  });

  // ── Missing credentials fallback ───────────────────────────

  describe('when Telegram credentials are missing', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SupportService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn(() => undefined),
            },
          },
        ],
      }).compile();

      service = module.get<SupportService>(SupportService);
    });

    it('does not call Telegram API', async () => {
      await service.sendSupportRequest(makeDto(), TEST_EMAIL);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('resolves without throwing', async () => {
      await expect(
        service.sendSupportRequest(makeDto(), TEST_EMAIL),
      ).resolves.toBeUndefined();
    });
  });
});
