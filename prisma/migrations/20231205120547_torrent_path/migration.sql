/*
  Warnings:

  - You are about to drop the column `download_path` on the `torrent` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "torrent" DROP COLUMN "download_path",
ADD COLUMN     "path" TEXT;
