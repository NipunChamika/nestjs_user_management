import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRequestedAtToUserTable1701934596047
  implements MigrationInterface
{
  name = 'AddRequestedAtToUserTable1701934596047';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD \`requestedAt\` datetime NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`requestedAt\``);
  }
}
