import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { QuizService } from './quiz_service.js';
import { GALE_QA_URL } from './service_urls.js';
import { resetOverrideReports } from './service_overrides.js';

function service(environment: string, serviceUrl?: string): QuizService {
  return new QuizService({
    bearerToken: 'a-token',
    environment,
    myAccountId: 'SYSTIMEMYACCOUNT',
    serviceUrl
  });
}

describe('QuizService.getMediaUrlPrefix', () => {
  // The literals are what carry weight here: the media prefix is derived from
  // `discoverUrlPrefix()`, so the relationship between the two holds by
  // construction and the third assertion only catches someone reintroducing a
  // parallel mapping. Should an environment ever serve its media from a host of
  // its own, that assertion failing is the signal to take the environment out
  // of the table — not a bug in the test.
  for (const { environment, api, media } of [
    {
      environment: 'development',
      api: 'https://galecms.test.tibalo.dk/api',
      media: 'https://galecms.test.tibalo.dk'
    },
    {
      environment: 'testing',
      api: 'https://galecms.test.tibalo.dk/api',
      media: 'https://galecms.test.tibalo.dk'
    },
    {
      environment: 'local',
      api: 'https://galecms.test.tibalo.dk/api',
      media: 'https://galecms.test.tibalo.dk'
    },
    {
      environment: 'production',
      api: 'https://api.iquiz.dk/api',
      media: 'https://api.iquiz.dk'
    }
  ]) {
    test(`${environment}: the media prefix is the api host without the /api path`, () => {
      const quizService = service(environment);

      assert.equal(quizService.discoverUrlPrefix(), api);
      assert.equal(quizService.getMediaUrlPrefix(), media);
      assert.equal(
        quizService.getMediaUrlPrefix(),
        new URL(quizService.discoverUrlPrefix()).origin
      );
    });
  }

  // The one environment where the two deliberately part ways: the app serves
  // the fixtures itself and their identifiers are already relative to it, so a
  // host would break them.
  test('is empty in the mock environment, where the app serves the media', () => {
    const quizService = service('test');

    assert.equal(quizService.discoverUrlPrefix(), 'https://localhost:3010/galeapi/api');
    assert.equal(quizService.getMediaUrlPrefix(), '');
  });

  test('follows an explicit serviceUrl, minus its path', () => {
    assert.equal(
      service('production', 'https://gale.example.invalid/api').getMediaUrlPrefix(),
      'https://gale.example.invalid'
    );
  });

  test('lets an explicit serviceUrl override the mock environment too', () => {
    assert.equal(
      service('test', 'https://gale.example.invalid/api').getMediaUrlPrefix(),
      'https://gale.example.invalid'
    );
  });

  test('rejects an unknown environment', () => {
    assert.throws(() => service('staging').getMediaUrlPrefix(), /Unknown environment/);
  });
});

describe('the Gale QA endpoint', () => {
  // TYPO3 turns this on per site through
  // `site.sso.sso_overrides.galeQaEndpointEnabled`, and the caller applies it
  // as an override rather than as a `serviceUrl`, so the rest of the table
  // keeps working and the redirection is reported.
  const qaService = (environment: string): QuizService =>
    new QuizService({
      bearerToken: 'a-token',
      environment,
      myAccountId: 'SYSTIMEMYACCOUNT',
      environmentOverrides: { quiz: GALE_QA_URL },
      onOverride: () => {}
    });

  // What `GALE_QA_URL` itself spells is pinned to a literal in
  // `service_urls.test.ts`; these tests are about the override taking effect.
  test('replaces the environment endpoint when quiz is overridden with it', () => {
    resetOverrideReports();

    assert.equal(qaService('development').discoverUrlPrefix(), GALE_QA_URL);
    assert.notEqual(GALE_QA_URL, service('development').discoverUrlPrefix());
  });

  test('carries the media host with it', () => {
    resetOverrideReports();

    assert.equal(
      qaService('development').getMediaUrlPrefix(),
      'https://galecms.qa.tibalo.dk'
    );
  });

  test('is reported, naming the environment it replaced', () => {
    resetOverrideReports();

    const messages: string[] = [];
    new QuizService({
      bearerToken: 'a-token',
      environment: 'development',
      myAccountId: 'SYSTIMEMYACCOUNT',
      environmentOverrides: { quiz: GALE_QA_URL },
      onOverride: ({ message }) => messages.push(message)
    }).discoverUrlPrefix();

    assert.equal(messages.length, 1);
    assert.match(messages[0]!, /quiz is overridden/);
    assert.match(messages[0]!, /galecms\.qa\.tibalo\.dk/);
    assert.match(messages[0]!, /environmentOverrides/);
  });
});
