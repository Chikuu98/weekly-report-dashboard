import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { ReportsController } from '../src/reports/reports.controller';
import { ReportsService } from '../src/reports/reports.service';
import { WeeklyReport, ReportStatus } from '../src/entities/weekly-report.entity';
import { ReportVersion } from '../src/entities/report-version.entity';
import { ReviewComment } from '../src/entities/review-comment.entity';
import { User, UserRole } from '../src/entities/user.entity';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';

describe('ReportsController RBAC (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const memberUser1: Partial<User> = {
    id: 1,
    name: 'Team Member 1',
    email: 'member1@example.com',
    password_hash: 'hashed',
    role: UserRole.TEAM_MEMBER,
    created_at: new Date(),
    updated_at: new Date(),
    reports: [],
    review_comments: [],
  };

  const memberUser2: Partial<User> = {
    id: 2,
    name: 'Team Member 2',
    email: 'member2@example.com',
    password_hash: 'hashed',
    role: UserRole.TEAM_MEMBER,
    created_at: new Date(),
    updated_at: new Date(),
    reports: [],
    review_comments: [],
  };

  const managerUser: Partial<User> = {
    id: 99,
    name: 'Manager User',
    email: 'manager@example.com',
    password_hash: 'hashed',
    role: UserRole.MANAGER,
    created_at: new Date(),
    updated_at: new Date(),
    reports: [],
    review_comments: [],
  };

  const mockReportOwnedByMember2: Partial<WeeklyReport> = {
    id: 200,
    user_id: memberUser2.id,
    user: memberUser2 as User,
    week_start_date: new Date('2026-09-01'),
    week_end_date: new Date('2026-09-07'),
    status: ReportStatus.SUBMITTED,
    current_version: 1,
    created_at: new Date(),
    updated_at: new Date(),
    versions: [],
    review_comments: [],
  };

  const mockDraftReportOwnedByMember2: Partial<WeeklyReport> = {
    id: 201,
    user_id: memberUser2.id,
    user: memberUser2 as User,
    week_start_date: new Date('2026-09-01'),
    week_end_date: new Date('2026-09-07'),
    status: ReportStatus.DRAFT,
    current_version: 1,
    created_at: new Date(),
    updated_at: new Date(),
    versions: [],
    review_comments: [],
  };

  const mockUserRepository = {
    findOne: jest.fn().mockImplementation(({ where }) => {
      if (where.id === memberUser1.id) return Promise.resolve(memberUser1);
      if (where.id === memberUser2.id) return Promise.resolve(memberUser2);
      if (where.id === managerUser.id) return Promise.resolve(managerUser);
      return Promise.resolve(null);
    }),
  };

  const mockReportRepository = {
    findOne: jest.fn().mockImplementation(({ where }) => {
      if (where.id === mockReportOwnedByMember2.id) {
        return Promise.resolve(mockReportOwnedByMember2);
      }
      if (where.id === mockDraftReportOwnedByMember2.id) {
        return Promise.resolve(mockDraftReportOwnedByMember2);
      }
      return Promise.resolve(null);
    }),
  };

  const mockVersionRepository = {
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((dto) => Promise.resolve(dto)),
  };

  const mockReviewCommentRepository = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((dto) => Promise.resolve(dto)),
  };

  beforeAll(async () => {
    jwtService = new JwtService({
      secret: 'super-secret-key-weekly-report-dashboard',
      signOptions: { expiresIn: '1h' },
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          secret: 'super-secret-key-weekly-report-dashboard',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      controllers: [ReportsController],
      providers: [
        ReportsService,
        JwtStrategy,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(WeeklyReport),
          useValue: mockReportRepository,
        },
        {
          provide: getRepositoryToken(ReportVersion),
          useValue: mockVersionRepository,
        },
        {
          provide: getRepositoryToken(ReviewComment),
          useValue: mockReviewCommentRepository,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('1. should return 403 Forbidden when a team_member attempts to access another user report', async () => {
    const token = jwtService.sign({
      sub: memberUser1.id,
      email: memberUser1.email,
      role: memberUser1.role,
    });

    const response = await (request(app.getHttpServer()) as any)
      .get(`/api/reports/${mockReportOwnedByMember2.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    expect(response.body.statusCode).toBe(403);
    expect(response.body.message).toContain('Forbidden');
  });

  it('2. should return 403 Forbidden when a team_member attempts to execute a review action', async () => {
    const token = jwtService.sign({
      sub: memberUser1.id,
      email: memberUser1.email,
      role: memberUser1.role,
    });

    const response = await (request(app.getHttpServer()) as any)
      .post(`/api/reports/${mockReportOwnedByMember2.id}/review`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        action: 'approved',
        comment: 'Attempting review as team member',
      })
      .expect(403);

    expect(response.body.statusCode).toBe(403);
    expect(response.body.message).toContain('Access denied');
  });

  it('3. should return 403 Forbidden when a manager attempts to access a team member draft report', async () => {
    const token = jwtService.sign({
      sub: managerUser.id,
      email: managerUser.email,
      role: managerUser.role,
    });

    const response = await (request(app.getHttpServer()) as any)
      .get(`/api/reports/${mockDraftReportOwnedByMember2.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    expect(response.body.statusCode).toBe(403);
    expect(response.body.message).toContain('Draft reports are only visible to the author');
  });

  it('4. should allow a team member to access their own draft report', async () => {
    const token = jwtService.sign({
      sub: memberUser2.id,
      email: memberUser2.email,
      role: memberUser2.role,
    });

    const response = await (request(app.getHttpServer()) as any)
      .get(`/api/reports/${mockDraftReportOwnedByMember2.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.id).toBe(mockDraftReportOwnedByMember2.id);
    expect(response.body.status).toBe(ReportStatus.DRAFT);
  });

  it('5. should return 403 Forbidden when a manager attempts to edit a team member report content', async () => {
    const token = jwtService.sign({
      sub: managerUser.id,
      email: managerUser.email,
      role: managerUser.role,
    });

    const response = await (request(app.getHttpServer()) as any)
      .patch(`/api/reports/${mockDraftReportOwnedByMember2.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        notes: 'Manager attempting to edit report content directly',
      })
      .expect(403);

    expect(response.body.statusCode).toBe(403);
    expect(response.body.message).toContain('You can only edit your own report');
  });
});
