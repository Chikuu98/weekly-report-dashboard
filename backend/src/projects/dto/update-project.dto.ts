import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateProjectDto {
  @ApiPropertyOptional({
    example: 'Client A Web Application (Updated)',
    description: 'Name of the project',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    example: 'Updated project scope description',
    description: 'Detailed description of project scope',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: '#10B981',
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
