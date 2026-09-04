import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { WeeklyReport } from './weekly-report.entity';
import { ReviewComment } from './review-comment.entity';

export enum UserRole {
  TEAM_MEMBER = 'team_member',
  MANAGER = 'manager',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password_hash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.TEAM_MEMBER,
  })
  role: UserRole;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => WeeklyReport, (report: WeeklyReport) => report.user)
  reports: WeeklyReport[];

  @OneToMany(() => ReviewComment, (comment: ReviewComment) => comment.manager)
  review_comments: ReviewComment[];
}
