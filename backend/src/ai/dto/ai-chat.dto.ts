import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AiChatDto {
  @ApiProperty({
    description: 'Question or query about team reports, blockers, achievements, or activity',
    example: 'What are the main blockers this week?',
  })
  @IsString()
  @IsNotEmpty()
  query: string;
}
