import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { QuizService } from './quiz_service.js';

function service(environment: string, serviceUrl?: string): QuizService {
  return new QuizService({
    bearerToken: 'a-token',
    environment,
    myAccountId: 'SYSTIMEMYACCOUNT',
    serviceUrl
  });
}

describe('QuizService.getMediaUrlPrefix', () => {
  // Each row pins both prefixes as literals and then pins the relationship
  // between them against the implementation, so neither can move alone. Should
  // an environment ever serve its media from a host of its own, the third
  // assertion failing is the signal to take that environment out of the table
  // — not a bug in the test.
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

  test('rejects an unknown environment', () => {
    assert.throws(() => service('staging').getMediaUrlPrefix(), /Unknown environment/);
  });
});
