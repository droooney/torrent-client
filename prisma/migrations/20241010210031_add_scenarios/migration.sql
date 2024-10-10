-- CreateEnum
CREATE TYPE "ScenarioConditionType" AS ENUM ('EmptyHome', 'NonEmptyHome');

-- CreateEnum
CREATE TYPE "scenario_step_type" AS ENUM ('RunScenario', 'Wait', 'TurnOnDevice', 'TurnOffDevice');

-- CreateEnum
CREATE TYPE "ScenarioTriggerType" AS ENUM ('Schedule', 'EmptyHome', 'NonEmptyHome', 'AliceCommand');

-- CreateTable
CREATE TABLE "scenario_step_condition" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "step_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "payload" JSONB NOT NULL,
    "type" "scenario_step_type" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scenario_step_condition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenario_step" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "scenario_id" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "type" "scenario_step_type" NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scenario_step_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenario_trigger" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "scenario_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "type" "ScenarioTriggerType" NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scenario_trigger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenario_condition" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "scenario_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "payload" JSONB NOT NULL,
    "type" "scenario_step_type" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scenario_condition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenario" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scenario_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "scenario_step_condition" ADD CONSTRAINT "scenario_step_condition_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "scenario_step"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenario_step" ADD CONSTRAINT "scenario_step_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenario_trigger" ADD CONSTRAINT "scenario_trigger_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenario_condition" ADD CONSTRAINT "scenario_condition_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
