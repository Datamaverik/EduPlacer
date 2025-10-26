-- CreateEnum
CREATE TYPE "Role" AS ENUM ('MENTOR', 'MENTEE');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Domain" AS ENUM ('SOFTWARE', 'MANAGEMENT', 'MARKETING', 'ANALYST', 'OTHER');

-- CreateEnum
CREATE TYPE "Branch" AS ENUM ('CSE', 'ECE', 'ICE', 'MME', 'EEE', 'OTHER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "branch" "Branch",
ADD COLUMN     "companies" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "companiesInterested" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "domain" "Domain",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'MENTEE',
ADD COLUMN     "yearOfStudy" INTEGER;

-- CreateTable
CREATE TABLE "FollowRequest" (
    "id" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "menteeId" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FollowRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FollowRequest_mentorId_menteeId_key" ON "FollowRequest"("mentorId", "menteeId");

-- AddForeignKey
ALTER TABLE "FollowRequest" ADD CONSTRAINT "FollowRequest_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowRequest" ADD CONSTRAINT "FollowRequest_menteeId_fkey" FOREIGN KEY ("menteeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
