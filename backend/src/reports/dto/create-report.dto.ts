import {
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsInt,
  IsEnum,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportStatus } from '../../entities/weekly-report.entity';

export class CreateReportDto {
  @ApiProperty({ description: 'Week start date (YYYY-MM-DD)', example: '2026-09-01' })
  @IsNotEmpty()
  @IsDateString()
  week_start_date: string;

  @ApiProperty({ description: 'Week end date (YYYY-MM-DD)', example: '2026-09-07' })
  @IsNotEmpty()
  @IsDateString()
  week_end_date: string;

  @ApiPropertyOptional({ description: 'Project ID', example: 1 })
  @IsOptional()
  @IsInt()
  project_id?: number;

  @ApiPropertyOptional({
    description: 'Array of completed/worked tasks with task name, priority, planned %, actual %, status, time, deliverable',
    example: [
      {
        task_name: 'Implement Auth Module',
        priority: 'high',
        planned_percentage: 100,
        actual_percentage: 100,
        status: 'completed',
        time_planned: 10,
        time_spent: 10,
        output_deliverable: 'Auth endpoints unit tested',
      },
    ],
  })
  @IsOptional()
  tasks_json?: any;

  @ApiPropertyOptional({ description: 'Tasks planned for next week', example: 'Build Report Review module' })
  @IsOptional()
  @IsString()
  next_week_tasks?: string;

  @ApiPropertyOptional({ description: 'Blockers / challenges faced', example: 'Waiting on API specs for third-party integration' })
  @IsOptional()
  @IsString()
  blockers?: string;

  @ApiPropertyOptional({ description: 'Flagged key blocker for the week', example: 'API specs delay' })
  @IsOptional()
  @IsString()
  key_blocker?: string;

  @ApiPropertyOptional({ description: 'Achievements / highlights', example: 'Completed authentication unit tests ahead of schedule' })
  @IsOptional()
  @IsString()
  achievements?: string;

  @ApiPropertyOptional({ description: 'Flagged key achievement for the week', example: 'Auth unit tests complete' })
  @IsOptional()
  @IsString()
  key_achievement?: string;

  @ApiPropertyOptional({ description: 'Hours worked by category/task type', example: { dev: 20, testing: 10, meetings: 5 } })
  @IsOptional()
  hours_by_type_json?: any;

  @ApiPropertyOptional({ description: 'Optional notes or links', example: 'https://github.com/org/repo/pull/1' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ enum: ReportStatus, description: 'Status of the report (draft or submitted)', example: ReportStatus.DRAFT })
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;
}
