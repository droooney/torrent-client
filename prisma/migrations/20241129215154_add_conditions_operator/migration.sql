-- CreateEnum
CREATE TYPE "LogicalOperator" AS ENUM ('And', 'Or');

-- AlterTable
ALTER TABLE "scenario" ADD COLUMN     "conditionsOperator" "LogicalOperator" NOT NULL DEFAULT 'And';

-- AlterTable
ALTER TABLE "scenario_step" ADD COLUMN     "conditionsOperator" "LogicalOperator" NOT NULL DEFAULT 'And';
