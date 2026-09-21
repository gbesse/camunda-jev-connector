// Purpose: Register the sample worker against the user's explicitly configured Camunda cluster.
import { readFile } from 'node:fs/promises';
import { createBoundedClient, registerWorker } from '../src/index.mjs';
const pack = JSON.parse(await readFile(new URL('../packs/support-triage.json', import.meta.url), 'utf8'));
const worker = registerWorker(createBoundedClient(), { packs: { 'support/triage': pack } });
process.once('SIGINT', () => worker.stop());
process.once('SIGTERM', () => worker.stop());
console.log('Jev worker registered. Broker connection settings come from CAMUNDA_* environment variables.');
