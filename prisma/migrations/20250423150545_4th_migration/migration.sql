/*
  Warnings:

  - Added the required column `extension` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `extension` to the `Fiche` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Fiche` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Upload` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "extension" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Fiche" ADD COLUMN     "extension" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Upload" ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "name" TEXT NOT NULL;
