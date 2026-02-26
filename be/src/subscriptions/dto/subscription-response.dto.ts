import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class SubscriptionUsageDto {
  @ApiProperty({ example: 12 })
  media!: number;

  @ApiProperty({ example: 3 })
  chapters!: number;

  @ApiProperty({ example: 4 })
  categories!: number;

  @ApiProperty({ example: 5 })
  dayStates!: number;
}

class SubscriptionLimitsDto {
  @ApiProperty({ example: 50 })
  media!: number;

  @ApiProperty({ example: 5 })
  chapters!: number;

  @ApiProperty({ example: 5 })
  categories!: number;

  @ApiProperty({ example: 5 })
  dayStates!: number;

  @ApiProperty({ example: false })
  analytics!: boolean;

  @ApiProperty({ example: false })
  memories!: boolean;
}

export class SubscriptionResponseDto {
  @ApiProperty({ example: 'uuid-123' })
  id!: string;

  @ApiProperty({ enum: ['FREE', 'PRO', 'PREMIUM'], example: 'FREE' })
  tier!: string;

  @ApiProperty({
    enum: ['ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED', 'PAUSED'],
    example: 'ACTIVE',
  })
  status!: string;

  @ApiPropertyOptional({ example: 'sub_01abc123', nullable: true })
  paddleSubscriptionId!: string | null;

  @ApiPropertyOptional({ example: '2026-03-26T00:00:00.000Z', nullable: true })
  currentPeriodEnd!: string | null;

  @ApiPropertyOptional({ example: null, nullable: true })
  canceledAt!: string | null;

  @ApiProperty({ type: SubscriptionLimitsDto })
  limits!: SubscriptionLimitsDto;

  @ApiProperty({ type: SubscriptionUsageDto })
  usage!: SubscriptionUsageDto;
}

export class CancelResponseDto {
  @ApiProperty({
    example: 'Subscription will be canceled at the end of the billing period',
  })
  message!: string;

  @ApiPropertyOptional({ example: '2026-03-26T00:00:00.000Z', nullable: true })
  canceledAt!: string | null;
}
