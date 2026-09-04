import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Project } from './project.entity';
import { ReportVersion } from './report-version.entity';
import { ReviewComment } from './review-comment.entity';

export enum ReportStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  NEEDS_CORRECTION = 'needs_correction',
  APPROVED = 'approved',
}

@Entity('weekly_reports')
export class WeeklyReport {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  user_id: number;

  @ManyToOne(() => User, (user: User) => user.reports, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true })
  project_id: number;

  @ManyToOne(() => Project, (project: Project) => project.reports, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ type: 'date' })
  week_start_date: Date;

  @Column({ type: 'date' })
  week_end_date: Date;

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.DRAFT,
  })
  status: ReportStatus;

  @Column({ type: 'int', default: 1 })
  current_version: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => ReportVersion, (version: ReportVersion) => version.report)
  versions: ReportVersion[];

  @OneToMany(() => ReviewComment, (comment: ReviewComment) => comment.report)
  review_comments: ReviewComment[];
}
