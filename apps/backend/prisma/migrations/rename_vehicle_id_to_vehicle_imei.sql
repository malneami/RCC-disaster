-- Rename vehicle_id column to vehicle_imei in ambulances table
ALTER TABLE "ambulances" RENAME COLUMN "vehicle_id" TO "vehicle_imei";

-- Update the unique constraint name
ALTER INDEX "ambulances_vehicle_id_key" RENAME TO "ambulances_vehicle_imei_key";

-- Update the index name
ALTER INDEX "ambulances_vehicle_id_idx" RENAME TO "ambulances_vehicle_imei_idx";
