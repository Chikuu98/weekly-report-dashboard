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

    if (report.user_id !== user.id) {
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

    let currentVersion = await this.versionRepository.findOne({
      where: { report_id: report.id, version_number: report.current_version },
    });

    // If report is in NEEDS_CORRECTION and the current version was previously submitted,
    // increment version_number to create a new draft version so previous version snapshot is preserved.
    if (report.status === ReportStatus.NEEDS_CORRECTION && currentVersion?.submitted_at) {
      const prevVersion = currentVersion;
      report.current_version += 1;
      currentVersion = this.versionRepository.create({
        report_id: report.id,
        report: report,
        version_number: report.current_version,
        tasks_json: prevVersion.tasks_json || [],
        next_week_tasks: prevVersion.next_week_tasks || '',
        blockers: prevVersion.blockers || '',
        key_blocker: prevVersion.key_blocker || null,
        achievements: prevVersion.achievements || '',
        key_achievement: prevVersion.key_achievement || null,
        hours_by_type_json: prevVersion.hours_by_type_json || null,
        notes: prevVersion.notes || null,
        submitted_at: undefined,
      } as Partial<ReportVersion>);
    } else if (!currentVersion) {
      currentVersion = this.versionRepository.create({
        report_id: report.id,
        report: report,
        version_number: report.current_version,
      } as Partial<ReportVersion>);
    }

    await this.reportRepository.save(report);

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

    if (report.user_id !== user.id) {
      throw new ForbiddenException('Forbidden resource: You can only submit your own report');
    }

    if (
      report.status === ReportStatus.SUBMITTED ||
      report.status === ReportStatus.APPROVED
    ) {
      throw new BadRequestException(`Report is already in '${report.status}' status`);
    }

    let currentVersion = await this.versionRepository.findOne({
      where: { report_id: report.id, version_number: report.current_version },
    });

    // If report was in NEEDS_CORRECTION and a new version wasn't created yet during update:
    if (report.status === ReportStatus.NEEDS_CORRECTION && currentVersion?.submitted_at) {
      const prevVersion = currentVersion;
      report.current_version += 1;
      currentVersion = this.versionRepository.create({
        report_id: report.id,
        report: report,
        version_number: report.current_version,
        tasks_json: prevVersion.tasks_json || [],
        next_week_tasks: prevVersion.next_week_tasks || '',
        blockers: prevVersion.blockers || '',
        key_blocker: prevVersion.key_blocker || null,
        achievements: prevVersion.achievements || '',
        key_achievement: prevVersion.key_achievement || null,
        hours_by_type_json: prevVersion.hours_by_type_json || null,
        notes: prevVersion.notes || null,
        submitted_at: new Date(),
      } as Partial<ReportVersion>);
    } else {
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
    }

    await this.versionRepository.save(currentVersion);

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

  private applyFilters(
    qb: any,
    query: ReportQueryDto,
  ) {
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
      const dateStr = query.week_start_date.includes('T')
        ? query.week_start_date.split('T')[0]
        : query.week_start_date;
      qb.andWhere('(DATE(report.week_start_date) = DATE(:weekStartDate) OR report.week_start_date LIKE :weekLike)', {
        weekStartDate: dateStr,
        weekLike: `${dateStr}%`,
      });
    }

    if (query.start_date) {
      const startStr = query.start_date.includes('T') ? query.start_date.split('T')[0] : query.start_date;
      qb.andWhere('DATE(report.week_start_date) >= DATE(:startDate)', {
        startDate: startStr,
      });
    }

    if (query.end_date) {
      const endStr = query.end_date.includes('T') ? query.end_date.split('T')[0] : query.end_date;
      qb.andWhere('DATE(report.week_end_date) <= DATE(:endDate)', {
        endDate: endStr,
      });
    }

    if (query.search && query.search.trim()) {
      qb.andWhere(
        '(LOWER(user.name) LIKE :search OR LOWER(user.email) LIKE :search OR LOWER(project.name) LIKE :search)',
        { search: `%${query.search.trim().toLowerCase()}%` },
      );
    }
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
      .where('report.user_id = :currentUserId', { currentUserId: user.id });

    this.applyFilters(qb, query);

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

    if (report.status === ReportStatus.DRAFT && report.user_id !== user.id) {
      throw new ForbiddenException('Forbidden resource: Draft reports are only visible to the author');
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
      .leftJoinAndSelect('review_comments.manager', 'manager')
      .where('report.status != :draftStatus', { draftStatus: ReportStatus.DRAFT });

    this.applyFilters(qb, query);

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

  async getDashboardStats(
    user: User,
    query: ReportQueryDto,
  ): Promise<{
    totalReports: number;
    submittedCount: number;
    needsCorrectionCount: number;
    approvedCount: number;
    complianceRate: number;
    totalOpenBlockers: number;
    availableWeeks: string[];
    statusDistribution: { name: string; value: number }[];
    weeklyTrends: { week: string; tasksCompleted: number }[];
    hoursByType: {
      category: string;
      Development: number;
      Testing: number;
      Meetings: number;
      Documentation: number;
      Other: number;
    }[];
  }> {
    // 1. Fetch all available weeks from DB (excluding drafts for manager)
    const weeksQb = this.reportRepository
      .createQueryBuilder('report')
      .select('DISTINCT report.week_start_date', 'week_start')
      .orderBy('report.week_start_date', 'DESC');

    if (user.role === UserRole.TEAM_MEMBER) {
      weeksQb.where('report.user_id = :userId', { userId: user.id });
    } else {
      weeksQb.where('report.status != :draftStatus', { draftStatus: ReportStatus.DRAFT });
    }

    const rawWeeks = await weeksQb.getRawMany();
    const availableWeeks: string[] = rawWeeks
      .map((w) => {
        const val = w.week_start || w.report_week_start || w.report_week_start_date || (Object.values(w)[0] as any);
        if (!val) return '';
        if (val instanceof Date) {
          const year = val.getFullYear();
          const month = String(val.getMonth() + 1).padStart(2, '0');
          const day = String(val.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
        const str = String(val);
        return str.includes('T') ? str.split('T')[0] : str;
      })
      .filter(Boolean);

    // 2. Fetch reports matching current filters
    const statsQb = this.reportRepository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.user', 'user')
      .leftJoinAndSelect('report.project', 'project')
      .leftJoinAndSelect('report.versions', 'versions')
      .leftJoinAndSelect('report.review_comments', 'review_comments');

    if (user.role === UserRole.TEAM_MEMBER) {
      statsQb.where('report.user_id = :userId', { userId: user.id });
    } else {
      statsQb.where('report.status != :draftStatus', { draftStatus: ReportStatus.DRAFT });
    }

    this.applyFilters(statsQb, query);
    statsQb.orderBy('report.week_start_date', 'DESC');

    const filteredReports = await statsQb.getMany();

    const totalReports = filteredReports.length;
    const submittedCount = filteredReports.filter((r) => r.status === ReportStatus.SUBMITTED).length;
    const needsCorrectionCount = filteredReports.filter((r) => r.status === ReportStatus.NEEDS_CORRECTION).length;
    const approvedCount = filteredReports.filter((r) => r.status === ReportStatus.APPROVED).length;
    const complianceRate =
      totalReports > 0
        ? Math.round(((submittedCount + approvedCount) / totalReports) * 100)
        : 100;

    const totalOpenBlockers = filteredReports.reduce((acc, r) => {
      const latestVer = r.versions && r.versions.length > 0 ? r.versions[r.versions.length - 1] : null;
      return acc + (latestVer?.key_blocker ? 1 : 0);
    }, 0);

    const statusCounts = {
      Approved: approvedCount,
      'Pending Review': submittedCount,
      'Needs Correction': needsCorrectionCount,
    };
    const statusDistribution = Object.entries(statusCounts)
      .filter(([_, val]) => val > 0)
      .map(([name, value]) => ({ name, value }));

    // Weekly Tasks Trend aggregation
    const trendDataMap: Record<string, { week: string; tasksCompleted: number }> = {};
    filteredReports.forEach((r) => {
      const weekLabel =
        r.week_start_date instanceof Date
          ? r.week_start_date.toISOString().split('T')[0]
          : new Date(String(r.week_start_date)).toISOString().split('T')[0];
      if (!trendDataMap[weekLabel]) {
        trendDataMap[weekLabel] = { week: weekLabel, tasksCompleted: 0 };
      }
      const latestVer = r.versions && r.versions.length > 0 ? r.versions[r.versions.length - 1] : null;
      if (latestVer?.tasks_json && Array.isArray(latestVer.tasks_json)) {
        trendDataMap[weekLabel].tasksCompleted += latestVer.tasks_json.filter(
          (t: any) => t.status === 'completed' || t.actual_percentage === 100,
        ).length;
      }
    });
    const weeklyTrends = Object.values(trendDataMap).sort((a, b) => (a.week > b.week ? 1 : -1));

    // Hours by type aggregation
    const hoursTypeMap: Record<
      string,
      {
        category: string;
        Development: number;
        Testing: number;
        Meetings: number;
        Documentation: number;
        Other: number;
      }
    > = {};

    filteredReports.forEach((r) => {
      const weekLabel =
        r.week_start_date instanceof Date
          ? r.week_start_date.toISOString().split('T')[0]
          : new Date(String(r.week_start_date)).toISOString().split('T')[0];
      if (!hoursTypeMap[weekLabel]) {
        hoursTypeMap[weekLabel] = {
          category: weekLabel,
          Development: 0,
          Testing: 0,
          Meetings: 0,
          Documentation: 0,
          Other: 0,
        };
      }
      const latestVer = r.versions && r.versions.length > 0 ? r.versions[r.versions.length - 1] : null;
      if (latestVer?.hours_by_type_json) {
        hoursTypeMap[weekLabel].Development += Number(latestVer.hours_by_type_json.development || 0);
        hoursTypeMap[weekLabel].Testing += Number(latestVer.hours_by_type_json.testing || 0);
        hoursTypeMap[weekLabel].Meetings += Number(latestVer.hours_by_type_json.meetings || 0);
        hoursTypeMap[weekLabel].Documentation += Number(latestVer.hours_by_type_json.documentation || 0);
        hoursTypeMap[weekLabel].Other += Number(latestVer.hours_by_type_json.other || 0);
      }
    });
    const hoursByType = Object.values(hoursTypeMap).sort((a, b) => (a.category > b.category ? 1 : -1));

    return {
      totalReports,
      submittedCount,
      needsCorrectionCount,
      approvedCount,
      complianceRate,
      totalOpenBlockers,
      availableWeeks,
      statusDistribution,
      weeklyTrends,
      hoursByType,
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
