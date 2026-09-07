import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { HighlightRanges } from './highlight_service.js';

// The service stores ranges as XPath strings with numeric offsets. This is a
// compile-time guard: assigning the shape the frontend sends must typecheck.
const range: HighlightRanges = {
  start: '/div[2]/div[1]/p[3]',
  startOffset: 4,
  end: '/div[2]/div[1]/p[3]',
  endOffset: 19
};

test('a range carries xpath strings and numeric offsets', () => {
  assert.equal(typeof range.start, 'string');
  assert.equal(typeof range.end, 'string');
  assert.equal(typeof range.startOffset, 'number');
  assert.equal(typeof range.endOffset, 'number');
});

test('a range may have no start or end node', () => {
  const unanchored: HighlightRanges = {
    start: null,
    startOffset: 0,
    end: null,
    endOffset: 0
  };

  assert.equal(unanchored.start, null);
  assert.equal(unanchored.end, null);
});
