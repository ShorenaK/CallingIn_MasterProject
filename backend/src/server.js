import { startBackend } from './lifecycle.js';

startBackend().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
