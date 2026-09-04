import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WeeklyReport } from './weekly-report.entity';
import { User } from './user.entity';

export enum ReviewAction {
  NEEDS_CORRECTION = 'needs_correction',
  APPROVED = 'approved',
}

@Entity('review_comments')
export class ReviewComment {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  report_id: number;

  @ManyToOne(() => WeeklyReport, (report: WeeklyReport) => report.review_comments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'report_id' })
  report: WeeklyReport;

  @Column({ type: 'int' })
  version_number: number;

  @Column()
  manager_id: number;

  @ManyToOne(() => User, (user: User) => user.review_comments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'manager_id' })
  manager: User;

  @Column({ type: 'text' })
  comment: string;

  @Column({
    type: 'enum',
    enum: ReviewAction,
  })
  action: ReviewAction;

  @CreateDateColumn()
  created_at: Date;
}
