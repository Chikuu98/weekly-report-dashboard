import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WeeklyReport } from './weekly-report.entity';

@Entity('report_versions')
export class ReportVersion {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  report_id: number;

  @ManyToOne(() => WeeklyReport, (report: WeeklyReport) => report.versions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'report_id' })
  report: WeeklyReport;

  @Column({ type: 'int' })
  version_number: number;

  @Column({ type: 'json' })
  tasks_json: any;

  @Column({ type: 'text' })
  next_week_tasks: string;

  @Column({ type: 'text' })
  blockers: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  key_blocker: string;

  @Column({ type: 'text' })
  achievements: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  key_achievement: string;

  @Column({ type: 'json', nullable: true })
  hours_by_type_json: any;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'timestamp', nullable: true })
  submitted_at: Date;
}
