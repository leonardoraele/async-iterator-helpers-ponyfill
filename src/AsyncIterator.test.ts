import { describe, it, expect } from 'vitest';
import { AsyncIterator } from './AsyncIterator.js';

describe(AsyncIterator.name, () => {
	it('can be created from an array', async () => {
		const arr = [1, 2, 3];
		const asyncIter = AsyncIterator.from(arr);
		const results = [];
		for await (const value of asyncIter) {
			results.push(value);
		}
		expect(results).toEqual(arr);
	});

	it('can be empty', async () => {
		const asyncIter = AsyncIterator.from([]);
		for await (const _value of asyncIter) {
			expect.fail();
		}
		expect.assert(true);
	});

	it('can be created from a generator', async () => {
		const iterable = {
			*[Symbol.iterator]() {
				yield 1;
				yield 2;
				yield 3;
			}
		};
		const asyncIter = AsyncIterator.from(iterable);
		const results = [];
		for await (const value of asyncIter) {
			results.push(value);
		}
		expect(results).toEqual([1, 2, 3]);
	});

	it('can be created from an async generator', async () => {
		const asyncIterable = {
			async *[Symbol.asyncIterator]() {
				yield await Promise.resolve(1);
				yield await Promise.resolve(2);
				yield await Promise.resolve(3);
			}
		};
		const asyncIter = AsyncIterator.from(asyncIterable);
		const results = [];
		for await (const value of asyncIter) {
			results.push(value);
		}
		expect(results).toEqual([1, 2, 3]);
	});
});
