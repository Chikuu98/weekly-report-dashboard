import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../entities/user.entity';

@ApiTags('Projects')
@ApiBearerAuth('JWT-auth')
@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @ApiOperation({ summary: 'List all projects (Filtered for Team Members, All for Managers)' })
  @ApiResponse({ status: 200, description: 'Returns array of projects.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @Get()
  async findAll(@CurrentUser() user: User) {
    return this.projectsService.findAll(user);
  }

  @ApiOperation({ summary: 'Get single project by ID' })
  @ApiParam({ name: 'id', description: 'Project ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Returns project details.' })
  @ApiResponse({ status: 404, description: 'Project not found.' })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.findOne(id);
  }

  @ApiOperation({ summary: 'Create new project (Manager only)' })
  @ApiResponse({ status: 201, description: 'Project created successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Manager role required.' })
  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.MANAGER)
  async create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  @ApiOperation({ summary: 'Update project (Manager only)' })
  @ApiParam({ name: 'id', description: 'Project ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Project updated successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Manager role required.' })
  @ApiResponse({ status: 404, description: 'Project not found.' })
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MANAGER)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @ApiOperation({ summary: 'Delete project (Manager only)' })
  @ApiParam({ name: 'id', description: 'Project ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Project deleted successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Manager role required.' })
  @ApiResponse({ status: 404, description: 'Project not found.' })
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MANAGER)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.remove(id);
  }
}
