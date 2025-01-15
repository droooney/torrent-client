/*
  Warnings:

  - The values [WriteTelegramMessage] on the enum `scenario_step_type` will be removed. If these variants are still used in the database, this will fail.
  - The values [AddScenarioStepSetTelegramTargetUserId,AddScenarioStepSetTelegramMessage] on the enum `telegram_user_state` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "scenario_step_type_new" AS ENUM ('RunScenario', 'Wait', 'TurnOnDevice', 'TurnOffDevice', 'ToggleDevice');
ALTER TABLE "scenario_step" ALTER COLUMN "type" TYPE "scenario_step_type_new" USING ("type"::text::"scenario_step_type_new");
ALTER TYPE "scenario_step_type" RENAME TO "scenario_step_type_old";
ALTER TYPE "scenario_step_type_new" RENAME TO "scenario_step_type";
DROP TYPE "scenario_step_type_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "telegram_user_state_new" AS ENUM ('First', 'Waiting', 'AddScenarioSetName', 'EditScenarioName', 'AddScenarioStepSetName', 'AddScenarioStepSetType', 'AddScenarioStepSetScenario', 'AddScenarioStepSetDevice', 'AddScenarioStepSetWaitPeriod', 'AddDeviceSetName', 'AddDeviceSetType', 'AddDeviceSetManufacturer', 'AddDeviceSetMac', 'AddDeviceSetAddress', 'AddDeviceSetUsedForAtHomeDetection', 'AddDeviceEnterMatterPairingCode', 'EditDeviceName', 'EditDeviceMac', 'EditDeviceAddress', 'SearchRutracker', 'AddTorrent', 'SetDownloadLimit', 'SetUploadLimit');
ALTER TABLE "telegram_user_data" ALTER COLUMN "state" TYPE "telegram_user_state_new" USING ("state"::text::"telegram_user_state_new");
ALTER TYPE "telegram_user_state" RENAME TO "telegram_user_state_old";
ALTER TYPE "telegram_user_state_new" RENAME TO "telegram_user_state";
DROP TYPE "telegram_user_state_old";
COMMIT;
