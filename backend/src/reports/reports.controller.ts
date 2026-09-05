import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ReviewReportDto } from './dto/review-report.dto';
import { ReportQueryDto } from './dto/report-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../entities/user.entity';

@ApiTags('Reports')
@ApiBearerAuth('JWT-auth')
@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @ApiOperation({ summary: 'Create new weekly report (save draft or submit first version)' })
  @ApiResponse({ status: 201, description: 'Weekly report created successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @Post()
  async create(
    @CurrentUser() user: User,
    @Body() createReportDto: CreateReportDto,
  ) {
    return this.reportsService.create(user, createReportDto);
  }

  @ApiOperation({ summary: "Get team member's own report history" })
  @ApiResponse({ status: 200, description: 'Returns array of user reports.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @Get('my-reports')
  async findMyReports(
    @CurrentUser() user: User,
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.findMyReports(user, query);
  }

  @ApiOperation({ summary: 'List all weekly reports with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Returns list of reports.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @Get()
  async findAll(@CurrentUser() user: User, @Query() query: ReportQueryDto) {
    return this.reportsService.findAll(user, query);
  }

  @ApiOperation({ summary: 'Get single report by ID' })
  @ApiParam({ name: 'id', description: 'Report ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Returns report details.' })
  @ApiResponse({ status: 403, description: 'Forbidden if team member accesses another user report.' })
  @ApiResponse({ status: 404, description: 'Report not found.' })
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.reportsService.findOne(id, user);
  }

  @ApiOperation({ summary: 'Edit draft or edit after needs_correction' })
  @ApiParam({ name: 'id', description: 'Report ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Report updated successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request (cannot edit submitted/approved report).' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
    @Body() updateReportDto: UpdateReportDto,
  ) {
    return this.reportsService.update(id, user, updateReportDto);
  }

  @ApiOperation({ summary: 'Submit report for manager review (creates immutable ReportVersion snapshot)' })
  @ApiParam({ name: 'id', description: 'Report ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Report submitted successfully.' })
  @ApiResponse({ status: 400, description: 'Report already submitted or approved.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @Post(':id/submit')
  async submit(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.reportsService.submit(id, user);
  }

  @ApiOperation({ summary: 'Review submitted report - approve or request changes with mandatory comment (Manager only)' })
  @ApiParam({ name: 'id', description: 'Report ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Review action recorded.' })
  @ApiResponse({ status: 400, description: 'Missing mandatory comment or report not submitted.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Manager role required.' })
  @Post(':id/review')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MANAGER)
  async review(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() manager: User,
    @Body() reviewReportDto: ReviewReportDto,
  ) {
    return this.reportsService.review(id, manager, reviewReportDto);
  }
}
