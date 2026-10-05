-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'GUIDE', 'ADMIN');
CREATE TYPE "ContentStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED', 'INACTIVE', 'EXPIRED');
CREATE TYPE "TripStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED', 'INACTIVE');
CREATE TYPE "MinyanType" AS ENUM ('ONE_TIME', 'RECURRING');
CREATE TYPE "PrayerType" AS ENUM ('SHACHARIT', 'MINCHA', 'MAARIV', 'MUSAF', 'OTHER');
CREATE TYPE "LocationType" AS ENUM ('SYNAGOGUE', 'CHABAD', 'BOTH');
CREATE TYPE "RecommendationType" AS ENUM ('ATTRACTION', 'RESTAURANT', 'NATURE', 'SHOPPING', 'CHILDREN', 'JEWISH', 'OTHER');
CREATE TYPE "AccommodationType" AS ENUM ('HOTEL', 'HOSTEL', 'APARTMENT', 'GUESTHOUSE', 'OTHER');
CREATE TYPE "ReportEntityType" AS ENUM ('MINYAN', 'JEWISH_LOCATION', 'KOSHER_PRODUCT', 'TRIP', 'TRIP_RECOMMENDATION', 'ACCOMMODATION', 'USER');
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'REVIEWED', 'RESOLVED', 'REJECTED');

-- CreateTable User
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "passwordHash" TEXT,
    "image" TEXT,
    "imageUrl" TEXT,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key"
    ON "User"("email");

-- CreateTable Account
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Account_provider_providerAccountId_key"
    ON "Account"("provider", "providerAccountId");

-- CreateTable Session
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Session_sessionToken_key"
    ON "Session"("sessionToken");

-- CreateTable VerificationToken
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX "VerificationToken_token_key"
    ON "VerificationToken"("token");

CREATE UNIQUE INDEX "VerificationToken_identifier_token_key"
    ON "VerificationToken"("identifier", "token");

-- CreateTable Country
CREATE TABLE "Country" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Country_code_key"
    ON "Country"("code");

CREATE INDEX "Country_name_idx"
    ON "Country"("name");

-- CreateTable City
CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "City_countryId_name_key"
    ON "City"("countryId", "name");

CREATE INDEX "City_countryId_name_idx"
    ON "City"("countryId", "name");

-- CreateTable Minyan
CREATE TABLE "Minyan" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "prayerType" "PrayerType" NOT NULL,
    "type" "MinyanType" NOT NULL,
    "startDateTime" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "recurrenceRule" TEXT,
    "time" TEXT,
    "countryId" TEXT,
    "cityId" TEXT,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "description" TEXT,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "createdById" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Minyan_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Minyan_status_expiresAt_idx"
    ON "Minyan"("status", "expiresAt");

CREATE INDEX "Minyan_countryId_cityId_idx"
    ON "Minyan"("countryId", "cityId");

