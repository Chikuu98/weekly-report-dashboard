import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class InitialSchema1710000000000 implements MigrationInterface {
  name = 'InitialSchema1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create users table
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'password_hash',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'role',
            type: 'enum',
            enum: ['team_member', 'manager'],
            default: "'team_member'",
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // 2. Create projects table
    await queryRunner.createTable(
      new Table({
        name: 'projects',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'color_code',
            type: 'varchar',
            length: '50',
            default: "'#3B82F6'",
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // 3. Create weekly_reports table
    await queryRunner.createTable(
      new Table({
        name: 'weekly_reports',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'user_id',
            type: 'int',
          },
          {
            name: 'project_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'week_start_date',
            type: 'date',
          },
          {
            name: 'week_end_date',
            type: 'date',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['draft', 'submitted', 'needs_correction', 'approved'],
            default: "'draft'",
          },
          {
            name: 'current_version',
            type: 'int',
            default: 1,
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Foreign key: weekly_reports.user_id -> users.id
    await queryRunner.createForeignKey(
      'weekly_reports',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Foreign key: weekly_reports.project_id -> projects.id
    await queryRunner.createForeignKey(
      'weekly_reports',
      new TableForeignKey({
        columnNames: ['project_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'projects',
        onDelete: 'SET NULL',
      }),
    );

    // 4. Create report_versions table
    await queryRunner.createTable(
      new Table({
        name: 'report_versions',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'report_id',
            type: 'int',
          },
          {
            name: 'version_number',
            type: 'int',
          },
          {
            name: 'tasks_json',
            type: 'json',
          },
          {
            name: 'next_week_tasks',
            type: 'text',
          },
          {
            name: 'blockers',
            type: 'text',
          },
          {
            name: 'key_blocker',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'achievements',
            type: 'text',
          },
          {
            name: 'key_achievement',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'hours_by_type_json',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'submitted_at',
            type: 'datetime',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Foreign key: report_versions.report_id -> weekly_reports.id
    await queryRunner.createForeignKey(
      'report_versions',
      new TableForeignKey({
        columnNames: ['report_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'weekly_reports',
        onDelete: 'CASCADE',
      }),
    );

    // 5. Create review_comments table
    await queryRunner.createTable(
      new Table({
        name: 'review_comments',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'report_id',
            type: 'int',
          },
          {
            name: 'version_number',
            type: 'int',
          },
          {
            name: 'manager_id',
            type: 'int',
          },
          {
            name: 'comment',
            type: 'text',
          },
          {
            name: 'action',
            type: 'enum',
            enum: ['needs_correction', 'approved'],
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Foreign key: review_comments.report_id -> weekly_reports.id
    await queryRunner.createForeignKey(
      'review_comments',
      new TableForeignKey({
        columnNames: ['report_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'weekly_reports',
        onDelete: 'CASCADE',
      }),
    );

    // Foreign key: review_comments.manager_id -> users.id
    await queryRunner.createForeignKey(
      'review_comments',
      new TableForeignKey({
        columnNames: ['manager_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('review_comments');
    await queryRunner.dropTable('report_versions');
    await queryRunner.dropTable('weekly_reports');
    await queryRunner.dropTable('projects');
    await queryRunner.dropTable('users');
  }
}
