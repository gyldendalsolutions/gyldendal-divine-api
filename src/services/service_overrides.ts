/**
 * Pointing one service somewhere else than the rest.
 *
 * A caller developing locally usually wants most services from staging and
 * one from their own machine. The override says which *environment* that one
 * service resolves in, not which URL it answers on, so the caller keeps
 * tracking `service_urls.ts` for every service they did not name — and for
 * the named one too, whenever its local port moves.
 *
 * A URL is still accepted for the cases the table cannot know about (a
 * service on a non-standard port, a tunnel, a colleague's branch deploy).
 *
 * Every override is reported, because the failure mode of all of this is a
 * forgotten one: an `environmentOverrides` entry that reached a release, or
 * an environment variable exported three weeks ago.
 */

import {
  ENVIRONMENTS,
  type ServiceEnvironment,
  type ServiceName
} from './service_urls.js';

/**
 * An environment name, or a URL for the endpoints the table cannot know
 * about. The union is written this way so an editor still suggests the
 * environment names while accepting a URL alongside them.
 */
export type ServiceOverride = ServiceEnvironment | (string & {});

export type EnvironmentOverrides = Partial<
  Record<ServiceName, ServiceOverride>
>;

/**
 * Where an override came from. Reporting it is most of the value: "highlight
 * is on 127.0.0.1" is a puzzle on its own, and stops being one as soon as it
 * says which knob did it.
 */
export type OverrideSource =
  | 'serviceUrl'
  | 'environmentOverrides'
  | 'env'
  | 'globalThis';

export interface OverrideDetails {
  service: ServiceName;
  /** The environment the service would have resolved in otherwise. */
  environment: string;
  /** The URL it resolved to instead. */
  resolved: string;
  source: OverrideSource;
  /** The one-line form the default reporter writes to the console. */
  message: string;
}

export type OverrideReporter = (details: OverrideDetails) => void;

/**
 * Set by a dev-only Nuxt plugin or an injected script, and the only way to
 * reach the browser bundle, where there is no `process.env`.
 */
const GLOBAL_OVERRIDES_KEY = '__divineEnvironmentOverrides';

/** `pdfGenerator` is configured as `DIVINE_ENV_PDF_GENERATOR`. */
export function overrideEnvVarName(service: ServiceName): string {
  return `DIVINE_ENV_${service.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase()}`;
}

/**
 * An override the developer's machine carries rather than the application's
 * code. `process.env` is read through a computed key so a bundler treats it
 * as a lookup rather than inlining a build-time value, and both accesses are
 * guarded because neither global exists everywhere this package runs.
 *
 * The environment variable wins: it is set per run of the application, so it
 * is the more deliberate of the two.
 */
export function ambientOverride(
  service: ServiceName
): { value: string; source: OverrideSource } | undefined {
  const fromEnv =
    typeof process !== 'undefined' && process.env
      ? process.env[overrideEnvVarName(service)]
      : undefined;
  if (fromEnv) {
    return { value: fromEnv, source: 'env' };
  }

  const fromGlobal = (
    globalThis as Record<string, unknown> as {
      [GLOBAL_OVERRIDES_KEY]?: EnvironmentOverrides;
    }
  )[GLOBAL_OVERRIDES_KEY]?.[service];
  if (fromGlobal) {
    return { value: fromGlobal, source: 'globalThis' };
  }

  return undefined;
}

/** An override that is not an environment name has to be a URL we can call. */
export function overrideToUrl(
  value: string,
  service: ServiceName,
  source: OverrideSource
): string {
  if (/^https?:\/\//.test(value)) {
    return value;
  }
  throw new Error(
    `Invalid ${source} override for ${service}: "${value}" is neither an environment (${ENVIRONMENTS.join(', ')}) nor an http(s) URL.`
  );
}

/**
 * Already-reported overrides, so a warning survives being read.
 * `getUrlPrefix()` runs on every request, and an override that warns on every
 * one of them is an override nobody reads.
 *
 * This is process-wide mutable state, which is exactly what a per-request
 * `environment` must never be kept in — but it only ever suppresses output,
 * and "once per process" is the cadence a server operator wants anyway.
 */
const reported = new Set<string>();

/** Test seam: forget what has already been reported. */
export function resetOverrideReports(): void {
  reported.clear();
}

const defaultReporter: OverrideReporter = (details) =>
  console.warn(details.message);

/**
 * Report an override the first time it resolves. Deliberately not silenced in
 * production: an `environmentOverrides` entry that reached a release is the
 * single thing this is here to catch.
 */
export function reportOverride(
  {
    service,
    environment,
    resolved,
    source
  }: Omit<OverrideDetails, 'message'>,
  onOverride?: OverrideReporter
): void {
  const key = `${source}:${service}:${resolved}`;
  if (reported.has(key)) {
    return;
  }
  reported.add(key);

  const message =
    `[gyldendal-divine-api] ${service} is overridden: resolved to ${resolved} ` +
    `instead of its "${environment}" endpoint (source: ${source}).`;

  (onOverride ?? defaultReporter)({
    service,
    environment,
    resolved,
    source,
    message
  });
}
