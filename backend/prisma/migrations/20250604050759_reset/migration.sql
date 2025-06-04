-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "corsOrigins" TEXT[],
ADD COLUMN     "grantTypes" TEXT[],
ADD COLUMN     "tokenSigningAlgorithm" TEXT;

-- CreateTable
CREATE TABLE "ApiMetrics" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "status" INTEGER NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiMetrics_pkey" PRIMARY KEY ("id")
);
