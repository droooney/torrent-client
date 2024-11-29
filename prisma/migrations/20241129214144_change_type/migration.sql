/*
  Warnings:

  - Changed the type of `type` on the `scenario_step_condition` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "scenario_step_condition" DROP COLUMN "type",
ADD COLUMN     "type" "ScenarioConditionType" NOT NULL;
