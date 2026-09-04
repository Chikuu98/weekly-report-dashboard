import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({
    example: 'Client A Web Application',
    description: 'Name of the project or category tag',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    example: 'Full-stack web application development for Client A',
    description: 'Detailed description of project scope and goals',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: '#3B82F6',
    description: 'Hex color code used in dashboard UI tags',
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'color_code must be a valid hex color code (e.g. #3B82F6)',
  })
  color_code?: string;
}
