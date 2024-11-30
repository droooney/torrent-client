-- AlterEnum
ALTER TYPE "telegram_user_state" ADD VALUE 'AddDeviceSetUsedForAtHomeDetection';

-- AlterTable
ALTER TABLE "device" ADD COLUMN     "usedForAtHomeDetection" BOOLEAN NOT NULL DEFAULT false;
