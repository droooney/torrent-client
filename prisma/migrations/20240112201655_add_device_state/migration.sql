-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "telegram_user_state" ADD VALUE 'AddDeviceSetName';
ALTER TYPE "telegram_user_state" ADD VALUE 'AddDeviceSetMac';
ALTER TYPE "telegram_user_state" ADD VALUE 'AddDeviceSetAddress';

-- AlterTable
ALTER TABLE "telegram_user_data" ADD COLUMN     "addDevicePayload" JSONB;
