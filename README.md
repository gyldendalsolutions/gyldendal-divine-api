# Gyldendal Divine API

A collection of API clients for the GU-D department at Gyldendal.

## Environments

Every service resolves its base URL from the `environment` passed to the
constructor (the `installationpurpose` of the TYPO3 installation), unless
`serviceUrl` is given explicitly.

| environment | resolves to |
|---|---|
| `production` | production services |
| `development`, `testing` | staging services |
| `local` | services running on this machine, see table below |
| `test` | the Playwright mock server on `https://localhost:3010/services/<name>` |

### Local services

`local` is for running the services yourself while developing. The services sit
in one reserved 4110-4180 block, ten apart, so a service and its own
dependencies (DynamoDB local, its admin UI) stay together and nothing collides
with the frontends (3000-3002 nuxt, 3010 mock server), the macOS AirPlay
Receiver (5000, 7000), the container defaults the services themselves use
(8000, 8001, 5432, 8983) or the ephemeral range (49152 and up). Each service's
docker-compose publishes its port on 127.0.0.1 only, and the URLs below say
127.0.0.1 rather than localhost for that reason: localhost resolves to ::1
first on macOS, where an IPv4-only mapping is not listening. The `test`
environment keeps localhost, because the Playwright mock server's certificate
is issued for that name.

| service | local URL | source of the port |
|---|---|---|
| user settings | `http://127.0.0.1:4110` | `user_settings_service` docker-compose (DynamoDB 4111, admin 4112) |
| highlight | `http://127.0.0.1:4120` | `systime_highlight_server` docker-compose-development (DynamoDB 4121, admin 4122, pgvector 4123) |
| pdf generator | `http://127.0.0.1:4130` | `pdf_generation_service` docker-compose-development |
| writing task | `http://127.0.0.1:4140` | `stepwise_task_server` docker-compose-development (DynamoDB 4141, admin 4142) |
| solr proxy | `http://127.0.0.1:4150` | `solr-proxy` docker-compose-development (solr itself 4151) |
| tagging | `http://127.0.0.1:4160` | reserved here; the repo has no development compose yet |
| AI bot | `http://127.0.0.1:4170` | reserved here; `ai-bot-service` main.py defaults to 3100 |
| cookie consent log | `http://127.0.0.1:4180` | reserved here; `cookie_consent_service` compose defaults to 1337 |
| polly | `http://127.0.0.1:3200` | `systime-appear-polly` docker-compose-development; its container port 3000 is taken by nuxt dev. Synthesis needs AWS credentials, and the container's CORS preflight currently rejects the `Authorization` header this SDK sends |
| quiz (Gale CMS) | `https://galecms.test.tibalo.dk/api` | no local Gale, shared test instance |

### Running a mix of local and hosted services

`environment` picks one environment for everything, which is rarely what
local development wants: usually one service runs on your machine and the
rest should come from staging. `environmentOverrides` says which environment
an individual service resolves in, keyed by the service names in
`src/services/service_urls.ts`:

```ts
const divine = {
  environment,          // the installationpurpose, as always
  myAccountId,
  environmentOverrides: { highlight: 'local' }
};

new HighlightService(divine);   // http://127.0.0.1:4120
new TaggingService(divine);     // https://staging-tagging.services.systime.dk
```

Build that object once where the application starts and hand the same one to
every service, so the mix lives in a single place.

Note that it names an *environment*, not a URL. The override keeps reading
the table, so a service that moves — including the local port of the very
service you overrode — still moves for you on the next version of this
package. That is the whole point of keeping the URLs in here, and a caller
who writes a URL down has stepped out of it.

For the endpoints the table cannot know about — a service on a non-standard
port, a tunnel, a colleague's branch deploy — an override may be a URL
instead:

```ts
environmentOverrides: { highlight: 'http://127.0.0.1:9999' }
```

`serviceUrl` still works and still beats everything else. It is the right
tool for a service this package does not know at all, and the wrong one for
local development, where it silently opts you out of every future change to
that service's address.

### Overrides without touching the application

An override can also come from the machine rather than from the code, which
keeps it out of the repository entirely. Per service, either:

- the environment variable `DIVINE_ENV_<SERVICE>` — `DIVINE_ENV_HIGHLIGHT`,
  `DIVINE_ENV_PDF_GENERATOR`, and so on;
- `globalThis.__divineEnvironmentOverrides`, set by a dev-only Nuxt plugin or
  an injected script, which is the only one of the two that reaches the
  browser bundle.

Both take the same values as `environmentOverrides`. An `environmentOverrides`
entry in the code beats them, the environment variable beats `globalThis`,
and neither is read at all when `environment` is `production`: configuration
that arrives out of band is a hazard there whatever it happens to say.

### Every override is reported

An applied override — from any of the four mechanisms, `serviceUrl`
included — writes a line like this the first time it resolves:

```
[gyldendal-divine-api] highlight is overridden: resolved to http://127.0.0.1:4120 instead of its "development" endpoint (source: environmentOverrides).
```

The failure mode all of this has is a forgotten override: an entry that
reached a release, or a variable exported three weeks ago and since
forgotten. So the notice is not silenced in production, where it matters
most, and it names the source, because "highlight is on 127.0.0.1" is a
puzzle on its own and stops being one as soon as it says which knob did it.

It is written once per process per distinct override, not once per request,
since a warning on every call is a warning nobody reads. Pass `onOverride` to
send it somewhere other than `console.warn`, which this package writes to
nowhere else:

```ts
new HighlightService({ ...divine, onOverride: ({ message }) => logger.warn(message) });
```
