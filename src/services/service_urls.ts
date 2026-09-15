/**
 * The `installationpurpose` values a caller may pass as `environment`, which
 * is more values than there are places to point them at.
 */
export const ENVIRONMENTS = [
  'production',
  'development',
  'testing',
  'local',
  'test'
] as const;

export type ServiceEnvironment = (typeof ENVIRONMENTS)[number];

export function isServiceEnvironment(
  value: string
): value is ServiceEnvironment {
  return (ENVIRONMENTS as readonly string[]).includes(value);
}

/**
 * The four places a service actually runs. Several environments share one:
 * `development` and `testing` both mean staging, and having them collapse
 * here rather than in ten separate switches is what stops one of them
 * quietly drifting away from the other.
 */
type Target = 'production' | 'staging' | 'local' | 'mock';

const TARGETS: Record<ServiceEnvironment, Target> = {
  production: 'production',
  development: 'staging',
  testing: 'staging',
  local: 'local',
  test: 'mock'
};

/**
 * A service's four addresses. `baseDomain` is the TYPO3 installation's domain
 * and only the hosted environments use it; local ports and the mock server
 * are the same wherever the caller runs.
 */
type ServiceLocations = Record<Target, (baseDomain: string) => string>;

/**
 * The hosted hostnames are written out rather than derived from the service
 * name: `solr-proxy-staging.eu-west-1`, `ai-bot-service-staging.eu-west-1`
 * and the whole of `quiz` already break whatever pattern one would derive,
 * and a wrong host is worth more than the repetition costs.
 *
 * The local ports are the reserved 4110-4180 block documented in the README.
 */
export const SERVICE_URLS = {
  userSettings: {
    production: (d) => `https://user-settings-service.services.${d}`,
    staging: (d) => `https://staging-user-settings-service.services.${d}`,
    local: () => 'http://127.0.0.1:4110',
    mock: () => 'https://localhost:3010/services/usersettingsservice'
  },
  highlight: {
    production: (d) => `https://highlights.services.${d}`,
    staging: (d) => `https://staging-highlights.services.${d}`,
    local: () => 'http://127.0.0.1:4120',
    mock: () => 'https://localhost:3010/services/highlight'
  },
  pdfGenerator: {
    production: (d) => `https://pdfgenerator.services.${d}`,
    staging: (d) => `https://staging-pdfgenerator.services.${d}`,
    local: () => 'http://127.0.0.1:4130',
    mock: () => 'https://localhost:3010/services/pdfgenerator'
  },
  writingTask: {
    production: (d) => `https://writingtask.services.${d}`,
    staging: (d) => `https://staging-writingtask.services.${d}`,
    local: () => 'http://127.0.0.1:4140',
    mock: () => 'https://localhost:3010/services/writingtask'
  },
  solrProxy: {
    production: (d) => `https://solr-proxy.eu-west-1.${d}`,
    staging: (d) => `https://solr-proxy-staging.eu-west-1.${d}`,
    local: () => 'http://127.0.0.1:4150',
    mock: () => 'https://localhost:3010/services/solrproxy'
  },
  tagging: {
    production: (d) => `https://tagging.services.${d}`,
    staging: (d) => `https://staging-tagging.services.${d}`,
    local: () => 'http://127.0.0.1:4160',
    mock: () => 'https://localhost:3010/services/tagging'
  },
  aiBot: {
    production: (d) => `https://ai-bot-service.eu-west-1.${d}`,
    staging: (d) => `https://ai-bot-service-staging.eu-west-1.${d}`,
    local: () => 'http://127.0.0.1:4170',
    mock: () => 'https://localhost:3010/services/aibotservice'
  },
  cookieConsentLog: {
    production: (d) => `https://cookieconsentlog.services.${d}`,
    staging: (d) => `https://staging-cookieconsentlog.services.${d}`,
    local: () => 'http://127.0.0.1:4180',
    mock: () => 'https://localhost:3010/services/cookieconsentlog'
  },
  polly: {
    // Its container port 3000 is taken by nuxt dev, hence 3200 rather than a
    // port from the reserved block.
    production: (d) => `https://appear-polly.services.${d}`,
    staging: (d) => `https://staging-appear-polly.services.${d}`,
    local: () => 'http://127.0.0.1:3200',
    mock: () => 'https://localhost:3010/services/polly'
  },
  quiz: {
    // Gale has no local instance, so `local` shares the staging one.
    production: () => 'https://api.iquiz.dk/api',
    staging: () => 'https://galecms.test.tibalo.dk/api',
    local: () => 'https://galecms.test.tibalo.dk/api',
    mock: () => 'https://localhost:3010/galeapi/api'
  }
} as const satisfies Record<string, ServiceLocations>;

export type ServiceName = keyof typeof SERVICE_URLS;

/**
 * Gale CMS's QA installation, which is not a target of its own: `quiz` is the
 * only service with a QA endpoint, and a fifth `Target` would oblige the other
 * nine to name one they do not have.
 *
 * It is reached by overriding `quiz` with it, so the URL stays in this file
 * and a caller who turns it on keeps tracking this package:
 *
 * ```ts
 * environmentOverrides: { quiz: GALE_QA_URL }
 * ```
 *
 * TYPO3 asks for it through `site.sso.sso_overrides.galeQaEndpointEnabled`,
 * which is a testing arrangement: honour it outside production only.
 */
export const GALE_QA_URL = 'https://galecms.qa.tibalo.dk/api';

/** Where `service` answers in `environment`. */
export function resolveServiceUrl(
  service: ServiceName,
  environment: string,
  baseDomain: string
): string {
  if (!isServiceEnvironment(environment)) {
    throw new Error(`Unknown environment: ${environment}`);
  }
  return SERVICE_URLS[service][TARGETS[environment]](baseDomain);
}
