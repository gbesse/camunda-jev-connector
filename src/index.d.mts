// Purpose: Type Camunda worker registration and the independently testable job handler.
import type { CamundaClient, CamundaOptions, Job, JobActionReceipt, JobWorker } from '@camunda8/orchestration-cluster-api';
import type { Pack, Provider } from '@gbesse/decisionpacks';
export const JOB_TYPE: 'io.gbesse.jev:decision:1';
export interface Options { packs: Record<string, Pack>; provider?: Provider; timeoutMs?: number; acknowledgementTimeoutMs?: number; onError?: (error: Error, context: { jobKey: unknown }) => void | Promise<void> }
export function createBoundedClient(options?: CamundaOptions): CamundaClient;
export function createJobHandler(options: Options): (job: Job<undefined, undefined>) => Promise<JobActionReceipt>;
export function registerWorker(client: CamundaClient, options: Options): JobWorker;
