import { MigrationInterface, QueryRunner } from "typeorm";

export class AddResetFlagAndOtpToUserTable1701414612704 implements MigrationInterface {
    name = 'AddResetFlagAndOtpToUserTable1701414612704'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`flag\` tinyint NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`otp\` varchar(4) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`otp\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`flag\``);
    }

}
