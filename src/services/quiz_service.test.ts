import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { QuizService } from './quiz_service.js';

function service(
  environment: string,
  serviceUrl?: string,
  galeQaEndpointEnabled?: boolean
): QuizService {
  return new QuizService({
    bearerToken: 'a-token',
    environment,
    myAccountId: 'SYSTIMEMYACCOUNT',
    serviceUrl,
    galeQaEndpointEnabled
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

describe('QuizService.discoverUrlPrefix with galeQaEndpointEnabled', () => {
  // The flag only moves the Gale installation the non-production environments
  // point at; the media prefix follows because it is still derived from this
  // one mapping.
  for (const environment of ['development', 'testing', 'local']) {
    test(`${environment}: serves the QA Gale installation`, () => {
      const quizService = service(environment, undefined, true);

      assert.equal(
        quizService.discoverUrlPrefix(),
        'https://galecms.qa.tibalo.dk/api'
      );
      assert.equal(
        quizService.getMediaUrlPrefix(),
        'https://galecms.qa.tibalo.dk'
      );
    });
  }

  test('leaves production alone', () => {
    assert.equal(
      service('production', undefined, true).discoverUrlPrefix(),
      'https://api.iquiz.dk/api'
    );
  });

  test('leaves the mock environment alone', () => {
    const quizService = service('test', undefined, true);

    assert.equal(
      quizService.discoverUrlPrefix(),
      'https://localhost:3010/galeapi/api'
    );
    assert.equal(quizService.getMediaUrlPrefix(), '');
  });

  test('an explicit serviceUrl still wins', () => {
    assert.equal(
      service(
        'development',
        'https://gale.example.invalid/api',
        true
      ).getUrlPrefix(),
      'https://gale.example.invalid/api'
    );
  });

  test('defaults to the test installation when the flag is absent', () => {
    assert.equal(
      service('development').discoverUrlPrefix(),
      'https://galecms.test.tibalo.dk/api'
    );
  });
});
