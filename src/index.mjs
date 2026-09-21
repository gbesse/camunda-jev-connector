// Purpose: Implement a Camunda service-task worker using DecisionPacks and exactly one acknowledgement path.
import createCamundaClient from '@camunda8/orchestration-cluster-api';
import { evaluate, createJevProvider, validatePack } from '@gbesse/decisionpacks';
import { bounded, ensure, snapshot } from './contracts.mjs';
export const JOB_TYPE = 'io.gbesse.jev:decision:1';
export function createBoundedClient(options = {}) {
  const underlying = options.fetch ?? globalThis.fetch;
  return createCamundaClient({ ...options, fetch: (input, init = {}) => {
    const original = init.signal ?? (input instanceof Request ? input.signal : undefined);
    return underlying(input, { ...init, redirect: 'error', signal: original ? AbortSignal.any([original, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000) });
  } });
}
export function createJobHandler({ packs, provider, timeoutMs = 30000, acknowledgementTimeoutMs = 15000, onError = error => console.error(error) }) {
  const registry = snapshot(packs); for (const pack of Object.values(registry)) validatePack(pack);
  ensure(typeof onError === 'function', 'onError must be a function');
  return async job => {
    let decision;
    try {
      const { jevPack, jevState } = snapshot(job.variables);
      ensure(typeof jevPack === 'string' && Object.hasOwn(registry, jevPack), 'Unknown registered DecisionPack');
      ensure(JSON.stringify(jevState).length <= 100000, 'Decision state exceeds size limit');
      decision = await evaluate(registry[jevPack], jevState, { provider: provider ?? createJevProvider(), timeoutMs });
    } catch (error) {
      // Failed inference raises a broker incident (zero retries); it must never masquerade as a review result.
      await bounded(() => onError(error, { jobKey: job.jobKey }), { timeoutMs: acknowledgementTimeoutMs });
      return bounded(() => job.fail({ errorMessage: `Jev decision failed: ${error.message}`, retries: 0 }), { timeoutMs: acknowledgementTimeoutMs });
    }
    // A completion timeout is ambiguous. Do not send a second acknowledgement or rerun inference here.
    try { return await bounded(() => job.complete({ jev: decision }), { timeoutMs: acknowledgementTimeoutMs }); }
    catch (error) {
      // The SDK auto-fails thrown handlers. Report then release locally without another broker command.
      await bounded(() => onError(error, { jobKey: job.jobKey }), { timeoutMs: acknowledgementTimeoutMs });
      return job.ignore();
    }
  };
}
export function registerWorker(client, options) {
  return client.createJobWorker({ jobType: JOB_TYPE, workerName: 'jev-decisions', maxParallelJobs: 4, jobTimeoutMs: 90000, pollTimeoutMs: 5000, pollIntervalMs: 250, fetchVariables: ['jevPack', 'jevState'], jobHandler: createJobHandler(options) });
}
