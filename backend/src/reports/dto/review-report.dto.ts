import { IsNotEmpty, IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReviewAction } from '../../entities/review-comment.entity';

export class ReviewReportDto {
  @ApiProperty({
    enum: ReviewAction,
    description: 'Review action: approve or request changes (needs_correction)',
    example: ReviewAction.NEEDS_CORRECTION,
  })
  @IsNotEmpty()
  @IsEnum(ReviewAction)
  action: ReviewAction;

  @ApiProperty({
    description: 'Mandatory general comment explaining the review decision or needed changes',
    example: 'Please update task completion details and specify time planned vs spent accurately.',
  })
  @IsNotEmpty({ message: 'A general review comment is mandatory' })
  @IsString()
  comment: string;
}
