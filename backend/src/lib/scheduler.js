import { processIncomingUploads } from "./upload-cleanup.js";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Reconciliation for presigned uploads left under incoming/ (the primary path
// is the immediate per-upload trigger in scheduleIncomingCleanup).
export function startScheduler(logger) {
  // Self-heal on boot: a backend restart could otherwise strand a video in
  // "processing". Deferred + non-blocking so it never delays startup; the
  // concurrency guard inside processIncomingUploads prevents overlap.
  setTimeout(() => {
    processIncomingUploads(logger, { limit: 50 }).then(
      (processed) => {
        if (processed > 0) {
          logger.info(
            `Scheduler: reconciled ${processed} pending upload(s) on startup`,
          );
        }
      },
      (err) => logger.error(err, "Scheduler: startup reconciliation failed"),
    );
  }, 5000);

  // Weekly fallback sweep.
  const timer = setInterval(() => {
    processIncomingUploads(logger, { limit: 50 }).catch((err) =>
      logger.error(err, "Scheduler: weekly reconciliation failed"),
    );
  }, WEEK_MS);
  timer.unref?.();
}
