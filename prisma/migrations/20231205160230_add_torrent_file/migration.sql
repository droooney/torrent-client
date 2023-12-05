-- CreateTable
CREATE TABLE "torrent_file" (
    "torrent_id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "progress" DOUBLE PRECISION NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "torrent_file_torrent_id_path_key" ON "torrent_file"("torrent_id", "path");

-- AddForeignKey
ALTER TABLE "torrent_file" ADD CONSTRAINT "torrent_file_torrent_id_fkey" FOREIGN KEY ("torrent_id") REFERENCES "torrent"("info_hash") ON DELETE CASCADE ON UPDATE CASCADE;
