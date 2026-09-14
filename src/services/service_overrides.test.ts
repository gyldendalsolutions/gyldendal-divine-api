import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { HighlightService } from './highlight_service.js';
import { TaggingService } from './tagging_service.js';
import { PdfGeneratorService } from './pdf_generator.js';
import {
  overrideEnvVarName,
  resetOverrideReports,
  type EnvironmentOverrides,
  type OverrideDetails,
  type OverrideReporter
} from './service_overrides.js';

const GLOBAL_KEY = '__divineEnvironmentOverrides';

function reporter(): { calls: OverrideDetails[]; onOverride: OverrideReporter } {
  const calls: OverrideDetails[] = [];
  return { calls, onOverride: (details) => calls.push(details) };
}

function highlight(
  options: {
    environment?: string;
    environmentOverrides?: EnvironmentOverrides;
    serviceUrl?: string;
    onOverride?: OverrideReporter;
  } = {}
): HighlightService {
  return new HighlightService({
    environment: options.environment ?? 'development',
    myAccountId: 'SYSTIMEMYACCOUNT',
    ...options
  });
}

beforeEach(() => {
  resetOverrideReports();
  delete process.env[overrideEnvVarName('highlight')];
  delete (globalThis as Record<string, unknown>)[GLOBAL_KEY];
});

afterEach(() => {
  delete process.env[overrideEnvVarName('highlight')];
  delete (globalThis as Record<string, unknown>)[GLOBAL_KEY];
});

describe('environmentOverrides', () => {
  test('sends one service elsewhere and leaves the rest alone', () => {
    const shared = {
      environment: 'development',
      myAccountId: 'SYSTIMEMYACCOUNT',
      environmentOverrides: { highlight: 'local' } as EnvironmentOverrides,
      onOverride: () => {}
    };

    assert.equal(
      new HighlightService(shared).getUrlPrefix(),
      'http://127.0.0.1:4120'
    );
    assert.equal(
      new TaggingService(shared).getUrlPrefix(),
      'https://staging-tagging.services.systime.dk'
    );
  });

  // The point of naming an environment rather than a URL: the caller who
  // overrides highlight still gets the table's port for it, so moving that
  // port is still a release of this package and nothing else.
  test('an override tracks the table, it does not pin a URL', () => {
    const service = highlight({
      environmentOverrides: { highlight: 'test' },
      onOverride: () => {}
    });

    assert.equal(
      service.getUrlPrefix(),
      'https://localhost:3010/services/highlight'
    );
  });

  test('accepts a URL for an endpoint the table cannot know', () => {
    const service = highlight({
      environmentOverrides: { highlight: 'http://127.0.0.1:9999' },
      onOverride: () => {}
    });

    assert.equal(service.getUrlPrefix(), 'http://127.0.0.1:9999');
  });

  test('rejects a value that is neither an environment nor a URL', () => {
    const service = highlight({
      environmentOverrides: { highlight: 'stagin' },
      onOverride: () => {}
    });

    assert.throws(
      () => service.getUrlPrefix(),
      /Invalid environmentOverrides override for highlight: "stagin" is neither an environment/
    );
  });

  test('an explicit serviceUrl still beats an override', () => {
    const service = highlight({
      environmentOverrides: { highlight: 'local' },
      serviceUrl: 'https://tunnel.example.invalid',
      onOverride: () => {}
    });

    assert.equal(service.getUrlPrefix(), 'https://tunnel.example.invalid');
  });

  test('other services are untouched by an override that does not name them', () => {
    const service = new PdfGeneratorService({
      environment: 'development',
      myAccountId: 'SYSTIMEMYACCOUNT',
      environmentOverrides: { highlight: 'local' }
    });

    assert.equal(
      service.getUrlPrefix(),
      'https://staging-pdfgenerator.services.systime.dk'
    );
  });
});

