# camunda-jev-connector — contrôle d’adoption · adoption check · comprobación de adopción

## Français

Point de départ local, après la préparation indiquée dans le README :

```sh
npm run demo:report
```

Un processus ne doit sélectionner qu’un pack enregistré par le worker. Inspectez le rapport synthétique, puis vérifiez dans votre BPMN que la tâche conserve les routes de revue et d’erreur.

## English

Local starting point, after the setup described in the README:

```sh
npm run demo:report
```

A process should select only a pack registered by the worker. Inspect the synthetic report, then check that your BPMN keeps review and failure paths.

## Español

Punto de partida local, después de la preparación descrita en el README:

```sh
npm run demo:report
```

Un proceso solo debe seleccionar un paquete registrado por el worker. Revise el informe sintético y compruebe que su BPMN conserva las rutas de revisión y error.
## Variante synthétique · Synthetic variation · Variante sintética

```text
jevPack="unknown/pack"; jevState={ticketText:"synthetic"}
```

FR : adaptez une copie de la fixture locale à cette situation, puis vérifiez le comportement décrit ci-dessus. Les valeurs sont illustratives, pas des résultats Jev mesurés.

EN: adapt a copy of the local fixture to this situation, then check the behavior described above. Values are illustrative, not measured Jev output.

ES: adapte una copia de la fixture local a esta situación y compruebe el comportamiento descrito arriba. Los valores son ilustrativos, no resultados Jev medidos.

## Second cas · Second case · Segundo caso

```text
job_key=42; delivery_count=2; downstream_side_effect=1
```

**FR :** Une nouvelle livraison du même job ne prouve pas une exécution unique des effets en aval. Définissez une clé d’idempotence côté consommateur avant un flux réel.

**EN:** Redelivery of the same job does not prove downstream effects run once. Define a consumer-side idempotency key before using a real process.

**ES:** La nueva entrega del mismo trabajo no garantiza que los efectos posteriores se ejecuten una sola vez. Defina una clave de idempotencia en el consumidor antes de usar un proceso real.
