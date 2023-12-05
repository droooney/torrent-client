/*
  Warnings:

  - The values [Pending] on the enum `torrent_state` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "torrent_state_new" AS ENUM ('Queued', 'Verifying', 'Downloading', 'Paused', 'Finished');
ALTER TABLE "torrent" ALTER COLUMN "state" TYPE "torrent_state_new" USING ("state"::text::"torrent_state_new");
ALTER TYPE "torrent_state" RENAME TO "torrent_state_old";
ALTER TYPE "torrent_state_new" RENAME TO "torrent_state";
DROP TYPE "torrent_state_old";
COMMIT;
