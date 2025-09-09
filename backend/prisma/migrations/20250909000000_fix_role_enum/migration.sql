-- Fix Role enum to match Prisma schema (ADMIN, MANAGER, MEMBER)
-- Replace existing enum values and default, mapping DEVELOPER -> MEMBER
BEGIN;

-- Create new enum with correct values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'Role_new' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE "public"."Role_new" AS ENUM ('ADMIN','MANAGER','MEMBER');
  END IF;
END$$;

-- Drop default to allow type change
ALTER TABLE "public"."users" ALTER COLUMN "role" DROP DEFAULT;

-- Change column type, remapping values where needed
ALTER TABLE "public"."users" 
  ALTER COLUMN "role" TYPE "public"."Role_new" 
  USING (
    CASE "role"
      WHEN 'DEVELOPER'::"public"."Role" THEN 'MEMBER'::"public"."Role_new"
      WHEN 'ADMIN'::"public"."Role" THEN 'ADMIN'::"public"."Role_new"
      WHEN 'MANAGER'::"public"."Role" THEN 'MANAGER'::"public"."Role_new"
      ELSE 'MEMBER'::"public"."Role_new"
    END
  );

-- Drop old enum and rename new one
DROP TYPE "public"."Role";
ALTER TYPE "public"."Role_new" RENAME TO "Role";

-- Set correct default
ALTER TABLE "public"."users" ALTER COLUMN "role" SET DEFAULT 'MEMBER';

COMMIT;

