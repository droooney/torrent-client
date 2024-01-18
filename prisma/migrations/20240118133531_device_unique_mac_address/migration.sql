/*
  Warnings:

  - A unique constraint covering the columns `[mac]` on the table `device` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[address]` on the table `device` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "device_mac_key" ON "device"("mac");

-- CreateIndex
CREATE UNIQUE INDEX "device_address_key" ON "device"("address");
