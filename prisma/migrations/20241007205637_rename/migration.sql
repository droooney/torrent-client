/*
  Warnings:

  - You are about to drop the column `manufacturter` on the `device` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "device" RENAME COLUMN "manufacturter" TO "manufacturer";
