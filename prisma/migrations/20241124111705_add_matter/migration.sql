-- AlterEnum
ALTER TYPE "device_manufacturer" ADD VALUE 'Yandex';

-- AlterEnum
ALTER TYPE "device_type" ADD VALUE 'Socket';

-- AlterTable
ALTER TABLE "device" ADD COLUMN     "matterNodeId" BIGINT;
