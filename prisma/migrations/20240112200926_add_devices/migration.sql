-- CreateTable
CREATE TABLE "device" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "mac" TEXT NOT NULL,
    "address" TEXT NOT NULL,

    CONSTRAINT "device_pkey" PRIMARY KEY ("id")
);
