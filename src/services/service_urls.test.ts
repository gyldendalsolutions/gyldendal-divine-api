import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  ENVIRONMENTS,
  SERVICE_URLS,
  resolveServiceUrl,
  type ServiceName
} from './service_urls.js';
import BaseService from './base_service.js';
import { AIBotService } from './ai_bot_service.js';
import { CookieConsentLog } from './cookie_consent_log.js';
import { HighlightService } from './highlight_service.js';
import { PdfGeneratorService } from './pdf_generator.js';
import { PollyService } from './polly_service.js';
import { QuizService } from './quiz_service.js';
import { SolrProxyService } from './solr_proxy_service.js';
import { TaggingService } from './tagging_service.js';
import { UserSettingsBase } from './user_settings_base.js';
import { WritingTaskService } from './writing_task_service.js';

/**
 * Every URL this package resolves, written out rather than derived. The table
 * these assert against is itself the derivation, so a test that derived them
 * the same way would assert nothing; these literals are transcribed from the
 * per-service switches the table replaced, and they are what says the table
 * kept every one of them intact.
 */
const EXPECTED: Record<ServiceName, Record<string, string>> = {
  userSettings: {
    production: 'https://user-settings-service.services.systime.dk',
    staging: 'https://staging-user-settings-service.services.systime.dk',
    local: 'http://127.0.0.1:4110',
    test: 'https://localhost:3010/services/usersettingsservice'
  },
  highlight: {
    production: 'https://highlights.services.systime.dk',
    staging: 'https://staging-highlights.services.systime.dk',
    local: 'http://127.0.0.1:4120',
    test: 'https://localhost:3010/services/highlight'
  },
  pdfGenerator: {
    production: 'https://pdfgenerator.services.systime.dk',
    staging: 'https://staging-pdfgenerator.services.systime.dk',
    local: 'http://127.0.0.1:4130',
    test: 'https://localhost:3010/services/pdfgenerator'
  },
  writingTask: {
    production: 'https://writingtask.services.systime.dk',
    staging: 'https://staging-writingtask.services.systime.dk',
    local: 'http://127.0.0.1:4140',
    test: 'https://localhost:3010/services/writingtask'
  },
  solrProxy: {
    production: 'https://solr-proxy.eu-west-1.systime.dk',
    staging: 'https://solr-proxy-staging.eu-west-1.systime.dk',
    local: 'http://127.0.0.1:4150',
    test: 'https://localhost:3010/services/solrproxy'
  },
  tagging: {
    production: 'https://tagging.services.systime.dk',
    staging: 'https://staging-tagging.services.systime.dk',
    local: 'http://127.0.0.1:4160',
    test: 'https://localhost:3010/services/tagging'
  },
  aiBot: {
    production: 'https://ai-bot-service.eu-west-1.systime.dk',
    staging: 'https://ai-bot-service-staging.eu-west-1.systime.dk',
    local: 'http://127.0.0.1:4170',
    test: 'https://localhost:3010/services/aibotservice'
  },
  cookieConsentLog: {
    production: 'https://cookieconsentlog.services.systime.dk',
    staging: 'https://staging-cookieconsentlog.services.systime.dk',
    local: 'http://127.0.0.1:4180',
    test: 'https://localhost:3010/services/cookieconsentlog'
  },
  polly: {
    production: 'https://appear-polly.services.systime.dk',
    staging: 'https://staging-appear-polly.services.systime.dk',
    local: 'http://127.0.0.1:3200',
    test: 'https://localhost:3010/services/polly'
  },
  quiz: {
    production: 'https://api.iquiz.dk/api',
    staging: 'https://galecms.test.tibalo.dk/api',
    local: 'https://galecms.test.tibalo.dk/api',
    test: 'https://localhost:3010/galeapi/api'
  }
};

describe('SERVICE_URLS', () => {
  for (const [service, expected] of Object.entries(EXPECTED) as [
    ServiceName,
    Record<string, string>
  ][]) {
    test(`${service} resolves every environment`, () => {
      const url = (environment: string) =>
        resolveServiceUrl(service, environment, 'systime.dk');

      assert.equal(url('production'), expected.production);
      assert.equal(url('development'), expected.staging);
      assert.equal(url('testing'), expected.staging);
      assert.equal(url('local'), expected.local);
      assert.equal(url('test'), expected.test);
    });
  }

  test('covers every service in the table, so a new one cannot be missed', () => {
    assert.deepEqual(
      Object.keys(SERVICE_URLS).sort(),
      Object.keys(EXPECTED).sort()
    );
  });

  // The pair that used to be two adjacent `case` labels in ten separate
  // switches, which is the drift this table exists to make impossible.
  test('development and testing are the same environment everywhere', () => {
    for (const service of Object.keys(SERVICE_URLS) as ServiceName[]) {
      assert.equal(
        resolveServiceUrl(service, 'development', 'systime.dk'),
        resolveServiceUrl(service, 'testing', 'systime.dk')
      );
    }
  });

  test('the hosted environments follow baseDomain', () => {
    assert.equal(
      resolveServiceUrl('highlight', 'production', 'example.invalid'),
      'https://highlights.services.example.invalid'
    );
  });

  test('rejects an unknown environment', () => {
    assert.throws(
      () => resolveServiceUrl('highlight', 'staging', 'systime.dk'),
      /Unknown environment: staging/
    );
  });
});

describe('a service resolves its own entry', () => {
  const services: [ServiceName, new (...args: never[]) => BaseService][] = [
    ['userSettings', UserSettingsBase],
    ['highlight', HighlightService],
    ['pdfGenerator', PdfGeneratorService],
    ['writingTask', WritingTaskService],
    ['solrProxy', SolrProxyService],
    ['tagging', TaggingService],
    ['aiBot', AIBotService],
    ['cookieConsentLog', CookieConsentLog],
    ['polly', PollyService],
    ['quiz', QuizService]
  ];

  for (const [service, Service] of services) {
    test(`${Service.name} is wired to ${service}`, () => {
      for (const environment of ENVIRONMENTS) {
        const instance = new (Service as new (options: {
          environment: string;
          myAccountId: string;
        }) => BaseService)({
          environment,
          myAccountId: 'SYSTIMEMYACCOUNT'
        });

        assert.equal(instance.serviceName, service);
        assert.equal(
          instance.getUrlPrefix(),
          resolveServiceUrl(service, environment, 'systime.dk')
        );
      }
    });
  }

  test('a subclass without a serviceName still says so', () => {
    class Unknown extends BaseService {}

    assert.throws(
      () =>
        new Unknown({
          environment: 'production',
          myAccountId: 'SYSTIMEMYACCOUNT'
        }).getUrlPrefix(),
      /Method not implemented/
    );
  });
});
