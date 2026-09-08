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
docker-compose publishes its port on 127.0.0.1 only.

| service | local URL | source of the port |
|---|---|---|
| user settings | `http://localhost:4110` | `user_settings_service` docker-compose (DynamoDB 4111, admin 4112) |
| highlight | `http://localhost:4120` | `systime_highlight_server` docker-compose-development (DynamoDB 4121, admin 4122, pgvector 4123) |
| pdf generator | `http://localhost:4130` | `pdf_generation_service` docker-compose-development |
| writing task | `http://localhost:4140` | `stepwise_task_server` docker-compose-development (DynamoDB 4141, admin 4142) |
| solr proxy | `http://localhost:4150` | `solr-proxy` docker-compose-development (solr itself 4151) |
| tagging | `http://localhost:4160` | reserved here; the repo has no development compose yet |
| AI bot | `http://localhost:4170` | reserved here; `ai-bot-service` main.py defaults to 3100 |
| cookie consent log | `http://localhost:4180` | reserved here; `cookie_consent_service` compose defaults to 1337 |
| polly | `http://localhost:3200` | `systime-appear-polly` docker-compose-development; its container port 3000 is taken by nuxt dev |
| quiz (Gale CMS) | `https://galecms.test.tibalo.dk/api` | no local Gale, shared test instance |

Run a service on a different port by passing `serviceUrl` to its constructor.
