import { describe, it, expect } from 'vitest';
import { AsyncIterator } from './AsyncIterator.js';

describe(AsyncIterator.name, () => {
	describe(AsyncIterator.from.name, () => {
		it('accepts an iterable', async () => {
			const iterator = AsyncIterator.from([1, 2, 3]);
			await expect(iterator.next()).resolves.toEqual({ value: 1, done: false });
			await expect(iterator.next()).resolves.toEqual({ value: 2, done: false });
			await expect(iterator.next()).resolves.toEqual({ value: 3, done: false });
			await expect(iterator.next()).resolves.toEqual({ value: undefined, done: true });
		});

		it('accepts an iterator', async () => {
			const iterator = AsyncIterator.from([1, 2, 3][Symbol.iterator]());
			await expect(iterator.next()).resolves.toEqual({ value: 1, done: false });
			await expect(iterator.next()).resolves.toEqual({ value: 2, done: false });
			await expect(iterator.next()).resolves.toEqual({ value: 3, done: false });
			await expect(iterator.next()).resolves.toEqual({ value: undefined, done: true });
		});

		it('accepts a generator', async () => {
			const generator = {
				*[Symbol.iterator]() {
					yield 1;
					yield 2;
					yield 3;
					return 4;
				}
			};
			const iterator = AsyncIterator.from(generator);
			await expect(iterator.next()).resolves.toEqual({ value: 1, done: false });
			await expect(iterator.next()).resolves.toEqual({ value: 2, done: false });
			await expect(iterator.next()).resolves.toEqual({ value: 3, done: false });
			await expect(iterator.next()).resolves.toEqual({ value: 4, done: true });
		});

		it('accepts an async generator', async () => {
			const generator = {
				async *[Symbol.asyncIterator]() {
					yield await Promise.resolve(1);
					yield await Promise.resolve(2);
					yield await Promise.resolve(3);
					return 4;
				}
			};
			const iterator = AsyncIterator.from(generator);
			await expect(iterator.next()).resolves.toEqual({ value: 1, done: false });
			await expect(iterator.next()).resolves.toEqual({ value: 2, done: false });
			await expect(iterator.next()).resolves.toEqual({ value: 3, done: false });
			await expect(iterator.next()).resolves.toEqual({ value: 4, done: true });
		});

		it('accepts an array of promises', async () => {

		});

		describe('empty arguments', () => {
			it('accepts an empty array', async () => {
				const iterator = AsyncIterator.from([]);
				await expect(iterator.next()).resolves.toEqual({ value: undefined, done: true });
			});
			it('accepts an empty generator', async () => {
				const generator = {
					*[Symbol.iterator]() {}
				};
				const iterator = AsyncIterator.from(generator);
				await expect(iterator.next()).resolves.toEqual({ value: undefined, done: true });
			});
			it('accepts an empty async generator', async () => {
				const generator = {
					async *[Symbol.asyncIterator]() {}
				};
				const iterator = AsyncIterator.from(generator);
				await expect(iterator.next()).resolves.toEqual({ value: undefined, done: true });
			});
		});
	});

	describe(AsyncIterator.prototype.drop.name, () => {
		it('works', async () => {
			await expect(AsyncIterator.from([1, 2, 3]).drop(Number.NEGATIVE_INFINITY).toArray()).resolves.toEqual([1, 2, 3]);
			await expect(AsyncIterator.from([1, 2, 3]).drop(-1).toArray()).resolves.toEqual([1, 2, 3]);
			await expect(AsyncIterator.from([1, 2, 3]).drop(0).toArray()).resolves.toEqual([1, 2, 3]);
			await expect(AsyncIterator.from([1, 2, 3]).drop(1).toArray()).resolves.toEqual([2, 3]);
			await expect(AsyncIterator.from([1, 2, 3]).drop(2).toArray()).resolves.toEqual([3]);
			await expect(AsyncIterator.from([1, 2, 3]).drop(3).toArray()).resolves.toEqual([]);
			await expect(AsyncIterator.from([1, 2, 3]).drop(4).toArray()).resolves.toEqual([]);
			await expect(AsyncIterator.from([1, 2, 3]).drop(Number.POSITIVE_INFINITY).toArray()).resolves.toEqual([]);
		})
	});

	describe(AsyncIterator.prototype.every.name, () => {
		it('works', async () => {
			await expect(AsyncIterator.from([1, 2, 3]).every(i => typeof i === 'number')).resolves.toEqual(true);
			await expect(AsyncIterator.from([1, 2, 3]).every(i => 1 <= i && i <= 3)).resolves.toEqual(true);
			await expect(AsyncIterator.from([1, 2, 3]).every(i => i === 1)).resolves.toEqual(false);
			await expect(AsyncIterator.from([1, 2, 3]).every(i => i === 3)).resolves.toEqual(false);
		})
	});

	describe(AsyncIterator.prototype.filter.name, () => {
		it('works', async () => {

		})
	});

	describe(AsyncIterator.prototype.find.name, () => {
		it('works', async () => {

		})
	});

	describe(AsyncIterator.prototype.flatMap.name, () => {
		it('works', async () => {

		})
	});

	describe(AsyncIterator.prototype.forEach.name, () => {
		it('works', async () => {

		})
	});

	describe(AsyncIterator.prototype.map.name, () => {
		it('works', async () => {

		})
	});

	describe(AsyncIterator.prototype.take.name, () => {
		it('works', async () => {

		})
	});

	describe(AsyncIterator.prototype.reduce.name, () => {
		it('works', async () => {

		})
	});

	describe(AsyncIterator.prototype.some.name, () => {
		it('works', async () => {

		})
	});

	describe(AsyncIterator.prototype.toArray.name, () => {
		it('works', async () => {

		})
	});

});
