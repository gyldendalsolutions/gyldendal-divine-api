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
  test('is the api host without the /api path', () => {
    for (const environment of ['development', 'testing', 'local']) {
      assert.equal(
        service(environment).getMediaUrlPrefix(),
        'https://galecms.test.tibalo.dk'
      );
      assert.equal(
        service(environment).discoverUrlPrefix(),
        'https://galecms.test.tibalo.dk/api'
      );
    }
    assert.equal(service('production').getMediaUrlPrefix(), 'https://api.iquiz.dk');
  });

  test('is empty in the mock environment, where the app serves the media', () => {
    assert.equal(service('test').getMediaUrlPrefix(), '');
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
