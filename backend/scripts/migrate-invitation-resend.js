// Preparation only: do not execute against a configured database without approval.
import { connectDatabase } from '../src/database.js';
import {
  inspectResendMigration,
  applyResendMigration,
} from '../src/invitation-resend-migration.js';

const args = process.argv.slice(2);
const database = args
  .find((arg) => arg.startsWith('--database='))
  ?.slice('--database='.length);
const backupReference =
  args
    .find((arg) => arg.startsWith('--backup-reference='))
    ?.slice('--backup-reference='.length) ?? '';
const apply = args.includes('--apply-reviewed-migration');
const writersStopped = args.includes('--writers-stopped');

async function main() {
  if (
    !database ||
    database !== process.env.MONGODB_DB_NAME ||
    args.some(
      (arg) =>
        !['--plan', '--apply-reviewed-migration', '--writers-stopped'].includes(
          arg,
        ) &&
        !arg.startsWith('--database=') &&
        !arg.startsWith('--backup-reference='),
    )
  )
    throw new Error(
      'Specify the exact configured database and either --plan or --apply-reviewed-migration.',
    );
  if (
    args.includes('--plan') === apply ||
    (apply && (!writersStopped || !backupReference.trim()))
  )
    throw new Error(
      'Choose plan only, or an explicitly approved apply with stopped writers and backup reference.',
    );
  const connection = await connectDatabase();
  try {
    if (apply) {
      const result = await applyResendMigration(connection.db, {
        database,
        writersStopped,
        backupReference,
      });
      console.log(
        `Migration complete: ${result.migratedPairs} pair pointers verified.`,
      );
    } else {
      const plan = await inspectResendMigration(connection.db);
      console.log(
        `Read-only plan: ${plan.pairs.size} pair pointers require migration. No changes made.`,
      );
    }
  } finally {
    await connection.close();
  }
}

main().catch(() => {
  // Never serialize driver errors or connection configuration.
  console.error(
    'Invitation resend migration stopped. Verify the reviewed plan, acknowledgments, database permissions and data integrity.',
  );
  process.exitCode = 1;
});
