/**
 * Data migration.
 *
 * Moves records from the pre-rename `hydra_*` localStorage keys to their
 * `fursan_*` equivalents exactly once, and never overwrites data that already
 * exists under the new name.
 */

const MIGRATION_FLAG = "fursan_migration_v2_complete";

const KEY_MAPPINGS: { oldKey: string; newKey: string }[] = [
  { oldKey: "hydra_streak_data", newKey: "fursan_streak_data" },
  { oldKey: "hydra_activity_log", newKey: "fursan_activity_log" },
  { oldKey: "hydra_streak_stats", newKey: "fursan_streak_data" },
  { oldKey: "hydra_chat_rules_seen", newKey: "fursan_chat_rules_seen" },
];

const isComplete = (): boolean => {
  try {
    return localStorage.getItem(MIGRATION_FLAG) === "true";
  } catch {
    return true; // storage unavailable — do not run, and do not crash
  }
};

export function migrateData(): { migrated: number; skipped: number } {
  if (isComplete()) return { migrated: 0, skipped: 0 };

  let migrated = 0;
  let skipped = 0;

  for (const { oldKey, newKey } of KEY_MAPPINGS) {
    try {
      const oldData = localStorage.getItem(oldKey);
      if (!oldData) continue;
      if (localStorage.getItem(newKey)) {
        skipped++;
        continue;
      }
      localStorage.setItem(newKey, oldData);
      // Remove the old key so the same data is never migrated twice by a
      // different mapping row.
      localStorage.removeItem(oldKey);
      migrated++;
    } catch (error) {
      console.warn(`[migration] could not move ${oldKey}`, error);
    }
  }

  try {
    localStorage.setItem(MIGRATION_FLAG, "true");
  } catch {
    /* non-fatal */
  }

  return { migrated, skipped };
}

export function runMigrationIfNeeded(): void {
  const { migrated } = migrateData();
  if (migrated > 0) {
    window.dispatchEvent(new Event("fursan_streak_updated"));
  }
}