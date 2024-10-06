-- CreateTable
CREATE TABLE "TelegramCallbackData" (
    "data_id" TEXT NOT NULL,
    "data" JSONB NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "TelegramCallbackData_data_id_key" ON "TelegramCallbackData"("data_id");
