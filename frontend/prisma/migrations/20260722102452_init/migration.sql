-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'admin', 'officer');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'other');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('draft', 'submitted', 'under_automated_verification', 'under_officer_review', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "Recommendation" AS ENUM ('auto_approve', 'standard_flow', 'enhanced_verification', 'manual_review', 'reject');

-- CreateEnum
CREATE TYPE "AiDecision" AS ENUM ('APPROVED', 'REJECTED', 'REVIEW_REQUIRED', 'PENDING');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'user',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'draft',
    "resetPasswordToken" TEXT,
    "resetPasswordExpire" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "documentIdNumber" TEXT,
    "aadhaarCardImage" JSONB,
    "panCardImage" JSONB,
    "biometricSelfies" JSONB,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "taluka" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "behaviorSummary" JSONB,
    "aiVerificationResults" JSONB,
    "isHighRisk" BOOLEAN NOT NULL DEFAULT false,
    "status" "VerificationStatus" NOT NULL DEFAULT 'draft',
    "statusHistory" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "reviewedById" TEXT,
    "reviewedByName" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_results" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "verificationId" TEXT NOT NULL,
    "sessionId" TEXT,
    "faceVerification" JSONB,
    "panCardOCR" JSONB,
    "aadhaarCardOCR" JSONB,
    "manipulationDetection" JSONB,
    "processingTime" JSONB,
    "errors" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "totalScore" INTEGER,
    "passedChecks" INTEGER NOT NULL DEFAULT 0,
    "failedChecks" INTEGER NOT NULL DEFAULT 0,
    "reviewRequiredChecks" INTEGER NOT NULL DEFAULT 0,
    "finalDecision" "AiDecision" NOT NULL DEFAULT 'PENDING',
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'medium',
    "confidence" DOUBLE PRECISION,
    "summary" TEXT,
    "issues" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "recommendations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isHighRisk" BOOLEAN NOT NULL DEFAULT false,
    "status" "VerificationStatus" NOT NULL DEFAULT 'draft',
    "processedBy" TEXT NOT NULL DEFAULT 'automated_system',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "behavioral_analyses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "verificationId" TEXT NOT NULL,
    "overallTrustScore" INTEGER NOT NULL DEFAULT 50,
    "botLikelihood" INTEGER NOT NULL DEFAULT 50,
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'medium',
    "recommendation" "Recommendation" NOT NULL DEFAULT 'standard_flow',
    "isHuman" BOOLEAN NOT NULL DEFAULT true,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "flagsDetected" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "flagCount" INTEGER NOT NULL DEFAULT 0,
    "componentScores" JSONB,
    "keystrokeAnalysis" JSONB,
    "mouseAnalysis" JSONB,
    "pasteAnalysis" JSONB,
    "speedAnalysis" JSONB,
    "rawMetrics" JSONB,
    "sessionInfo" JSONB,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "behavioral_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "verifications_userId_status_idx" ON "verifications"("userId", "status");

-- CreateIndex
CREATE INDEX "verifications_status_idx" ON "verifications"("status");

-- CreateIndex
CREATE UNIQUE INDEX "verification_results_verificationId_key" ON "verification_results"("verificationId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_results_sessionId_key" ON "verification_results"("sessionId");

-- CreateIndex
CREATE INDEX "verification_results_finalDecision_idx" ON "verification_results"("finalDecision");

-- CreateIndex
CREATE INDEX "verification_results_riskLevel_idx" ON "verification_results"("riskLevel");

-- CreateIndex
CREATE INDEX "verification_results_isHighRisk_idx" ON "verification_results"("isHighRisk");

-- CreateIndex
CREATE UNIQUE INDEX "behavioral_analyses_verificationId_key" ON "behavioral_analyses"("verificationId");

-- CreateIndex
CREATE INDEX "behavioral_analyses_botLikelihood_idx" ON "behavioral_analyses"("botLikelihood");

-- CreateIndex
CREATE INDEX "behavioral_analyses_riskLevel_idx" ON "behavioral_analyses"("riskLevel");

-- AddForeignKey
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_results" ADD CONSTRAINT "verification_results_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "verifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_results" ADD CONSTRAINT "verification_results_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "behavioral_analyses" ADD CONSTRAINT "behavioral_analyses_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "verifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
