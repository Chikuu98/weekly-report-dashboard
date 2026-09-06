import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async findAll(): Promise<Project[]> {
    return this.projectRepository
      .createQueryBuilder('project')
      .loadRelationCountAndMap('project.reports_count', 'project.reports')
      .orderBy('project.created_at', 'DESC')
      .getMany();
  }

  async findOne(id: number): Promise<Project> {
    const project = await this.projectRepository
      .createQueryBuilder('project')
      .loadRelationCountAndMap('project.reports_count', 'project.reports')
      .where('project.id = :id', { id })
      .getOne();
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return project;
  }

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    const project = this.projectRepository.create(createProjectDto);
    return this.projectRepository.save(project);
  }

  async update(id: number, updateProjectDto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id);
    Object.assign(project, updateProjectDto);
    return this.projectRepository.save(project);
  }

  async remove(id: number): Promise<{ message: string }> {
    const project = await this.findOne(id);
    await this.projectRepository.remove(project);
    return { message: `Project with ID ${id} deleted successfully` };
  }
}
