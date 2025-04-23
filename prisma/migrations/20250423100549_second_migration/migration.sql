/*
  Warnings:

  - You are about to drop the column `replacement` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `replacement` on the `Fiche` table. All the data in the column will be lost.
  - Added the required column `path` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Made the column `type` on table `Document` required. This step will fail if there are existing NULL values in that column.
  - Made the column `ficheId` on table `Document` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `path` to the `Fiche` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Document" DROP COLUMN "replacement",
ADD COLUMN     "path" TEXT NOT NULL,
ADD COLUMN     "rpPath" TEXT,
ALTER COLUMN "type" SET NOT NULL,
ALTER COLUMN "ficheId" SET NOT NULL;

-- AlterTable
ALTER TABLE "FailedFiche" ALTER COLUMN "message" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Fiche" DROP COLUMN "replacement",
ADD COLUMN     "path" TEXT NOT NULL,
ALTER COLUMN "dateGenerate" SET DEFAULT CURRENT_TIMESTAMP;
