/*
  Warnings:

  - You are about to drop the column `credits` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "credits";

-- CreateTable
CREATE TABLE "Logs" (
    "LogID" TEXT NOT NULL,
    "userID" TEXT NOT NULL,
    "leadsRequested" INTEGER NOT NULL,
    "leadsEnriched" INTEGER NOT NULL,
    "apolloLink" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "creditsUsed" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "status" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Logs_pkey" PRIMARY KEY ("LogID")
);

-- CreateTable
CREATE TABLE "ApiKeys" (
    "apiKeyID" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "userID" TEXT NOT NULL,

    CONSTRAINT "ApiKeys_pkey" PRIMARY KEY ("apiKeyID")
);

-- CreateTable
CREATE TABLE "Admin" (
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("email")
);

-- CreateIndex
CREATE UNIQUE INDEX "Logs_LogID_key" ON "Logs"("LogID");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKeys_apiKeyID_key" ON "ApiKeys"("apiKeyID");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKeys_userID_key" ON "ApiKeys"("userID");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- AddForeignKey
ALTER TABLE "Logs" ADD CONSTRAINT "Logs_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("UserID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKeys" ADD CONSTRAINT "ApiKeys_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("UserID") ON DELETE RESTRICT ON UPDATE CASCADE;
