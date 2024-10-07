-- CreateEnum
CREATE TYPE "device_manufacturer" AS ENUM ('Haier', 'Yeelight', 'Other');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "device_type" ADD VALUE 'Lightbulb';
ALTER TYPE "device_type" ADD VALUE 'Other';

-- AlterTable
ALTER TABLE "device" ADD COLUMN     "manufacturter" "device_manufacturer" NOT NULL DEFAULT 'Other';
