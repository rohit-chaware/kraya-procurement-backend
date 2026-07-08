-- AlterTable
ALTER TABLE "items" ADD COLUMN "is_locked" BOOLEAN NOT NULL DEFAULT false;

-- Backfill lock status for items already used in Indent, MI, or RFQ
UPDATE "items"
SET "is_locked" = true
WHERE "id" IN (
    SELECT DISTINCT "item_id" FROM "indent_items"
    UNION
    SELECT DISTINCT "item_id" FROM "mi_items"
    UNION
    SELECT DISTINCT "item_id" FROM "rfq_items"
);
