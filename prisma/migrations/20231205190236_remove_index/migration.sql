/*
  Warnings:

  - A unique constraint covering the columns `[path]` on the table `torrent_file` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "torrent_file_torrent_id_path_key";

-- CreateIndex
CREATE UNIQUE INDEX "torrent_file_path_key" ON "torrent_file"("path");
