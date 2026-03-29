import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateSupportRequestDto } from './dto/create-support-request.dto.js';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);
  private readonly botToken: string | undefined;
  private readonly chatId: string | undefined;

  constructor(private readonly config: ConfigService) {
    this.botToken = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    this.chatId = this.config.get<string>('TELEGRAM_SUPPORT_CHAT_ID');
  }

  async sendSupportRequest(
    dto: CreateSupportRequestDto,
    email: string,
  ): Promise<void> {
    const text = [
      `*Support Request*`,
      `*From:* ${this.escapeMarkdown(email)}`,
      `*Platform:* ${this.escapeMarkdown(dto.platform)}`,
      `*Page:* ${this.escapeMarkdown(dto.page)}`,
      `*Subject:* ${this.escapeMarkdown(dto.subject)}`,
      ``,
      this.escapeMarkdown(dto.body),
    ].join('\n');

    if (!this.botToken || !this.chatId) {
      this.logger.warn(
        'Telegram credentials not configured, logging support request instead',
      );
      this.logger.log({
        msg: 'Support request received',
        email,
        subject: dto.subject,
        page: dto.page,
        platform: dto.platform,
      });
      return;
    }

    const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: this.chatId,
        text,
        parse_mode: 'MarkdownV2',
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const responseBody = await response.text();
      this.logger.error(
        `Telegram API error: ${response.status} ${responseBody}`,
      );
      throw new ServiceUnavailableException(
        'Support service is temporarily unavailable',
      );
    }
  }

  private escapeMarkdown(text: string): string {
    return text.replace(/([_*[\]()~`>#+\-=|{}.!\\@])/g, '\\$1');
  }
}
