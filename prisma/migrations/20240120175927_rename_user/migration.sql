-- AlterIndex
ALTER INDEX "telegram_user_data_user_id_key" RENAME TO "telegram_user_data_telegram_user_id_key";

-- AlterTable
ALTER TABLE "telegram_user_data" RENAME COLUMN "addDevicePayload" TO "add_device_payload";
ALTER TABLE "telegram_user_data" RENAME COLUMN "user_id" TO "telegram_user_id";
