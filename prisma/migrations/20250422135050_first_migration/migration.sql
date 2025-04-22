-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPERADMIN', 'ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'BANNED', 'DELETED');

-- CreateEnum
CREATE TYPE "UploadType" AS ENUM ('FORM', 'FILE', 'API');

-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "NerCategory" AS ENUM ('PERSON', 'ORGANIZATION', 'LOCATION');

-- CreateEnum
CREATE TYPE "FicheStatus" AS ENUM ('VALID', 'SUSPENDED', 'CANCELED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('FILE', 'EMAIL', 'ATTACHMENT');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Upload" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "UploadType" NOT NULL DEFAULT 'API',
    "status" "UploadStatus" NOT NULL DEFAULT 'PENDING',
    "path" TEXT,
    "hash" TEXT NOT NULL,
    "fileName" TEXT,
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
CREATE TABLE "Dump" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "dateCollect" TIMESTAMP(3),
    "description" TEXT,
    "sourceId" UUID NOT NULL,

    CONSTRAINT "Dump_pkey" PRIMARY KEY ("id")
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
    "object" TEXT,
    "summary" TEXT,
    "dateGenerate" TIMESTAMP(3) NOT NULL,
    "dateDistribute" TIMESTAMP(3),
    "status" "FicheStatus" NOT NULL DEFAULT 'SUSPENDED',
    "name" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "replacement" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "dumpId" UUID NOT NULL,
    "uploadId" UUID NOT NULL,

    CONSTRAINT "Fiche_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FicheRelation" (
    "id" UUID NOT NULL,
    "observerId" UUID NOT NULL,
    "observedId" UUID NOT NULL,

    CONSTRAINT "FicheRelation_pkey" PRIMARY KEY ("id")
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
    "name" TEXT NOT NULL,
    "type" "DocumentType",
    "content" TEXT,
    "meta" JSONB,
    "extension" TEXT NOT NULL,
    "replacement" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "ficheId" UUID,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FailedFiche" (
    "id" UUID NOT NULL,
    "dateGenerate" TIMESTAMP(3),
    "dumpId" UUID,
    "uploadId" UUID NOT NULL,
    "path" TEXT,
    "message" TEXT NOT NULL,

    CONSTRAINT "FailedFiche_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Upload_hash_key" ON "Upload"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "Source_name_key" ON "Source"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Dump_name_key" ON "Dump"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Fiche_hash_key" ON "Fiche"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "FicheRelation_observerId_observedId_key" ON "FicheRelation"("observerId", "observedId");

-- CreateIndex
CREATE UNIQUE INDEX "FicheNer_ficheId_nerId_key" ON "FicheNer"("ficheId", "nerId");

-- CreateIndex
CREATE UNIQUE INDEX "Document_hash_key" ON "Document"("hash");

-- AddForeignKey
ALTER TABLE "Upload" ADD CONSTRAINT "Upload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dump" ADD CONSTRAINT "Dump_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fiche" ADD CONSTRAINT "Fiche_dumpId_fkey" FOREIGN KEY ("dumpId") REFERENCES "Dump"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fiche" ADD CONSTRAINT "Fiche_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "Upload"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FicheRelation" ADD CONSTRAINT "FicheRelation_observerId_fkey" FOREIGN KEY ("observerId") REFERENCES "Fiche"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FicheRelation" ADD CONSTRAINT "FicheRelation_observedId_fkey" FOREIGN KEY ("observedId") REFERENCES "Fiche"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FicheNer" ADD CONSTRAINT "FicheNer_ficheId_fkey" FOREIGN KEY ("ficheId") REFERENCES "Fiche"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FicheNer" ADD CONSTRAINT "FicheNer_nerId_fkey" FOREIGN KEY ("nerId") REFERENCES "Ner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_ficheId_fkey" FOREIGN KEY ("ficheId") REFERENCES "Fiche"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FailedFiche" ADD CONSTRAINT "FailedFiche_dumpId_fkey" FOREIGN KEY ("dumpId") REFERENCES "Dump"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FailedFiche" ADD CONSTRAINT "FailedFiche_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "Upload"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
