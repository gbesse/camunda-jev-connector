// Purpose: Exercise the real job handler with explicit synthetic model and broker acknowledgements.
import { readFile } from 'node:fs/promises';
import { createJobHandler } from '../src/index.mjs';
const read = async path => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
const handler = createJobHandler({ packs: { 'support/triage': await read('../packs/support-triage.json') }, provider: async () => read('./synthetic-billing-response.json') });
await handler({ jobKey: 'synthetic-1', variables: { jevPack: 'support/triage', jevState: await read('./billing-state.json') }, complete: async variables => { console.log(JSON.stringify({ syntheticFixture: true, completedWith: variables }, null, 2)); return 'JOB_ACTION_RECEIPT'; }, fail: async error => { throw new Error(error.errorMessage); } });
