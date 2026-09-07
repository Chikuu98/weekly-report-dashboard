import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Project } from '../entities/project.entity';
import { User, UserRole } from '../entities/user.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(user?: User): Promise<Project[]> {
    const qb = this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.members', 'member')
      .loadRelationCountAndMap('project.reports_count', 'project.reports')
      .orderBy('project.created_at', 'DESC');

    if (user && user.role === UserRole.TEAM_MEMBER) {
      qb.where((qbInner) => {
        const subQuery = qbInner
          .subQuery()
          .select('pm.project_id')
          .from('project_members', 'pm')
          .where('pm.user_id = :userId')
          .getQuery();
        return 'project.id IN ' + subQuery;
      }).setParameter('userId', user.id);
    }

    return qb.getMany();
  }

  async findOne(id: number): Promise<Project> {
    const project = await this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.members', 'member')
      .loadRelationCountAndMap('project.reports_count', 'project.reports')
      .where('project.id = :id', { id })
      .getOne();
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return project;
  }

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    const { member_ids, ...projectData } = createProjectDto;
    const project = this.projectRepository.create(projectData);
    if (member_ids && member_ids.length > 0) {
      project.members = await this.userRepository.findBy({ id: In(member_ids) });
    } else {
      project.members = [];
    }
    const saved = await this.projectRepository.save(project);
    return this.findOne(saved.id);
  }

  async update(id: number, updateProjectDto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id);
    const { member_ids, ...projectData } = updateProjectDto;
    Object.assign(project, projectData);
    if (member_ids !== undefined) {
      if (member_ids.length > 0) {
        project.members = await this.userRepository.findBy({ id: In(member_ids) });
      } else {
        project.members = [];
      }
    }
    await this.projectRepository.save(project);
    return this.findOne(id);
  }

  async remove(id: number): Promise<{ message: string }> {
    const project = await this.findOne(id);
    await this.projectRepository.remove(project);
    return { message: `Project with ID ${id} deleted successfully` };
  }
}
