/*
  Warnings:

  - You are about to drop the column `torrent_path` on the `torrent` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "torrent" DROP COLUMN "torrent_path",
ADD COLUMN     "torrent_file" BYTEA;
