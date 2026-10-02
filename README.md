# Jev decision worker for Camunda

A Camunda 8 REST job worker, Modeler element template and example BPMN process backed by DecisionPacks. Process variables select a worker-registered pack; they cannot submit arbitrary decision policies or provider credentials.

**v0.1.0 experimental alpha · MIT · Node.js 22+**. Uses the official Camunda TypeScript REST SDK 9.1.5. This is a service-task worker, not a Java Connector Runtime plugin or a Camunda-certified connector.

## Run

```sh
git clone --branch v0.1.0 https://github.com/gbesse/camunda-jev-connector.git
cd camunda-jev-connector
npm ci
export CAMUNDA_REST_ADDRESS='http://localhost:8080'
export CAMUNDA_AUTH_STRATEGY='NONE' # Local development cluster only
export TYPESAFE_API_KEY='your-server-key'
node examples/worker.mjs
```

Use your cluster's normal OAuth/basic configuration for hosted environments. Import `element-templates/jev-decision.json` into Modeler. The task type is `io.gbesse.jev:decision:1`, input variables are `jevPack` and `jevState`, and the completed job writes `jev` with the full decision record. The example registers `support/triage` and expects a process variable `ticketText`.

Open `examples/support-triage.bpmn` or apply the template to an existing service task. Branch downstream on `jev.outcome`, including `review`. Errors are reported through `onError` and fail the job with zero retries to raise an incident. The default worker allows four concurrent jobs, a 90-second job lease, 30-second inference deadline and 15-second HTTP deadlines. An ambiguous completion error is reported and released locally via the SDK `ignore()` receipt, avoiding its automatic failure acknowledgement. Inspect broker state before recovery. No exactly-once guarantee: broker redelivery or SDK transport retries can occur. Side-effect consumers must use their own idempotency policy.

```js
import { createBoundedClient, registerWorker } from '@gbesse/camunda-jev-connector';
const worker = registerWorker(createBoundedClient(), { packs: { 'support/triage': pack } });
// await worker.stopGracefully({ waitUpToMs: 10000 });
```

Install the package from `github:gbesse/camunda-jev-connector#v0.1.1`; it is not published to npm.

## Shareable demo report

Run `npm run demo:report` to capture this repository’s bundled example as one JSON object with the project purpose, version and complete demo output. The command fails if the demo fails, so the report is useful when sharing a reproducible first look or reporting unexpected behavior. The bundled demo’s data and safety boundaries still apply.

## Verification

```sh
npm run check
npm run typecheck
npm test
npm run demo
```

Tests exercise real SDK worker activation/completion through an injected HTTP transport, gate behavior, unknown packs, inference and acknowledgement deadlines, and the official Modeler template JSON schema. No live Camunda cluster, BPMN deployment or live Jev inference was tested. The sample process is an example to validate in your target cluster.

See [reuse and provenance](docs/reuse.md), [contributing](CONTRIBUTING.md) and [security](SECURITY.md).

Host reference: [Camunda template input/output mappings](https://docs.camunda.io/docs/components/modeler/element-templates/template-properties/).

[Recorded verification scope](docs/verification.md).
