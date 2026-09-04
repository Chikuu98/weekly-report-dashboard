import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import {
  User,
  Project,
  WeeklyReport,
  ReportVersion,
  ReviewComment,
} from './entities';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'weekly_report_db',
  entities: [User, Project, WeeklyReport, ReportVersion, ReviewComment],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
});
