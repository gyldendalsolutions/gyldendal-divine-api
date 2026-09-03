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

`local` is for running the services yourself while developing. Ports follow
each service's own development setup where one exists, and avoid the ports
the frontends already use locally (3000-3002 nuxt, 3010 mock server, 8001
DynamoDB admin).

| service | local URL | source of the port |
|---|---|---|
| highlight | `http://localhost:3030` | `systime_highlight_server` docker-compose-development |
| user settings | `http://localhost:4000` | `user_settings_service` Dockerfile |
| pdf generator | `http://localhost:3050` | `pdf_generation_service` docker-compose-development |
| writing task | `http://localhost:5000` | `systime_sso` local service block |
| AI bot | `http://localhost:3100` | `ai-bot-service` main.py |
| cookie consent log | `http://localhost:1337` | `cookie_consent_service` docker-compose |
| tagging | `http://localhost:8000` | `tagging-service` uvicorn default |
| solr proxy | `http://localhost:8090` | chosen; its uvicorn default 8000 is taken by tagging |
| polly | `http://localhost:3200` | chosen; its container port 3000 is taken by nuxt dev |
| quiz (Gale CMS) | `https://galecms.test.tibalo.dk/api` | no local Gale, shared test instance |

Run a service on a different port by passing `serviceUrl` to its constructor.
