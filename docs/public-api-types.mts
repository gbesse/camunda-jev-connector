// Purpose: Check the addon against the installed official Camunda SDK types without emitting code.
import { createBoundedClient, registerWorker } from '../src/index.mjs';
import type { Pack } from '@gbesse/decisionpacks';
declare const pack: Pack;
const worker = registerWorker(createBoundedClient(), { packs: { triage: pack } });
worker.stop();
