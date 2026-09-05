import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WeeklyReport, ReportStatus } from '../entities/weekly-report.entity';
import { ReportVersion } from '../entities/report-version.entity';
import { ReviewComment, ReviewAction } from '../entities/review-comment.entity';
import { User, UserRole } from '../entities/user.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ReviewReportDto } from './dto/review-report.dto';
import { ReportQueryDto } from './dto/report-query.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(WeeklyReport)
    private readonly reportRepository: Repository<WeeklyReport>,
    @InjectRepository(ReportVersion)
    private readonly versionRepository: Repository<ReportVersion>,
    @InjectRepository(ReviewComment)
    private readonly reviewCommentRepository: Repository<ReviewComment>,
  ) {}

  async create(user: User, createReportDto: CreateReportDto): Promise<WeeklyReport> {
    const {
      week_start_date,
      week_end_date,
      project_id,
      tasks_json,
      next_week_tasks,
      blockers,
      key_blocker,
      achievements,
      key_achievement,
      hours_by_type_json,
      notes,
      status,
    } = createReportDto;

    const reportStatus = status || ReportStatus.DRAFT;

    const report = this.reportRepository.create({
      user_id: user.id,
      project_id: project_id || undefined,
      week_start_date: new Date(week_start_date),
      week_end_date: new Date(week_end_date),
      status: reportStatus,
      current_version: 1,
    });

    const savedReport = await this.reportRepository.save(report);

    const initialVersion = this.versionRepository.create({
      report_id: savedReport.id,
      report: savedReport,
      version_number: 1,
      tasks_json: tasks_json || [],
      next_week_tasks: next_week_tasks || '',
      blockers: blockers || '',
      key_blocker: key_blocker || null,
      achievements: achievements || '',
      key_achievement: key_achievement || null,
      hours_by_type_json: hours_by_type_json || null,
      notes: notes || null,
      submitted_at: reportStatus === ReportStatus.SUBMITTED ? new Date() : null,
    } as Partial<ReportVersion>);

    await this.versionRepository.save(initialVersion);

    return this.findOneInternal(savedReport.id);
  }

  async update(
    id: number,
    user: User,
    updateReportDto: UpdateReportDto,
  ): Promise<WeeklyReport> {
    const report = await this.reportRepository.findOne({
      where: { id },
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    if (user.role === UserRole.TEAM_MEMBER && report.user_id !== user.id) {
      throw new ForbiddenException('Forbidden resource: You can only edit your own report');
    }

    if (
      report.status === ReportStatus.SUBMITTED ||
      report.status === ReportStatus.APPROVED
    ) {
      throw new BadRequestException(
        `Cannot edit report in status '${report.status}'. Edits are only allowed when draft or needs correction.`,
      );
    }

    if (updateReportDto.week_start_date) {
      report.week_start_date = new Date(updateReportDto.week_start_date);
    }
    if (updateReportDto.week_end_date) {
      report.week_end_date = new Date(updateReportDto.week_end_date);
    }
    if (updateReportDto.project_id !== undefined) {
      report.project_id = updateReportDto.project_id;
    }

    await this.reportRepository.save(report);

    let currentVersion = await this.versionRepository.findOne({
      where: { report_id: report.id, version_number: report.current_version },
    });

    if (!currentVersion) {
      currentVersion = this.versionRepository.create({
        report_id: report.id,
        report: report,
        version_number: report.current_version,
      } as Partial<ReportVersion>);
    }

    if (updateReportDto.tasks_json !== undefined) {
      currentVersion.tasks_json = updateReportDto.tasks_json;
    }
    if (updateReportDto.next_week_tasks !== undefined) {
      currentVersion.next_week_tasks = updateReportDto.next_week_tasks;
    }
    if (updateReportDto.blockers !== undefined) {
      currentVersion.blockers = updateReportDto.blockers;
    }
    if (updateReportDto.key_blocker !== undefined) {
      currentVersion.key_blocker = updateReportDto.key_blocker;
    }
    if (updateReportDto.achievements !== undefined) {
      currentVersion.achievements = updateReportDto.achievements;
    }
    if (updateReportDto.key_achievement !== undefined) {
      currentVersion.key_achievement = updateReportDto.key_achievement;
    }
    if (updateReportDto.hours_by_type_json !== undefined) {
      currentVersion.hours_by_type_json = updateReportDto.hours_by_type_json;
    }
    if (updateReportDto.notes !== undefined) {
      currentVersion.notes = updateReportDto.notes;
    }

    await this.versionRepository.save(currentVersion);

    return this.findOneInternal(report.id);
  }

  async submit(id: number, user: User): Promise<WeeklyReport> {
    const report = await this.reportRepository.findOne({
      where: { id },
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    if (user.role === UserRole.TEAM_MEMBER && report.user_id !== user.id) {
      throw new ForbiddenException('Forbidden resource: You can only submit your own report');
    }

    if (
      report.status === ReportStatus.SUBMITTED ||
      report.status === ReportStatus.APPROVED
    ) {
      throw new BadRequestException(`Report is already in '${report.status}' status`);
    }

    if (report.status === ReportStatus.NEEDS_CORRECTION) {
      const prevVersion = await this.versionRepository.findOne({
        where: { report_id: report.id, version_number: report.current_version },
      });

      report.current_version += 1;

      const newVersion = this.versionRepository.create({
        report_id: report.id,
        report: report,
        version_number: report.current_version,
        tasks_json: prevVersion?.tasks_json || [],
        next_week_tasks: prevVersion?.next_week_tasks || '',
        blockers: prevVersion?.blockers || '',
        key_blocker: prevVersion?.key_blocker || null,
        achievements: prevVersion?.achievements || '',
        key_achievement: prevVersion?.key_achievement || null,
        hours_by_type_json: prevVersion?.hours_by_type_json || null,
        notes: prevVersion?.notes || null,
        submitted_at: new Date(),
      } as Partial<ReportVersion>);

      await this.versionRepository.save(newVersion);
    } else {
      let currentVersion = await this.versionRepository.findOne({
        where: { report_id: report.id, version_number: report.current_version },
      });

      if (!currentVersion) {
        currentVersion = this.versionRepository.create({
          report_id: report.id,
          report: report,
          version_number: report.current_version,
          tasks_json: [],
          next_week_tasks: '',
          blockers: '',
          achievements: '',
        } as Partial<ReportVersion>);
      }

      currentVersion.submitted_at = new Date();
      await this.versionRepository.save(currentVersion);
    }

    report.status = ReportStatus.SUBMITTED;
    await this.reportRepository.save(report);

    return this.findOneInternal(report.id);
  }

  async review(
    id: number,
    manager: User,
    reviewReportDto: ReviewReportDto,
  ): Promise<WeeklyReport> {
    const { action, comment } = reviewReportDto;

    if (!comment || !comment.trim()) {
      throw new BadRequestException('A general review comment is mandatory');
    }

    const report = await this.reportRepository.findOne({
      where: { id },
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    if (report.status !== ReportStatus.SUBMITTED) {
      throw new BadRequestException(
        `Can only review submitted reports. Current status is '${report.status}'.`,
      );
    }

    const reviewComment = this.reviewCommentRepository.create({
      report_id: report.id,
      version_number: report.current_version,
      manager_id: manager.id,
      action,
      comment: comment.trim(),
    });

    await this.reviewCommentRepository.save(reviewComment);

    report.status =
      action === ReviewAction.NEEDS_CORRECTION
        ? ReportStatus.NEEDS_CORRECTION
        : ReportStatus.APPROVED;

    await this.reportRepository.save(report);

    return this.findOneInternal(report.id);
  }

  async findMyReports(
    user: User,
    query: ReportQueryDto,
  ): Promise<{ data: WeeklyReport[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const qb = this.reportRepository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.user', 'user')
      .leftJoinAndSelect('report.project', 'project')
      .leftJoinAndSelect('report.versions', 'versions')
      .leftJoinAndSelect('report.review_comments', 'review_comments')
      .leftJoinAndSelect('review_comments.manager', 'manager')
      .where('report.user_id = :userId', { userId: user.id });

    if (query.status) {
      qb.andWhere('report.status = :status', { status: query.status });
    }

    if (query.project_id) {
      qb.andWhere('report.project_id = :projectId', { projectId: query.project_id });
    }

    if (query.week_start_date) {
      qb.andWhere('report.week_start_date = :weekStartDate', { weekStartDate: query.week_start_date });
    }

    qb.orderBy('report.week_start_date', 'DESC')
      .addOrderBy('versions.version_number', 'ASC')
      .addOrderBy('review_comments.created_at', 'ASC')
      .skip(skip)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    // Clean up passwords from user objects
    data.forEach((r) => {
      if (r.user) delete (r.user as any).password_hash;
      if (r.review_comments) {
        r.review_comments.forEach((c) => {
          if (c.manager) delete (c.manager as any).password_hash;
        });
      }
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number, user: User): Promise<WeeklyReport> {
    const report = await this.findOneInternal(id);

    if (user.role === UserRole.TEAM_MEMBER && report.user_id !== user.id) {
      throw new ForbiddenException('Forbidden resource: You cannot view another user\'s report');
    }

    return report;
  }

  async findAll(
    user: User,
    query: ReportQueryDto,
  ): Promise<{ data: WeeklyReport[]; total: number; page: number; limit: number; totalPages: number }> {
    if (user.role === UserRole.TEAM_MEMBER) {
      return this.findMyReports(user, query);
    }

    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const qb = this.reportRepository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.user', 'user')
      .leftJoinAndSelect('report.project', 'project')
      .leftJoinAndSelect('report.versions', 'versions')
      .leftJoinAndSelect('report.review_comments', 'review_comments')
      .leftJoinAndSelect('review_comments.manager', 'manager');

    if (query.user_id) {
      qb.andWhere('report.user_id = :userId', { userId: query.user_id });
    }

    if (query.status) {
      qb.andWhere('report.status = :status', { status: query.status });
    }

    if (query.project_id) {
      qb.andWhere('report.project_id = :projectId', { projectId: query.project_id });
    }

    if (query.week_start_date) {
      qb.andWhere('report.week_start_date = :weekStartDate', { weekStartDate: query.week_start_date });
    }

    qb.orderBy('report.week_start_date', 'DESC')
      .addOrderBy('versions.version_number', 'ASC')
      .addOrderBy('review_comments.created_at', 'ASC')
      .skip(skip)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    data.forEach((r) => {
      if (r.user) delete (r.user as any).password_hash;
      if (r.review_comments) {
        r.review_comments.forEach((c) => {
          if (c.manager) delete (c.manager as any).password_hash;
        });
      }
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private async findOneInternal(id: number): Promise<WeeklyReport> {
    const report = await this.reportRepository.findOne({
      where: { id },
      relations: ['user', 'project', 'versions', 'review_comments', 'review_comments.manager'],
      order: {
        versions: { version_number: 'ASC' },
        review_comments: { created_at: 'ASC' },
      },
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    if (report.user) {
      delete (report.user as any).password_hash;
    }
    if (report.review_comments) {
      report.review_comments.forEach((comment) => {
        if (comment.manager) {
          delete (comment.manager as any).password_hash;
        }
      });
    }

    return report;
  }
}
