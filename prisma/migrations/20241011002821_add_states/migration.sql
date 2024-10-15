-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "telegram_user_state" ADD VALUE 'AddScenarioStepSetName';
ALTER TYPE "telegram_user_state" ADD VALUE 'AddScenarioStepSetType';
ALTER TYPE "telegram_user_state" ADD VALUE 'AddScenarioStepSetScenario';
ALTER TYPE "telegram_user_state" ADD VALUE 'AddScenarioStepSetDevice';
ALTER TYPE "telegram_user_state" ADD VALUE 'AddScenarioStepSetWaitPeriod';
