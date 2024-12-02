/*
  Warnings:

  - The values [AliceCommand] on the enum `ScenarioTriggerType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ScenarioTriggerType_new" AS ENUM ('Schedule', 'EmptyHome', 'NonEmptyHome', 'DeviceOnline', 'DeviceOffline', 'DevicePowerOn', 'DevicePowerOff', 'TelegramCommand');
ALTER TABLE "scenario_trigger" ALTER COLUMN "type" TYPE "ScenarioTriggerType_new" USING ("type"::text::"ScenarioTriggerType_new");
ALTER TYPE "ScenarioTriggerType" RENAME TO "ScenarioTriggerType_old";
ALTER TYPE "ScenarioTriggerType_new" RENAME TO "ScenarioTriggerType";
DROP TYPE "ScenarioTriggerType_old";
COMMIT;
