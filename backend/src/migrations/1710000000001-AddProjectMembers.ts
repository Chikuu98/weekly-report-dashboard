import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class AddProjectMembers1710000000001 implements MigrationInterface {
  name = 'AddProjectMembers1710000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create project_members join table
    await queryRunner.createTable(
      new Table({
        name: 'project_members',
        columns: [
          {
            name: 'project_id',
            type: 'int',
            isPrimary: true,
          },
          {
            name: 'user_id',
            type: 'int',
            isPrimary: true,
          },
        ],
      }),
      true,
    );

    // Foreign key: project_members.project_id -> projects.id
    await queryRunner.createForeignKey(
      'project_members',
      new TableForeignKey({
        columnNames: ['project_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'projects',
        onDelete: 'CASCADE',
      }),
    );

    // Foreign key: project_members.user_id -> users.id
    await queryRunner.createForeignKey(
      'project_members',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('project_members');
  }
}
