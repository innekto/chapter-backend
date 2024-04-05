import { MigrationInterface, QueryRunner } from "typeorm";

export class AddViewedToNota1711969861793 implements MigrationInterface {
    name = 'AddViewedToNota1711969861793'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "nota" ADD "isViewed" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "nota" DROP COLUMN "isViewed"`);
    }

}