-- CreateTable MinyanParticipant
CREATE TABLE "MinyanParticipant" (
    "id" TEXT NOT NULL,
    "minyanId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MinyanParticipant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MinyanParticipant_minyanId_userId_key"
    ON "MinyanParticipant"("minyanId", "userId");

-- CreateTable JewishLocation
CREATE TABLE "JewishLocation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "LocationType" NOT NULL,
    "countryId" TEXT,
    "cityId" TEXT,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "createdById" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "JewishLocation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "JewishLocation_status_createdAt_idx"
    ON "JewishLocation"("status", "createdAt");

-- CreateTable KosherProduct
CREATE TABLE "KosherProduct" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "category" TEXT,
    "countryId" TEXT,
    "cityId" TEXT,
    "description" TEXT,
    "kosherInfo" TEXT,
    "imageUrl" TEXT,
    "createdById" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "KosherProduct_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "KosherProduct_status_createdAt_idx"
    ON "KosherProduct"("status", "createdAt");

-- CreateTable GuideProfile
CREATE TABLE "GuideProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "bio" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "languages" TEXT[],
    "imageUrl" TEXT,
    "yearsExperience" INTEGER,
    "status" "ContentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GuideProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GuideProfile_userId_key"
    ON "GuideProfile"("userId");

CREATE INDEX "GuideProfile_status_createdAt_idx"
    ON "GuideProfile"("status", "createdAt");

-- CreateTable Trip
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "countryId" TEXT,
    "cityId" TEXT,
    "imageUrl" TEXT,
    "status" "TripStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Trip_status_createdAt_idx"
    ON "Trip"("status", "createdAt");

-- CreateTable TripRecommendation
CREATE TABLE "TripRecommendation" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "RecommendationType" NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "imageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TripRecommendation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TripRecommendation_tripId_sortOrder_idx"
    ON "TripRecommendation"("tripId", "sortOrder");

CREATE INDEX "TripRecommendation_status_createdAt_idx"
    ON "TripRecommendation"("status", "createdAt");

-- CreateTable Accommodation
CREATE TABLE "Accommodation" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccommodationType" NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "website" TEXT,
    "phone" TEXT,
    "imageUrl" TEXT,
    "createdById" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Accommodation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Accommodation_tripId_status_idx"
    ON "Accommodation"("tripId", "status");

-- CreateTable Report
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "entityType" "ReportEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Report_entityType_entityId_idx"
    ON "Report"("entityType", "entityId");

CREATE INDEX "Report_status_createdAt_idx"
    ON "Report"("status", "createdAt");

-- CreateTable AuditLog
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_userId_createdAt_idx"
    ON "AuditLog"("userId", "createdAt");

CREATE INDEX "AuditLog_entityType_entityId_idx"
    ON "AuditLog"("entityType", "entityId");

-- Foreign keys
ALTER TABLE "Account"
    ADD CONSTRAINT "Account_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Session"
    ADD CONSTRAINT "Session_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "City"
    ADD CONSTRAINT "City_countryId_fkey"
    FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Minyan"
    ADD CONSTRAINT "Minyan_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Minyan"
    ADD CONSTRAINT "Minyan_countryId_fkey"
    FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Minyan"
    ADD CONSTRAINT "Minyan_cityId_fkey"
    FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MinyanParticipant"
    ADD CONSTRAINT "MinyanParticipant_minyanId_fkey"
    FOREIGN KEY ("minyanId") REFERENCES "Minyan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MinyanParticipant"
    ADD CONSTRAINT "MinyanParticipant_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "JewishLocation"
    ADD CONSTRAINT "JewishLocation_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "JewishLocation"
    ADD CONSTRAINT "JewishLocation_countryId_fkey"
    FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "JewishLocation"
    ADD CONSTRAINT "JewishLocation_cityId_fkey"
    FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "KosherProduct"
    ADD CONSTRAINT "KosherProduct_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "KosherProduct"
    ADD CONSTRAINT "KosherProduct_countryId_fkey"
    FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "KosherProduct"
    ADD CONSTRAINT "KosherProduct_cityId_fkey"
    FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "GuideProfile"
    ADD CONSTRAINT "GuideProfile_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Trip"
    ADD CONSTRAINT "Trip_guideId_fkey"
    FOREIGN KEY ("guideId") REFERENCES "GuideProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Trip"
    ADD CONSTRAINT "Trip_countryId_fkey"
    FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Trip"
    ADD CONSTRAINT "Trip_cityId_fkey"
    FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TripRecommendation"
    ADD CONSTRAINT "TripRecommendation_tripId_fkey"
    FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Accommodation"
    ADD CONSTRAINT "Accommodation_tripId_fkey"
    FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Accommodation"
    ADD CONSTRAINT "Accommodation_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Report"
    ADD CONSTRAINT "Report_reporterId_fkey"
    FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Report"
    ADD CONSTRAINT "Report_resolvedById_fkey"
    FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AuditLog"
    ADD CONSTRAINT "AuditLog_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
