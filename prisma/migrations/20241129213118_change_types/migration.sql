/*
  Warnings:

  - The values [TurnOffAllDevices] on the enum `scenario_step_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ScenarioTriggerType" ADD VALUE 'DevicePowerOn';
ALTER TYPE "ScenarioTriggerType" ADD VALUE 'DevicePowerOff';

-- AlterEnum
BEGIN;
CREATE TYPE "scenario_step_type_new" AS ENUM ('RunScenario', 'Wait', 'TurnOnDevice', 'TurnOffDevice', 'ToggleDevice');
ALTER TABLE "scenario_step_condition" ALTER COLUMN "type" TYPE "scenario_step_type_new" USING ("type"::text::"scenario_step_type_new");
ALTER TABLE "scenario_step" ALTER COLUMN "type" TYPE "scenario_step_type_new" USING ("type"::text::"scenario_step_type_new");
ALTER TABLE "scenario_condition" ALTER COLUMN "type" TYPE "scenario_step_type_new" USING ("type"::text::"scenario_step_type_new");
ALTER TYPE "scenario_step_type" RENAME TO "scenario_step_type_old";
ALTER TYPE "scenario_step_type_new" RENAME TO "scenario_step_type";
DROP TYPE "scenario_step_type_old";
COMMIT;
