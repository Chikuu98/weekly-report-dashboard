import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { WeeklyReport, ReportStatus } from '../entities/weekly-report.entity';
import { UserRole } from '../entities/user.entity';

describe('AiController & AiService', () => {
  let controller: AiController;
  let service: AiService;

  const mockWeeklyReportRepo = {
    find: jest.fn().mockResolvedValue([
      {
        id: 1,
        status: ReportStatus.APPROVED,
        week_start_date: new Date('2026-03-01'),
        week_end_date: new Date('2026-03-07'),
        current_version: 1,
        user: { name: 'Alice Smith', email: 'alice@example.com', role: UserRole.TEAM_MEMBER },
        project: { name: 'Project Alpha' },
        versions: [
          {
            version_number: 1,
            blockers: 'None',
            key_blocker: null,
            achievements: 'Completed authentication module',
            key_achievement: 'Auth Module Done',
            tasks_json: [{ task_name: 'Implement JWT Auth', status: 'completed', actual_percentage: 100 }],
            next_week_tasks: 'Start Dashboard UI',
          },
        ],
        review_comments: [],
      },
    ]),
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'GEMINI_API_KEY') return 'test-key';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiController],
      providers: [
        AiService,
        {
          provide: getRepositoryToken(WeeklyReport),
          useValue: mockWeeklyReportRepo,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<AiController>(AiController);
    service = module.get<AiService>(AiService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  it('should call askAssistant when chat endpoint is invoked', async () => {
    const askSpy = jest
      .spyOn(service, 'askAssistant')
      .mockResolvedValue({ answer: 'Team is on track with Project Alpha.', timestamp: new Date().toISOString() });

    const result = await controller.chat({ query: 'What is the team status?' });

    expect(askSpy).toHaveBeenCalledWith('What is the team status?');
    expect(result.answer).toContain('Team is on track');
  });
});
