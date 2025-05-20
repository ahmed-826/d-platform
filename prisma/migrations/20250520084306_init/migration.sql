-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('superAdmin', 'admin', 'user');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'banned', 'deleted');

-- CreateEnum
CREATE TYPE "UploadType" AS ENUM ('form', 'file', 'api');

-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('pending', 'processing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "NerCategory" AS ENUM ('person', 'organization', 'location');

-- CreateEnum
CREATE TYPE "FicheStatus" AS ENUM ('valid', 'suspended', 'canceled');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('File', 'Message', 'Attachment');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'active',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Upload" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "UploadType" NOT NULL DEFAULT 'api',
    "status" "UploadStatus" NOT NULL DEFAULT 'pending',
    "path" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "Upload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ner" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" "NerCategory" NOT NULL,
    "description" TEXT,

    CONSTRAINT "Ner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fiche" (
    "id" UUID NOT NULL,
    "ref" TEXT NOT NULL,
    "sourceId" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "object" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "createdBy" TEXT,
    "dateDistribute" TIMESTAMP(3),
    "path" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "status" "FicheStatus" NOT NULL DEFAULT 'suspended',
    "dump" TEXT,
    "uploadId" UUID NOT NULL,

    CONSTRAINT "Fiche_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FicheNer" (
    "id" UUID NOT NULL,
    "ficheId" UUID NOT NULL,
    "nerId" UUID NOT NULL,
    "description" TEXT,

    CONSTRAINT "FicheNer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" UUID NOT NULL,
    "type" "DocumentType" NOT NULL,
    "content" TEXT,
    "meta" JSONB,
    "path" TEXT NOT NULL,
    "sourcePath" TEXT,
    "reportingPath" TEXT,
    "hash" TEXT NOT NULL,
    "ficheId" UUID,
    "emailId" UUID,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FailedFiche" (
    "id" UUID NOT NULL,
    "date" TIMESTAMP(3),
    "dump" TEXT,
    "uploadId" UUID NOT NULL,
    "path" TEXT,
    "fileName" TEXT,
    "message" TEXT,

    CONSTRAINT "FailedFiche_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_FicheObservations" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_FicheObservations_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Upload_hash_key" ON "Upload"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "Source_name_key" ON "Source"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Fiche_path_key" ON "Fiche"("path");

-- CreateIndex
CREATE UNIQUE INDEX "Fiche_hash_key" ON "Fiche"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "FicheNer_ficheId_nerId_key" ON "FicheNer"("ficheId", "nerId");

-- CreateIndex
CREATE UNIQUE INDEX "Document_path_key" ON "Document"("path");

-- CreateIndex
CREATE UNIQUE INDEX "Document_sourcePath_key" ON "Document"("sourcePath");

-- CreateIndex
CREATE UNIQUE INDEX "Document_hash_key" ON "Document"("hash");

-- CreateIndex
CREATE INDEX "_FicheObservations_B_index" ON "_FicheObservations"("B");

-- AddForeignKey
ALTER TABLE "Upload" ADD CONSTRAINT "Upload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fiche" ADD CONSTRAINT "Fiche_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fiche" ADD CONSTRAINT "Fiche_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "Upload"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FicheNer" ADD CONSTRAINT "FicheNer_ficheId_fkey" FOREIGN KEY ("ficheId") REFERENCES "Fiche"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FicheNer" ADD CONSTRAINT "FicheNer_nerId_fkey" FOREIGN KEY ("nerId") REFERENCES "Ner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_ficheId_fkey" FOREIGN KEY ("ficheId") REFERENCES "Fiche"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FailedFiche" ADD CONSTRAINT "FailedFiche_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "Upload"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FicheObservations" ADD CONSTRAINT "_FicheObservations_A_fkey" FOREIGN KEY ("A") REFERENCES "Fiche"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FicheObservations" ADD CONSTRAINT "_FicheObservations_B_fkey" FOREIGN KEY ("B") REFERENCES "Fiche"("id") ON DELETE CASCADE ON UPDATE CASCADE;
