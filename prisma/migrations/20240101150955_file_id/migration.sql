-- AlterTable
ALTER TABLE "torrent_file" ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "torrent_file_pkey" PRIMARY KEY ("id");
