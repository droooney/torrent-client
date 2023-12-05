/*
  Warnings:

  - Added the required column `state` to the `torrent_file` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TorrentFileState" AS ENUM ('Progress', 'Finished');

-- AlterTable
ALTER TABLE "torrent_file" ADD COLUMN     "state" "TorrentFileState" NOT NULL;
