-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ScenarioConditionType" ADD VALUE 'Time';
ALTER TYPE "ScenarioConditionType" ADD VALUE 'EmptyHome';
ALTER TYPE "ScenarioConditionType" ADD VALUE 'NonEmptyHome';
ALTER TYPE "ScenarioConditionType" ADD VALUE 'DevicePowerOn';
ALTER TYPE "ScenarioConditionType" ADD VALUE 'DevicePowerOff';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ScenarioTriggerType" ADD VALUE 'EmptyHome';
ALTER TYPE "ScenarioTriggerType" ADD VALUE 'NonEmptyHome';
