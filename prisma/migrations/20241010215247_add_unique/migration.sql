/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `scenario` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[scenario_id,name]` on the table `scenario_condition` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[scenario_id,name]` on the table `scenario_step` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[step_id,name]` on the table `scenario_step_condition` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[scenario_id,name]` on the table `scenario_trigger` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "telegram_user_state" ADD VALUE 'AddScenarioSetName';

-- CreateIndex
CREATE UNIQUE INDEX "scenario_name_key" ON "scenario"("name");

-- CreateIndex
CREATE UNIQUE INDEX "scenario_condition_scenario_id_name_key" ON "scenario_condition"("scenario_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "scenario_step_scenario_id_name_key" ON "scenario_step"("scenario_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "scenario_step_condition_step_id_name_key" ON "scenario_step_condition"("step_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "scenario_trigger_scenario_id_name_key" ON "scenario_trigger"("scenario_id", "name");
