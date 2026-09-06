import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WeeklyReport } from '../entities/weekly-report.entity';
import { ReportVersion } from '../entities/report-version.entity';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private ai: GoogleGenAI | null = null;

  constructor(
    @InjectRepository(WeeklyReport)
    private readonly reportRepository: Repository<WeeklyReport>,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') || process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        this.ai = new GoogleGenAI({ apiKey });
        this.logger.log('Google GenAI SDK successfully initialized');
      } catch (err) {
        this.logger.error('Failed to initialize Google GenAI SDK', err);
      }
    } else {
      this.logger.warn('GEMINI_API_KEY not found in environment variables');
    }
  }

  async askAssistant(managerQuery: string): Promise<{ answer: string; timestamp: string }> {
    if (!this.ai) {
      const apiKey = this.configService.get<string>('GEMINI_API_KEY') || process.env.GEMINI_API_KEY;
      if (apiKey) {
        this.ai = new GoogleGenAI({ apiKey });
      } else {
        return {
          answer: 'AI Assistant is currently unavailable because the GEMINI_API_KEY is not configured.',
          timestamp: new Date().toISOString(),
        };
      }
    }

    // 1. Fetch recent reports (submitted, approved, or needs_correction) with all version context
    const recentReports = await this.reportRepository.find({
      relations: ['user', 'project', 'versions', 'review_comments', 'review_comments.manager'],
      order: {
        created_at: 'DESC',
      },
      take: 20,
    });

    if (!recentReports || recentReports.length === 0) {
      return {
        answer: 'There are currently no weekly reports in the system to analyze.',
        timestamp: new Date().toISOString(),
      };
    }

    // 2. Format database records into rich structured context for Gemini
    const contextLines = recentReports.map((report) => {
      const versions: ReportVersion[] = report.versions || [];
      const latestVersion =
        versions.find((v) => v.version_number === report.current_version) ||
        versions[versions.length - 1];

      let tasksSummary = 'None recorded';
      if (latestVersion?.tasks_json && Array.isArray(latestVersion.tasks_json) && latestVersion.tasks_json.length > 0) {
        tasksSummary = latestVersion.tasks_json
          .map(
            (t: any) =>
              `• ${t.task_name || t.name || 'Task'} [Priority: ${t.priority || 'Medium'}, Status: ${t.status || 'In Progress'}, Planned: ${t.planned_percentage || 0}%, Actual: ${t.actual_percentage || 0}%, Hours: ${t.actual_hours || t.time_spent || 0}h, Deliverable: ${t.output_deliverable || 'N/A'}]`,
          )
          .join('\n    ');
      }

      let hoursSummary = 'N/A';
      if (latestVersion?.hours_by_type_json && typeof latestVersion.hours_by_type_json === 'object') {
        hoursSummary = Object.entries(latestVersion.hours_by_type_json)
          .map(([type, hrs]) => `${type}: ${hrs}h`)
          .join(', ');
      }

      const latestReview = report.review_comments && report.review_comments.length > 0
        ? report.review_comments[report.review_comments.length - 1]
        : null;
      const reviewFeedback = latestReview
        ? `[Review by ${latestReview.manager?.name || 'Manager'}: ${latestReview.action} - "${latestReview.comment}"]`
        : 'No review comments';

      return `--- REPORT (ID: #${report.id}) ---
Team Member: ${report.user?.name || 'Unknown'} (${report.user?.email || 'N/A'})
Project: ${report.project?.name || 'General / Unassigned'}
Week Period: ${report.week_start_date} to ${report.week_end_date}
Status: ${report.status} (Version ${report.current_version})
Key Blocker: ${latestVersion?.key_blocker || 'None'}
All Blockers & Challenges: ${latestVersion?.blockers || 'None reported'}
Key Achievement: ${latestVersion?.key_achievement || 'None'}
All Achievements & Highlights: ${latestVersion?.achievements || 'None reported'}
Tasks Completed / In-Progress:
    ${tasksSummary}
Tasks Planned for Next Week: ${latestVersion?.next_week_tasks || 'None reported'}
Hours Breakdown: ${hoursSummary}
Manager Review Notes: ${reviewFeedback}
Additional Notes: ${latestVersion?.notes || 'None'}`;
    });

    const contextData = contextLines.join('\n\n');

    // 3. Construct prompt with system instructions and domain context
    const prompt = `You are an intelligent, executive AI engineering management assistant for the Weekly Report Dashboard application.
You help Engineering Managers analyze team velocity, task completion, key blockers, major achievements, workload distribution, and project progress based on submitted weekly work reports.

Here is the current team weekly report data retrieved from the database:
====================
${contextData}
====================

Manager Question: "${managerQuery}"

Instructions:
1. Provide a direct, professional, concise, and well-structured answer using markdown formatting (bullet points, bold text for key names/metrics, clear sections if comparing multiple engineers or projects).
2. Ground your answers accurately in the provided report data.
3. If asked about blockers, highlight recurring themes or key issues that need managerial intervention.
4. If asked about team workload or achievements, highlight standout accomplishments and potential imbalances.
5. If the requested information is not available in the provided reports, clearly state that you don't have enough data from the current reports.`;

    // 4. Generate content with Gemini
    const modelsToTry = ['gemini-3.6-flash', 'gemini-3.6-pro', 'gemini-2.5-flash'];
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const response = await this.ai.models.generateContent({
          model,
          contents: prompt,
        });

        if (response && response.text) {
          return {
            answer: response.text,
            timestamp: new Date().toISOString(),
          };
        }
      } catch (error: any) {
        lastError = error;
        this.logger.warn(`Failed with model ${model}, trying fallback if available...`, error?.message || error);
      }
    }

    this.logger.error('Gemini API Error across all models:', lastError);
    return {
      answer: `Sorry, I encountered an error while analyzing the reports. ${lastError?.message || 'Please check your API key and connection.'}`,
      timestamp: new Date().toISOString(),
    };
  }
}
