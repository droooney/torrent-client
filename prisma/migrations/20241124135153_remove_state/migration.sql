/*
  Warnings:

  - The values [AddDeviceSetMatterSupport] on the enum `telegram_user_state` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "telegram_user_state_new" AS ENUM ('First', 'Waiting', 'AddScenarioSetName', 'EditScenarioName', 'AddScenarioStepSetName', 'AddScenarioStepSetType', 'AddScenarioStepSetScenario', 'AddScenarioStepSetDevice', 'AddScenarioStepSetWaitPeriod', 'AddDeviceSetName', 'AddDeviceSetType', 'AddDeviceSetManufacturer', 'AddDeviceSetMac', 'AddDeviceSetAddress', 'AddDeviceEnterMatterPairingCode', 'EditDeviceName', 'EditDeviceMac', 'EditDeviceAddress', 'SearchRutracker', 'AddTorrent', 'SetDownloadLimit', 'SetUploadLimit');
ALTER TABLE "telegram_user_data" ALTER COLUMN "state" TYPE "telegram_user_state_new" USING ("state"::text::"telegram_user_state_new");
ALTER TYPE "telegram_user_state" RENAME TO "telegram_user_state_old";
ALTER TYPE "telegram_user_state_new" RENAME TO "telegram_user_state";
DROP TYPE "telegram_user_state_old";
COMMIT;
