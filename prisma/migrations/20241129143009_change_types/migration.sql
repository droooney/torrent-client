/*
  Warnings:

  - The values [EmptyHome,NonEmptyHome] on the enum `ScenarioConditionType` will be removed. If these variants are still used in the database, this will fail.
  - The values [EmptyHome,NonEmptyHome] on the enum `ScenarioTriggerType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ScenarioConditionType_new" AS ENUM ('DeviceOnline', 'DeviceOffline');
ALTER TYPE "ScenarioConditionType" RENAME TO "ScenarioConditionType_old";
ALTER TYPE "ScenarioConditionType_new" RENAME TO "ScenarioConditionType";
DROP TYPE "ScenarioConditionType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ScenarioTriggerType_new" AS ENUM ('Schedule', 'DeviceOnline', 'DeviceOffline', 'AliceCommand', 'TelegramCommand');
ALTER TABLE "scenario_trigger" ALTER COLUMN "type" TYPE "ScenarioTriggerType_new" USING ("type"::text::"ScenarioTriggerType_new");
ALTER TYPE "ScenarioTriggerType" RENAME TO "ScenarioTriggerType_old";
ALTER TYPE "ScenarioTriggerType_new" RENAME TO "ScenarioTriggerType";
DROP TYPE "ScenarioTriggerType_old";
COMMIT;
