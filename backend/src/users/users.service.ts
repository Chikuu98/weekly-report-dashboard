import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { WeeklyReport, ReportStatus } from '../entities/weekly-report.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(WeeklyReport)
    private readonly reportRepository: Repository<WeeklyReport>,
  ) {}

  async findAllTeamMembers() {
    const users = await this.userRepository.find({
      order: { name: 'ASC' },
    });

    // Remove passwords & calculate summary stats per user
    const result = await Promise.all(
      users.map(async (u) => {
        const { password_hash, ...userWithoutPassword } = u;

        const reports = await this.reportRepository.find({
          where: { user_id: u.id },
          relations: ['project', 'versions'],
        });

        const totalReports = reports.length;
        const approvedCount = reports.filter((r) => r.status === ReportStatus.APPROVED).length;
        const needsCorrectionCount = reports.filter((r) => r.status === ReportStatus.NEEDS_CORRECTION).length;
        const submittedCount = reports.filter((r) => r.status === ReportStatus.SUBMITTED).length;
        const draftCount = reports.filter((r) => r.status === ReportStatus.DRAFT).length;

        // Compliance rate: percentage of reports submitted/approved vs total expected or submitted
        const complianceRate = totalReports > 0 ? Math.round(((approvedCount + submittedCount) / totalReports) * 100) : 100;

        return {
          ...userWithoutPassword,
          stats: {
            totalReports,
            approvedCount,
            needsCorrectionCount,
            submittedCount,
            draftCount,
            complianceRate,
          },
        };
      }),
    );

    return result;
  }

  async findUserProfile(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const { password_hash, ...userWithoutPassword } = user;

    const reports = await this.reportRepository.find({
      where: { user_id: user.id },
      relations: ['project', 'versions', 'review_comments', 'review_comments.manager'],
      order: { week_start_date: 'DESC' },
    });

    reports.forEach((r) => {
      if (r.review_comments) {
        r.review_comments.forEach((c) => {
          if (c.manager) delete (c.manager as any).password_hash;
        });
      }
    });

    const totalReports = reports.length;
    const approvedCount = reports.filter((r) => r.status === ReportStatus.APPROVED).length;
    const needsCorrectionCount = reports.filter((r) => r.status === ReportStatus.NEEDS_CORRECTION).length;
    const submittedCount = reports.filter((r) => r.status === ReportStatus.SUBMITTED).length;
    const draftCount = reports.filter((r) => r.status === ReportStatus.DRAFT).length;

    const complianceRate = totalReports > 0 ? Math.round(((approvedCount + submittedCount) / totalReports) * 100) : 100;

    const openBlockersCount = reports.reduce((acc, r) => {
      const latestVer = r.versions && r.versions.length > 0 ? r.versions[r.versions.length - 1] : null;
      return acc + (latestVer?.key_blocker ? 1 : 0);
    }, 0);

    return {
      user: userWithoutPassword,
      stats: {
        totalReports,
        approvedCount,
        needsCorrectionCount,
        submittedCount,
        draftCount,
        complianceRate,
        openBlockersCount,
      },
      reports,
    };
  }
}
