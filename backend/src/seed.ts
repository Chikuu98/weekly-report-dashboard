import { AppDataSource } from './data-source';
import { User, UserRole } from './entities/user.entity';
import { Project } from './entities/project.entity';
import { WeeklyReport, ReportStatus } from './entities/weekly-report.entity';
import { ReportVersion } from './entities/report-version.entity';
import { ReviewComment, ReviewAction } from './entities/review-comment.entity';
import * as bcrypt from 'bcrypt';

async function seed() {
  console.log('🌱 Initializing Database Connection for Seeding...');
  await AppDataSource.initialize();

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();

  console.log('🧹 Cleaning existing tables...');
  // Disable foreign key checks to truncate cleanly
  await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0;');
  await queryRunner.query('TRUNCATE TABLE review_comments;');
  await queryRunner.query('TRUNCATE TABLE report_versions;');
  await queryRunner.query('TRUNCATE TABLE weekly_reports;');
  await queryRunner.query('TRUNCATE TABLE projects;');
  await queryRunner.query('TRUNCATE TABLE users;');
  await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1;');

  console.log('👤 Creating Users (1 Manager, 4 Team Members)...');
  const passwordHash = await bcrypt.hash('password123', 10);

  const userRepository = AppDataSource.getRepository(User);

  const manager = await userRepository.save(
    userRepository.create({
      name: 'Sarah Jenkins (Manager)',
      email: 'manager@company.com',
      password_hash: passwordHash,
      role: UserRole.MANAGER,
    }),
  );

  const alice = await userRepository.save(
    userRepository.create({
      name: 'Alice Smith',
      email: 'alice@company.com',
      password_hash: passwordHash,
      role: UserRole.TEAM_MEMBER,
    }),
  );

  const bob = await userRepository.save(
    userRepository.create({
      name: 'Bob Johnson',
      email: 'bob@company.com',
      password_hash: passwordHash,
      role: UserRole.TEAM_MEMBER,
    }),
  );

  const charlie = await userRepository.save(
    userRepository.create({
      name: 'Charlie Davis',
      email: 'charlie@company.com',
      password_hash: passwordHash,
      role: UserRole.TEAM_MEMBER,
    }),
  );

  const diana = await userRepository.save(
    userRepository.create({
      name: 'Diana Prince',
      email: 'diana@company.com',
      password_hash: passwordHash,
      role: UserRole.TEAM_MEMBER,
    }),
  );

  console.log('📁 Creating Projects...');
  const projectRepository = AppDataSource.getRepository(Project);

  const projectClientA = await projectRepository.save(
    projectRepository.create({
      name: 'Client A',
      description: 'Client A Web Portal & E-Commerce platform integration',
      color_code: '#3B82F6',
    }),
  );

  const projectInternalTooling = await projectRepository.save(
    projectRepository.create({
      name: 'Internal Tooling',
      description: 'Internal Automation & Developer Productivity Tooling',
      color_code: '#10B981',
    }),
  );

  const projectInfra = await projectRepository.save(
    projectRepository.create({
      name: 'Infrastructure',
      description: 'Cloud Infrastructure & CI/CD Deployment Pipeline',
      color_code: '#8B5CF6',
    }),
  );

  const projectMobileApp = await projectRepository.save(
    projectRepository.create({
      name: 'Mobile App',
      description: 'iOS & Android Cross-Platform Mobile Application',
      color_code: '#F59E0B',
    }),
  );

  console.log('📅 Generating Weekly Date Ranges (Past 4 Weeks)...');
  const now = new Date();

  // Helper to compute Monday and Sunday for N weeks ago
  const getWeekRange = (weeksAgo: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - weeksAgo * 7);
    const day = d.getDay();
    const diffToMon = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diffToMon));
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return { start: monday, end: sunday };
  };

  const week4Ago = getWeekRange(3);
  const week3Ago = getWeekRange(2);
  const week2Ago = getWeekRange(1);
  const currentWeek = getWeekRange(0);

  const reportRepository = AppDataSource.getRepository(WeeklyReport);
  const versionRepository = AppDataSource.getRepository(ReportVersion);
  const reviewRepository = AppDataSource.getRepository(ReviewComment);

  console.log('📊 Seeding Reports, Version History & Review Comments...');

  // Helper function to create report with version & review history
  const createSeededReport = async (
    userEntity: User,
    projectEntity: Project,
    weekRange: { start: Date; end: Date },
    status: ReportStatus,
    versionsData: Array<{
      versionNumber: number;
      tasks: any[];
      nextWeekTasks: string;
      blockers: string;
      keyBlocker: string | null;
      achievements: string;
      keyAchievement: string | null;
      hours: { development: number; testing: number; meetings: number; documentation: number; other: number };
      notes: string;
      submittedAt: Date | null;
      reviewComment?: { action: ReviewAction; comment: string; createdAt: Date };
    }>,
  ) => {
    const report = await reportRepository.save(
      reportRepository.create({
        user_id: userEntity.id,
        project_id: projectEntity.id,
        week_start_date: weekRange.start,
        week_end_date: weekRange.end,
        status: status,
        current_version: versionsData.length,
      }),
    );

    for (const vData of versionsData) {
      await versionRepository.save(
        versionRepository.create({
          report_id: report.id,
          version_number: vData.versionNumber,
          tasks_json: vData.tasks,
          next_week_tasks: vData.nextWeekTasks,
          blockers: vData.blockers,
          key_blocker: vData.keyBlocker,
          achievements: vData.achievements,
          key_achievement: vData.keyAchievement,
          hours_by_type_json: vData.hours,
          notes: vData.notes,
          submitted_at: vData.submittedAt || undefined,
        } as Partial<ReportVersion>),
      );

      if (vData.reviewComment) {
        await reviewRepository.save(
          reviewRepository.create({
            report_id: report.id,
            version_number: vData.versionNumber,
            manager_id: manager.id,
            action: vData.reviewComment.action,
            comment: vData.reviewComment.comment,
            created_at: vData.reviewComment.createdAt,
          }),
        );
      }
    }
  };

  // ─── ALICE REPORTS ────────────────────────────────────────────────────────
  // Report 1: Alice - 3 Weeks Ago (APPROVED)
  await createSeededReport(alice, projectClientA, week4Ago, ReportStatus.APPROVED, [
    {
      versionNumber: 1,
      tasks: [
        {
          id: '1',
          task_name: 'Design Client A E-Commerce Data Models',
          priority: 'high',
          planned_percentage: 100,
          actual_percentage: 100,
          status: 'completed',
          time_planned: 12,
          time_spent: 12,
          output_deliverable: 'PR #101 merged with updated MySQL schema',
        },
        {
          id: '2',
          task_name: 'Implement Product Catalog API Endpoints',
          priority: 'medium',
          planned_percentage: 100,
          actual_percentage: 100,
          status: 'completed',
          time_planned: 16,
          time_spent: 14,
          output_deliverable: 'REST API endpoints for product CRUD',
        },
      ],
      nextWeekTasks: 'Integrate Stripe payment gateway sandbox and build checkout flow',
      blockers: 'Third-party API rate limits during integration testing',
      keyBlocker: 'Third-party API rate limits',
      achievements: 'Completed product catalog CRUD 2 hours ahead of schedule with full test coverage',
      keyAchievement: 'Product catalog CRUD finished ahead of schedule',
      hours: { development: 22, testing: 8, meetings: 6, documentation: 4, other: 0 },
      notes: 'All pull requests reviewed and approved by tech lead.',
      submittedAt: new Date(week4Ago.end),
      reviewComment: {
        action: ReviewAction.APPROVED,
        comment: 'Great job getting the catalog API completed ahead of time! Approved.',
        createdAt: new Date(week4Ago.end.getTime() + 86400000),
      },
    },
  ]);

  // Report 2: Alice - 2 Weeks Ago (NEEDS CORRECTION -> RESUBMITTED -> APPROVED)
  await createSeededReport(alice, projectClientA, week3Ago, ReportStatus.APPROVED, [
    {
      versionNumber: 1,
      tasks: [
        {
          id: '1',
          task_name: 'Integrate Stripe Payment Gateway',
          priority: 'urgent',
          planned_percentage: 100,
          actual_percentage: 80,
          status: 'in_progress',
          time_planned: 20,
          time_spent: 20,
          output_deliverable: 'Stripe webhook listener created',
        },
      ],
      nextWeekTasks: 'Complete checkout UI frontend components',
      blockers: 'Webhook signature verification failing in staging environment',
      keyBlocker: 'Webhook signature verification failure',
      achievements: 'Successfully connected Stripe sandbox accounts',
      keyAchievement: 'Stripe sandbox connected',
      hours: { development: 24, testing: 10, meetings: 4, documentation: 2, other: 0 },
      notes: '',
      submittedAt: new Date(week3Ago.end),
      reviewComment: {
        action: ReviewAction.NEEDS_CORRECTION,
        comment: 'Please elaborate on the actual percentage completion and provide details on how the webhook issue will be resolved next week.',
        createdAt: new Date(week3Ago.end.getTime() + 86400000),
      },
    },
    {
      versionNumber: 2,
      tasks: [
        {
          id: '1',
          task_name: 'Integrate Stripe Payment Gateway',
          priority: 'urgent',
          planned_percentage: 100,
          actual_percentage: 100,
          status: 'completed',
          time_planned: 20,
          time_spent: 24,
          output_deliverable: 'Stripe webhook listener & payment verification complete with unit tests',
        },
      ],
      nextWeekTasks: 'Build Checkout UI components & order summary screen',
      blockers: 'Webhook signature issue resolved by updating secret keys in staging config',
      keyBlocker: null,
      achievements: 'Full payment flow verified end-to-end in staging',
      keyAchievement: 'End-to-end payment flow verified',
      hours: { development: 26, testing: 10, meetings: 4, documentation: 4, other: 0 },
      notes: 'Resubmitted after updating staging config and writing complete unit tests.',
      submittedAt: new Date(week3Ago.end.getTime() + 172800000),
      reviewComment: {
        action: ReviewAction.APPROVED,
        comment: 'Clear explanation and webhook issue resolved. Approved!',
        createdAt: new Date(week3Ago.end.getTime() + 259200000),
      },
    },
  ]);

  // Report 3: Alice - 1 Week Ago (SUBMITTED)
  await createSeededReport(alice, projectClientA, week2Ago, ReportStatus.SUBMITTED, [
    {
      versionNumber: 1,
      tasks: [
        {
          id: '1',
          task_name: 'Checkout UI & Order Summary View',
          priority: 'high',
          planned_percentage: 100,
          actual_percentage: 100,
          status: 'completed',
          time_planned: 16,
          time_spent: 15,
          output_deliverable: 'Responsive React checkout component with Formik validation',
        },
        {
          id: '2',
          task_name: 'Cart Persistence & LocalStorage Sync',
          priority: 'medium',
          planned_percentage: 100,
          actual_percentage: 90,
          status: 'in_progress',
          time_planned: 10,
          time_spent: 8,
          output_deliverable: 'Cart state hook with Redux Toolkit persistence',
        },
      ],
      nextWeekTasks: 'Perform load testing and prepare for staging release',
      blockers: 'Minor UI styling conflicts on mobile viewports',
      keyBlocker: 'Mobile viewport CSS bugs',
      achievements: 'Smooth checkout user experience with instant validation',
      keyAchievement: 'Smooth checkout UX implementation',
      hours: { development: 20, testing: 8, meetings: 5, documentation: 3, other: 0 },
      notes: 'Ready for manager review.',
      submittedAt: new Date(week2Ago.end),
    },
  ]);

  // Report 4: Alice - Current Week (DRAFT)
  await createSeededReport(alice, projectClientA, currentWeek, ReportStatus.DRAFT, [
    {
      versionNumber: 1,
      tasks: [
        {
          id: '1',
          task_name: 'Mobile Viewport CSS Bugfixes',
          priority: 'medium',
          planned_percentage: 100,
          actual_percentage: 60,
          status: 'in_progress',
          time_planned: 8,
          time_spent: 5,
          output_deliverable: 'Responsive media query patches in Tailwind',
        },
      ],
      nextWeekTasks: 'Client A UAT testing and sign-off',
      blockers: 'Waiting on client feedback regarding mobile checkout layout',
      keyBlocker: 'Client feedback delay',
      achievements: 'Fixed cart drawer animation glitch on iOS Safari',
      keyAchievement: 'Fixed iOS Safari animation glitch',
      hours: { development: 15, testing: 5, meetings: 4, documentation: 2, other: 0 },
      notes: 'Draft in progress.',
      submittedAt: null,
    },
  ]);

  // ─── BOB REPORTS ──────────────────────────────────────────────────────────
  // Report 5: Bob - 3 Weeks Ago (APPROVED)
  await createSeededReport(bob, projectInternalTooling, week4Ago, ReportStatus.APPROVED, [
    {
      versionNumber: 1,
      tasks: [
        {
          id: '1',
          task_name: 'Setup NestJS Backend Repository & TypeORM',
          priority: 'high',
          planned_percentage: 100,
          actual_percentage: 100,
          status: 'completed',
          time_planned: 16,
          time_spent: 16,
          output_deliverable: 'NestJS starter template with MySQL TypeORM entities',
        },
      ],
      nextWeekTasks: 'Implement JWT Auth Guard and Role-Based Access Control',
      blockers: 'TypeORM migration CLI setup differences on Windows',
      keyBlocker: 'TypeORM Windows CLI configuration',
      achievements: 'Clean modular NestJS structure established',
      keyAchievement: 'Clean modular NestJS structure',
      hours: { development: 25, testing: 5, meetings: 6, documentation: 4, other: 0 },
      notes: '',
      submittedAt: new Date(week4Ago.end),
      reviewComment: {
        action: ReviewAction.APPROVED,
        comment: 'Solid foundation for the backend repo. Approved.',
        createdAt: new Date(week4Ago.end.getTime() + 86400000),
      },
    },
  ]);

  // Report 6: Bob - 2 Weeks Ago (APPROVED)
  await createSeededReport(bob, projectInternalTooling, week3Ago, ReportStatus.APPROVED, [
    {
      versionNumber: 1,
      tasks: [
        {
          id: '1',
          task_name: 'Implement JWT Authentication & Guard',
          priority: 'urgent',
          planned_percentage: 100,
          actual_percentage: 100,
          status: 'completed',
          time_planned: 16,
          time_spent: 14,
          output_deliverable: 'Auth endpoints (/auth/login, /auth/register) with Passport JWT',
        },
      ],
      nextWeekTasks: 'Build Report Review & Correction backend API services',
      blockers: 'None',
      keyBlocker: null,
      achievements: 'Implemented robust JWT authentication with password hashing',
      keyAchievement: 'JWT authentication implementation',
      hours: { development: 22, testing: 10, meetings: 4, documentation: 4, other: 0 },
      notes: '',
      submittedAt: new Date(week3Ago.end),
      reviewComment: {
        action: ReviewAction.APPROVED,
        comment: 'Auth system looks secure and clean. Approved.',
        createdAt: new Date(week3Ago.end.getTime() + 86400000),
      },
    },
  ]);

  // Report 7: Bob - 1 Week Ago (NEEDS CORRECTION)
  await createSeededReport(bob, projectInternalTooling, week2Ago, ReportStatus.NEEDS_CORRECTION, [
    {
      versionNumber: 1,
      tasks: [
        {
          id: '1',
          task_name: 'Report Review & Versioning Backend APIs',
          priority: 'high',
          planned_percentage: 100,
          actual_percentage: 75,
          status: 'in_progress',
          time_planned: 18,
          time_spent: 18,
          output_deliverable: 'Endpoints for PATCH /reports/:id and POST /reports/:id/review',
        },
      ],
      nextWeekTasks: 'Fix version snapshot immutability during correction cycles',
      blockers: 'Version snapshot overwriting issue when updating needs_correction reports',
      keyBlocker: 'Version snapshot overwriting bug',
      achievements: 'Drafted review comment schema and relations',
      keyAchievement: 'Drafted review comment schema',
      hours: { development: 20, testing: 8, meetings: 6, documentation: 2, other: 0 },
      notes: 'Pending correction fix.',
      submittedAt: new Date(week2Ago.end),
      reviewComment: {
        action: ReviewAction.NEEDS_CORRECTION,
        comment: 'Please ensure that the version snapshot immutability is completely fixed before submitting again.',
        createdAt: new Date(week2Ago.end.getTime() + 86400000),
      },
    },
  ]);

  // Report 8: Bob - Current Week (SUBMITTED)
  await createSeededReport(bob, projectInternalTooling, currentWeek, ReportStatus.SUBMITTED, [
    {
      versionNumber: 1,
      tasks: [
        {
          id: '1',
          task_name: 'Fix Version Snapshot Immutability Bug',
          priority: 'urgent',
          planned_percentage: 100,
          actual_percentage: 100,
          status: 'completed',
          time_planned: 10,
          time_spent: 8,
          output_deliverable: 'Updated reports.service.ts to isolate past version records on resubmit',
        },
        {
          id: '2',
          task_name: 'Write Database Seeder Script',
          priority: 'high',
          planned_percentage: 100,
          actual_percentage: 100,
          status: 'completed',
          time_planned: 8,
          time_spent: 6,
          output_deliverable: 'npm run seed script producing seeded users, projects, and reports',
        },
      ],
      nextWeekTasks: 'Deploy backend API to production server',
      blockers: 'None',
      keyBlocker: null,
      achievements: 'Successfully implemented version snapshot immutability and complete DB seeder script',
      keyAchievement: 'DB Seeder script & versioning fix complete',
      hours: { development: 24, testing: 10, meetings: 4, documentation: 2, other: 0 },
      notes: 'Submitted for manager review.',
      submittedAt: new Date(),
    },
  ]);

  // ─── CHARLIE REPORTS ──────────────────────────────────────────────────────
  // Report 9: Charlie - 3 Weeks Ago (APPROVED)
  await createSeededReport(charlie, projectInfra, week4Ago, ReportStatus.APPROVED, [
    {
      versionNumber: 1,
      tasks: [
        {
          id: '1',
          task_name: 'Dockerize Frontend & Backend Microservices',
          priority: 'high',
          planned_percentage: 100,
          actual_percentage: 100,
          status: 'completed',
          time_planned: 16,
          time_spent: 14,
          output_deliverable: 'Dockerfiles and docker-compose.yml for local and staging',
        },
      ],
      nextWeekTasks: 'Configure GitHub Actions CI/CD Pipeline',
      blockers: 'Docker container network routing on local environment',
      keyBlocker: 'Docker container networking',
      achievements: 'Optimized Docker multi-stage builds reducing image size by 60%',
      keyAchievement: 'Reduced Docker image size by 60%',
      hours: { development: 20, testing: 10, meetings: 5, documentation: 5, other: 0 },
      notes: '',
      submittedAt: new Date(week4Ago.end),
      reviewComment: {
        action: ReviewAction.APPROVED,
        comment: 'Docker configuration is clean and efficient. Approved!',
        createdAt: new Date(week4Ago.end.getTime() + 86400000),
      },
    },
  ]);

  // Report 10: Charlie - 2 Weeks Ago (SUBMITTED)
  await createSeededReport(charlie, projectInfra, week3Ago, ReportStatus.SUBMITTED, [
    {
      versionNumber: 1,
      tasks: [
        {
          id: '1',
          task_name: 'Setup GitHub Actions CI/CD Pipeline',
          priority: 'high',
          planned_percentage: 100,
          actual_percentage: 90,
          status: 'in_progress',
          time_planned: 18,
          time_spent: 16,
          output_deliverable: '.github/workflows/deploy.yml pipeline script',
        },
      ],
      nextWeekTasks: 'Configure SSL certificates and domain DNS records',
      blockers: 'Cloud secret keys configuration in GitHub Repository Settings',
      keyBlocker: 'GitHub Actions secrets setup',
      achievements: 'Automated unit test execution on every pull request',
      keyAchievement: 'Automated CI test execution',
      hours: { development: 22, testing: 8, meetings: 6, documentation: 4, other: 0 },
      notes: 'Pipeline active for staging branch.',
      submittedAt: new Date(week3Ago.end),
    },
  ]);

  // Report 11: Charlie - 1 Week Ago (NEEDS CORRECTION)
  await createSeededReport(charlie, projectInfra, week2Ago, ReportStatus.NEEDS_CORRECTION, [
    {
      versionNumber: 1,
      tasks: [
        {
          id: '1',
          task_name: 'SSL Certificate & Nginx Reverse Proxy',
          priority: 'medium',
          planned_percentage: 100,
          actual_percentage: 70,
          status: 'in_progress',
          time_planned: 14,
          time_spent: 14,
          output_deliverable: 'Nginx SSL proxy configuration',
        },
      ],
      nextWeekTasks: 'Complete SSL auto-renewal script with Let\'s Encrypt Certbot',
      blockers: 'Certbot DNS-01 challenge verification delay',
      keyBlocker: 'Certbot DNS challenge delay',
      achievements: 'Configured HTTPS redirection in Nginx',
      keyAchievement: 'HTTPS redirection in Nginx',
      hours: { development: 18, testing: 8, meetings: 4, documentation: 2, other: 0 },
      notes: '',
      submittedAt: new Date(week2Ago.end),
      reviewComment: {
        action: ReviewAction.NEEDS_CORRECTION,
        comment: 'Please update the time spent breakdown and specify when full SSL auto-renewal will be completed.',
        createdAt: new Date(week2Ago.end.getTime() + 86400000),
      },
    },
  ]);

  // Report 12: Charlie - Current Week (DRAFT)
  await createSeededReport(charlie, projectInfra, currentWeek, ReportStatus.DRAFT, [
    {
      versionNumber: 1,
      tasks: [
        {
          id: '1',
          task_name: 'Certbot Auto-Renewal & Monitoring',
          priority: 'medium',
          planned_percentage: 100,
          actual_percentage: 50,
          status: 'in_progress',
          time_planned: 10,
          time_spent: 5,
          output_deliverable: 'Cron job script for SSL auto-renewal',
        },
      ],
      nextWeekTasks: 'Setup Prometheus & Grafana infrastructure monitoring',
      blockers: 'None',
      keyBlocker: null,
      achievements: 'Successfully renewed SSL cert in staging',
      keyAchievement: 'Staging SSL cert renewed',
      hours: { development: 12, testing: 6, meetings: 4, documentation: 2, other: 0 },
      notes: 'Draft status.',
      submittedAt: null,
    },
  ]);

  // ─── DIANA REPORTS ────────────────────────────────────────────────────────
  // Report 13: Diana - 3 Weeks Ago (APPROVED)
  await createSeededReport(diana, projectMobileApp, week4Ago, ReportStatus.APPROVED, [
    {
      versionNumber: 1,
      tasks: [
        {
          id: '1',
          task_name: 'React Native Mobile App Project Setup',
          priority: 'high',
          planned_percentage: 100,
          actual_percentage: 100,
          status: 'completed',
          time_planned: 16,
          time_spent: 15,
          output_deliverable: 'React Native CLI starter template with React Navigation 6',
        },
      ],
      nextWeekTasks: 'Build Mobile Login and Registration Screens',
      blockers: 'iOS CocoaPods installation issues on Apple Silicon',
      keyBlocker: 'iOS CocoaPods installation on Apple Silicon',
      achievements: 'Cross-platform iOS and Android builds running on simulators',
      keyAchievement: 'iOS & Android simulator builds running',
      hours: { development: 22, testing: 8, meetings: 6, documentation: 4, other: 0 },
      notes: '',
      submittedAt: new Date(week4Ago.end),
      reviewComment: {
        action: ReviewAction.APPROVED,
        comment: 'Great mobile setup! Approved.',
        createdAt: new Date(week4Ago.end.getTime() + 86400000),
      },
    },
  ]);

  // Report 14: Diana - 2 Weeks Ago (APPROVED)
  await createSeededReport(diana, projectMobileApp, week3Ago, ReportStatus.APPROVED, [
    {
      versionNumber: 1,
      tasks: [
        {
          id: '1',
          task_name: 'Mobile Authentication Screens',
          priority: 'urgent',
          planned_percentage: 100,
          actual_percentage: 100,
          status: 'completed',
          time_planned: 16,
          time_spent: 14,
          output_deliverable: 'Login, Register & Password Reset UI screens with Axios client',
        },
      ],
      nextWeekTasks: 'Develop Mobile Weekly Report Form View',
      blockers: 'Secure storage configuration for JWT token in React Native',
      keyBlocker: 'React Native Keychain secure storage config',
      achievements: 'Seamless biometric login support added',
      keyAchievement: 'Biometric login support added',
      hours: { development: 24, testing: 8, meetings: 4, documentation: 4, other: 0 },
      notes: '',
      submittedAt: new Date(week3Ago.end),
      reviewComment: {
        action: ReviewAction.APPROVED,
        comment: 'Biometric support is a fantastic addition. Approved!',
        createdAt: new Date(week3Ago.end.getTime() + 86400000),
      },
    },
  ]);

  // Report 15: Diana - 1 Week Ago (SUBMITTED)
  await createSeededReport(diana, projectMobileApp, week2Ago, ReportStatus.SUBMITTED, [
    {
      versionNumber: 1,
      tasks: [
        {
          id: '1',
          task_name: 'Mobile Report Creation Form',
          priority: 'high',
          planned_percentage: 100,
          actual_percentage: 95,
          status: 'in_progress',
          time_planned: 18,
          time_spent: 16,
          output_deliverable: 'Mobile report form with task table & key issue flags',
        },
      ],
      nextWeekTasks: 'Mobile Report History and Status Badges',
      blockers: 'Keyboard avoiding view layout overlap on smaller Android devices',
      keyBlocker: 'Android Keyboard avoiding view issue',
      achievements: 'Responsive touch-friendly task table built',
      keyAchievement: 'Touch-friendly mobile task table',
      hours: { development: 22, testing: 8, meetings: 5, documentation: 3, other: 0 },
      notes: 'Submitted for manager review.',
      submittedAt: new Date(week2Ago.end),
    },
  ]);

  // Report 16: Diana - Current Week (SUBMITTED)
  await createSeededReport(diana, projectMobileApp, currentWeek, ReportStatus.SUBMITTED, [
    {
      versionNumber: 1,
      tasks: [
        {
          id: '1',
          task_name: 'Mobile Report History & Detail View',
          priority: 'high',
          planned_percentage: 100,
          actual_percentage: 100,
          status: 'completed',
          time_planned: 16,
          time_spent: 14,
          output_deliverable: 'Report history screen with pull-to-refresh & detail view modal',
        },
      ],
      nextWeekTasks: 'Test TestFlight iOS build distribution',
      blockers: 'None',
      keyBlocker: null,
      achievements: 'Completed mobile app feature set for Weekly Report Manager',
      keyAchievement: 'Mobile app feature set complete',
      hours: { development: 25, testing: 8, meetings: 4, documentation: 3, other: 0 },
      notes: 'Ready for final review.',
      submittedAt: new Date(),
    },
  ]);

  console.log('✅ Database Seeding Successfully Completed!');
  console.log('---------------------------------------------------------');
  console.log('🔑 SEEDED ACCOUNTS (Password for all: password123)');
  console.log('---------------------------------------------------------');
  console.log('👑 Manager: manager@company.com');
  console.log('👨‍💻 Team Member 1: alice@company.com');
  console.log('👨‍💻 Team Member 2: bob@company.com');
  console.log('👨‍💻 Team Member 3: charlie@company.com');
  console.log('👨‍💻 Team Member 4: diana@company.com');
  console.log('---------------------------------------------------------');
  console.log('📁 Projects Created: Client A, Internal Tooling, Infrastructure, Mobile App');
  console.log('📊 16 Reports Seeded Across Past 4 Weeks (Draft, Submitted, Needs Correction, Approved)');
  console.log('---------------------------------------------------------');

  await queryRunner.release();
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('❌ Database Seeding Failed:', err);
  process.exit(1);
});
