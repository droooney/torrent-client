/*
  Warnings:

  - Added the required column `size` to the `torrent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `size` to the `torrent_file` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "torrent" ADD COLUMN     "size" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "torrent_file" ADD COLUMN     "size" BIGINT NOT NULL;
