/*
  Warnings:

  - Added the required column `type` to the `device` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "device_type" AS ENUM ('Tv');

-- AlterTable
ALTER TABLE "device" ADD COLUMN     "type" "device_type" NOT NULL;
