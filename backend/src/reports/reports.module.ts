import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { WeeklyReport } from '../entities/weekly-report.entity';
import { ReportVersion } from '../entities/report-version.entity';
import { ReviewComment } from '../entities/review-comment.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WeeklyReport, ReportVersion, ReviewComment, User]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
