/*
  Warnings:

  - You are about to drop the column `extension` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `extension` on the `Fiche` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Fiche` table. All the data in the column will be lost.
  - You are about to drop the column `fileName` on the `Upload` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Upload` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Document" DROP COLUMN "extension",
DROP COLUMN "name";

-- AlterTable
ALTER TABLE "Fiche" DROP COLUMN "extension",
DROP COLUMN "name";

-- AlterTable
ALTER TABLE "Upload" DROP COLUMN "fileName",
DROP COLUMN "name";
