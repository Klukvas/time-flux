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

  @ApiProperty({ example: 'uuid-456' })
  userId!: string;

  @ApiProperty({ enum: ['FREE', 'PRO', 'PREMIUM'], example: 'FREE' })
  tier!: string;

  @ApiProperty({
    enum: ['ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED', 'PAUSED'],
    example: 'ACTIVE',
  })
  status!: string;

  @ApiPropertyOptional({
    type: String,
    example: 'cus_01abc123',
    nullable: true,
  })
  paddleCustomerId!: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'sub_01abc123',
    nullable: true,
  })
  paddleSubscriptionId!: string | null;

  @ApiPropertyOptional({
    type: String,
    example: '2026-03-26T00:00:00.000Z',
    nullable: true,
  })
  currentPeriodEnd!: string | null;

  @ApiPropertyOptional({ type: String, example: null, nullable: true })
  canceledAt!: string | null;

  @ApiProperty({ example: '2026-03-01T00:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-03-01T00:00:00.000Z' })
  updatedAt!: string;

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

  @ApiPropertyOptional({
    type: String,
    example: '2026-03-26T00:00:00.000Z',
    nullable: true,
  })
  canceledAt!: string | null;
}