describe('reporting', () => {
  test('reports the service, both endpoints and the source', () => {
    const { calls, onOverride } = reporter();
    highlight({
      environmentOverrides: { highlight: 'local' },
      onOverride
    }).getUrlPrefix();

    assert.equal(calls.length, 1);
    assert.deepEqual(
      { ...calls[0], message: undefined },
      {
        service: 'highlight',
        environment: 'development',
        resolved: 'http://127.0.0.1:4120',
        source: 'environmentOverrides',
        message: undefined
      }
    );
    assert.match(calls[0].message, /highlight/);
    assert.match(calls[0].message, /http:\/\/127\.0\.0\.1:4120/);
    assert.match(calls[0].message, /environmentOverrides/);
  });

  test('reports an explicit serviceUrl too', () => {
    const { calls, onOverride } = reporter();
    highlight({ serviceUrl: 'https://tunnel.example.invalid', onOverride })
      .getUrlPrefix();

    assert.equal(calls.length, 1);
    assert.equal(calls[0].source, 'serviceUrl');
    assert.equal(calls[0].resolved, 'https://tunnel.example.invalid');
  });

  // getUrlPrefix() runs on every request, so the warning has to survive being
  // read: once per process, not once per call.
  test('reports an override once, however often it resolves', () => {
    const { calls, onOverride } = reporter();
    const service = highlight({
      environmentOverrides: { highlight: 'local' },
      onOverride
    });

    for (let i = 0; i < 5; i++) {
      service.getUrlPrefix();
    }
    // A second instance of the same service, as a server would build per
    // request, is the same override and not news either.
    highlight({
      environmentOverrides: { highlight: 'local' },
      onOverride
    }).getUrlPrefix();

    assert.equal(calls.length, 1);
  });

  test('reports a second, different override separately', () => {
    const { calls, onOverride } = reporter();
    highlight({
      environmentOverrides: { highlight: 'local' },
      onOverride
    }).getUrlPrefix();
    highlight({
      environmentOverrides: { highlight: 'test' },
      onOverride
    }).getUrlPrefix();

    assert.equal(calls.length, 2);
  });

  test('says nothing when nothing is overridden', () => {
    const { calls, onOverride } = reporter();
    highlight({ onOverride }).getUrlPrefix();

    assert.equal(calls.length, 0);
  });

  // An override that reached a release is the thing this is here to catch, so
  // production is where it matters most.
  test('is not silenced in production', () => {
    const { calls, onOverride } = reporter();
    highlight({
      environment: 'production',
      environmentOverrides: { highlight: 'local' },
      onOverride
    }).getUrlPrefix();

    assert.equal(calls.length, 1);
    assert.equal(calls[0].environment, 'production');
  });

  test('goes to console.warn when the caller supplies no reporter', () => {
    const warnings: unknown[] = [];
    const warn = console.warn;
    console.warn = (...args: unknown[]) => warnings.push(args[0]);

    try {
      highlight({ environmentOverrides: { highlight: 'local' } }).getUrlPrefix();
    } finally {
      console.warn = warn;
    }

    assert.equal(warnings.length, 1);
    assert.match(String(warnings[0]), /highlight is overridden/);
  });
});

describe('ambient overrides', () => {
  test('names an environment variable per service', () => {
    assert.equal(overrideEnvVarName('highlight'), 'DIVINE_ENV_HIGHLIGHT');
    assert.equal(
      overrideEnvVarName('pdfGenerator'),
      'DIVINE_ENV_PDF_GENERATOR'
    );
    assert.equal(
      overrideEnvVarName('cookieConsentLog'),
      'DIVINE_ENV_COOKIE_CONSENT_LOG'
    );
  });

  test('an environment variable redirects a service', () => {
    process.env.DIVINE_ENV_HIGHLIGHT = 'local';
    const { calls, onOverride } = reporter();

    assert.equal(highlight({ onOverride }).getUrlPrefix(), 'http://127.0.0.1:4120');
    assert.equal(calls[0].source, 'env');
  });

  test('globalThis carries one into the browser bundle', () => {
    (globalThis as Record<string, unknown>)[GLOBAL_KEY] = {
      highlight: 'local'
    };
    const { calls, onOverride } = reporter();

    assert.equal(highlight({ onOverride }).getUrlPrefix(), 'http://127.0.0.1:4120');
    assert.equal(calls[0].source, 'globalThis');
  });

  test('the environment variable wins, being set per run', () => {
    process.env.DIVINE_ENV_HIGHLIGHT = 'test';
    (globalThis as Record<string, unknown>)[GLOBAL_KEY] = {
      highlight: 'local'
    };

    assert.equal(
      highlight({ onOverride: () => {} }).getUrlPrefix(),
      'https://localhost:3010/services/highlight'
    );
  });

  test('an explicit override beats the developer machine', () => {
    process.env.DIVINE_ENV_HIGHLIGHT = 'local';

    assert.equal(
      highlight({
        environmentOverrides: { highlight: 'test' },
        onOverride: () => {}
      }).getUrlPrefix(),
      'https://localhost:3010/services/highlight'
    );
  });

  // Config that arrives out of band is a hazard in production whatever it
  // says, so production does not read it at all.
  test('is not read in production', () => {
    process.env.DIVINE_ENV_HIGHLIGHT = 'local';
    const { calls, onOverride } = reporter();

    assert.equal(
      highlight({ environment: 'production', onOverride }).getUrlPrefix(),
      'https://highlights.services.systime.dk'
    );
    assert.equal(calls.length, 0);
  });
});
