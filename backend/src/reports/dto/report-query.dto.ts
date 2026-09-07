import { IsOptional, IsEnum, IsInt, IsDateString, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReportStatus } from '../../entities/weekly-report.entity';

export class ReportQueryDto {
  @ApiPropertyOptional({ enum: ReportStatus, description: 'Filter by report status' })
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @ApiPropertyOptional({ description: 'Filter by project ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  project_id?: number;

  @ApiPropertyOptional({ description: 'Filter by user ID (Manager use)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  user_id?: number;

  @ApiPropertyOptional({ description: 'Filter by exact week start date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  week_start_date?: string;

  @ApiPropertyOptional({ description: 'Filter by start date range (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ description: 'Filter by end date range (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ description: 'Search term for team member name, email, or project name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Page number for pagination', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
