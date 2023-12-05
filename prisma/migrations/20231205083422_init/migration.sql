-- CreateEnum
CREATE TYPE "torrent_state" AS ENUM ('Pending', 'Downloading', 'Paused', 'Finished');

-- CreateEnum
CREATE TYPE "telegram_user_state" AS ENUM ('First', 'Waiting', 'AddTorrent');

-- CreateTable
CREATE TABLE "torrent" (
    "info_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" "torrent_state" NOT NULL,
    "progress" DOUBLE PRECISION NOT NULL,
    "magnet_uri" TEXT,
    "torrent_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "torrent_client_state" (
    "id" TEXT NOT NULL,
    "paused" BOOLEAN NOT NULL,
    "critical_torrent_id" TEXT,
    "download_speed_limit" DOUBLE PRECISION,
    "upload_speed_limit" DOUBLE PRECISION
);

-- CreateTable
CREATE TABLE "telegram_user_data" (
    "user_id" INTEGER NOT NULL,
    "state" "telegram_user_state" NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "torrent_info_hash_key" ON "torrent"("info_hash");

-- CreateIndex
CREATE UNIQUE INDEX "torrent_client_state_id_key" ON "torrent_client_state"("id");

-- CreateIndex
CREATE UNIQUE INDEX "torrent_client_state_critical_torrent_id_key" ON "torrent_client_state"("critical_torrent_id");

-- CreateIndex
CREATE UNIQUE INDEX "telegram_user_data_user_id_key" ON "telegram_user_data"("user_id");

-- AddForeignKey
ALTER TABLE "torrent_client_state" ADD CONSTRAINT "torrent_client_state_critical_torrent_id_fkey" FOREIGN KEY ("critical_torrent_id") REFERENCES "torrent"("info_hash") ON DELETE SET NULL ON UPDATE CASCADE;
