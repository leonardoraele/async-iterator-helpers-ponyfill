import { describe, it, expect, test } from 'vitest';
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
			const iterator = AsyncIterator.from([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)]);
			await expect(iterator.next()).resolves.toEqual({ value: 1, done: false });
			await expect(iterator.next()).resolves.toEqual({ value: 2, done: false });
			await expect(iterator.next()).resolves.toEqual({ value: 3, done: false });
			await expect(iterator.next()).resolves.toEqual({ value: undefined, done: true });
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
			await expect(AsyncIterator.from([1, 2, 3]).drop(0).toArray()).resolves.toEqual([1, 2, 3]);
			await expect(AsyncIterator.from([1, 2, 3]).drop(1).toArray()).resolves.toEqual([2, 3]);
			await expect(AsyncIterator.from([1, 2, 3]).drop(2).toArray()).resolves.toEqual([3]);
			await expect(AsyncIterator.from([1, 2, 3]).drop(3).toArray()).resolves.toEqual([]);
			await expect(AsyncIterator.from([1, 2, 3]).drop(4).toArray()).resolves.toEqual([]);
			await expect(AsyncIterator.from([1, 2, 3]).drop(Number.POSITIVE_INFINITY).toArray()).resolves.toEqual([]);
		});
	});

	describe(AsyncIterator.prototype.every.name, () => {
		it('works with synchronous predicate functions', async () => {
			await expect(AsyncIterator.from([1, 2, 3]).every(i => typeof i === 'number')).resolves.toEqual(true);
			await expect(AsyncIterator.from([1, 2, 3]).every(i => 1 <= i && i <= 3)).resolves.toEqual(true);
			await expect(AsyncIterator.from([1, 2, 3]).every(i => i === 1)).resolves.toEqual(false);
			await expect(AsyncIterator.from([1, 2, 3]).every(i => i === 3)).resolves.toEqual(false);
		});
		it('works with asynchronous predicate functions', async () => {
			await expect(AsyncIterator.from([1, 2, 3]).every(async i => typeof i === 'number')).resolves.toEqual(true);
			await expect(AsyncIterator.from([1, 2, 3]).every(async i => 1 <= i && i <= 3)).resolves.toEqual(true);
			await expect(AsyncIterator.from([1, 2, 3]).every(async i => i === 1)).resolves.toEqual(false);
			await expect(AsyncIterator.from([1, 2, 3]).every(async i => i === 3)).resolves.toEqual(false);
		});
	});

	describe(AsyncIterator.prototype.filter.name, () => {
		it('works with synchronous predicate functions', async () => {
			await expect(AsyncIterator.from([1, 2, 3, 4]).filter(() => true).toArray()).resolves.toEqual([1, 2, 3, 4]);
			await expect(AsyncIterator.from([1, 2, 3, 4]).filter(() => false).toArray()).resolves.toEqual([]);
			await expect(AsyncIterator.from([1, 2, 3, 4]).filter(i => i % 2 === 0).toArray()).resolves.toEqual([2, 4]);
			await expect(AsyncIterator.from([1, 2, 3, 4]).filter(i => i % 2 === 1).toArray()).resolves.toEqual([1, 3]);
		});
		it('works with asynchronous predicate functions', async () => {
			await expect(AsyncIterator.from([1, 2, 3, 4]).filter(async () => true).toArray()).resolves.toEqual([1, 2, 3, 4]);
			await expect(AsyncIterator.from([1, 2, 3, 4]).filter(async () => false).toArray()).resolves.toEqual([]);
			await expect(AsyncIterator.from([1, 2, 3, 4]).filter(async i => i % 2 === 0).toArray()).resolves.toEqual([2, 4]);
			await expect(AsyncIterator.from([1, 2, 3, 4]).filter(async i => i % 2 === 1).toArray()).resolves.toEqual([1, 3]);
		});
	});

	describe(AsyncIterator.prototype.find.name, () => {
		it('works with synchronous predicate functions', async () => {
			await expect(AsyncIterator.from([1, 2, 3]).find(i => i < 2)).resolves.toBe(1);
			await expect(AsyncIterator.from([1, 2, 3]).find(i => i === 2)).resolves.toBe(2);
			await expect(AsyncIterator.from([1, 2, 3]).find(i => i > 2)).resolves.toBe(3);
			await expect(AsyncIterator.from([1, 2, 3]).find(i => i < 1 || 3 < i)).resolves.toBeUndefined();
			await expect(AsyncIterator.from([1, 2, 3]).find(() => true)).resolves.toBe(1);
			await expect(AsyncIterator.from([1, 2, 3]).find(() => false)).resolves.toBeUndefined();
		});
		it('works with asynchronous predicate functions', async () => {
			await expect(AsyncIterator.from([1, 2, 3]).find(async i => i < 2)).resolves.toBe(1);
			await expect(AsyncIterator.from([1, 2, 3]).find(async i => i === 2)).resolves.toBe(2);
			await expect(AsyncIterator.from([1, 2, 3]).find(async i => i > 2)).resolves.toBe(3);
			await expect(AsyncIterator.from([1, 2, 3]).find(async i => i < 1 || 3 < i)).resolves.toBeUndefined();
			await expect(AsyncIterator.from([1, 2, 3]).find(async () => true)).resolves.toBe(1);
			await expect(AsyncIterator.from([1, 2, 3]).find(async () => false)).resolves.toBeUndefined();
		});
	});

	describe(AsyncIterator.prototype.flatMap.name, () => {
		it('works with synchronous mapping functions', async () => {
			await expect(AsyncIterator.from([1, 2, 3]).flatMap(i => [i, i * 10]).toArray()).resolves.toEqual([1, 10, 2, 20, 3, 30]);
			await expect(AsyncIterator.from([1, 2, 3]).flatMap(() => []).toArray()).resolves.toEqual([]);
		});
		it('works with asynchronous mapping functions', async () => {
			await expect(AsyncIterator.from([1, 2, 3]).flatMap(async i => [i, i * 10]).toArray()).resolves.toEqual([1, 10, 2, 20, 3, 30]);
			await expect(AsyncIterator.from([1, 2, 3]).flatMap(async () => []).toArray()).resolves.toEqual([]);
		});
		it('works with another async iterator', async () => {
			await expect(AsyncIterator.from([1, 2, 3]).flatMap(i => AsyncIterator.from([i, i * 10])).toArray()).resolves.toEqual([1, 10, 2, 20, 3, 30]);
			await expect(AsyncIterator.from([1, 2, 3]).flatMap(() => AsyncIterator.from([])).toArray()).resolves.toEqual([]);
		});
	});

	describe(AsyncIterator.prototype.forEach.name, () => {
		it('works', async () => {
			const seen: number[] = [];
			await AsyncIterator.from([1, 2, 3]).forEach(async value => {
				seen.push(value);
				await Promise.resolve();
			});
			expect(seen).toEqual([1, 2, 3]);
		});
	});

	describe(AsyncIterator.prototype.map.name, () => {
		it('works with synchronous mapping functions', async () => {
			await expect(AsyncIterator.from([1, 2, 3]).map(value => value * 2).toArray()).resolves.toEqual([2, 4, 6]);
		});
		it('works with asynchronous mapping functions', async () => {
			await expect(AsyncIterator.from([1, 2, 3]).map(async value => value * 2).toArray()).resolves.toEqual([2, 4, 6]);
		});
	});

	describe(AsyncIterator.prototype.take.name, () => {
		it('works', async () => {
			await expect(AsyncIterator.from([1, 2, 3]).take(0).toArray()).resolves.toEqual([]);
			await expect(AsyncIterator.from([1, 2, 3]).take(2).toArray()).resolves.toEqual([1, 2]);
			await expect(AsyncIterator.from([1, 2, 3]).take(10).toArray()).resolves.toEqual([1, 2, 3]);
			await expect(AsyncIterator.from([1, 2, 3]).take(Number.POSITIVE_INFINITY).toArray()).resolves.toEqual([1, 2, 3]);
		});
	});

	describe(AsyncIterator.prototype.reduce.name, () => {
		describe('with no initial value', () => {
			test('empty iterator', async () => {
				await expect(AsyncIterator.from([]).reduce((acc, _value) => acc)).rejects.toThrow();
			});
			test('single element iterator', async () => {
				await expect(AsyncIterator.from([1]).reduce((acc, value) => acc + value)).resolves.toEqual(1);
			});
			test('multiple element iterator', async () => {
				await expect(AsyncIterator.from([1, 2, 3]).reduce((acc, value) => acc + value)).resolves.toEqual(6);
			});
		});
		describe('with an initial value', () => {
			test('empty iterator', async () => {
				await expect(AsyncIterator.from([]).reduce((acc, value) => acc + value, 10)).resolves.toEqual(10);
			});
			test('single element iterator', async () => {
				await expect(AsyncIterator.from([1]).reduce((acc, value) => acc + value, 10)).resolves.toEqual(11);
			});
			test('multiple element iterator', async () => {
				await expect(AsyncIterator.from([1, 2, 3]).reduce((acc, value) => acc + value, 10)).resolves.toEqual(16);
			});
		});
	});

	describe(AsyncIterator.prototype.some.name, () => {
		it('works', async () => {
			await expect(AsyncIterator.from([1, 2, 3]).some(() => true)).resolves.toEqual(true);
			await expect(AsyncIterator.from([1, 2, 3]).some(i => i > 2)).resolves.toEqual(true);
			await expect(AsyncIterator.from([1, 2, 3]).some(i => i === 2)).resolves.toEqual(true);
			await expect(AsyncIterator.from([1, 2, 3]).some(i => i < 2)).resolves.toEqual(true);
			await expect(AsyncIterator.from([1, 2, 3]).some(() => false)).resolves.toEqual(false);
			await expect(AsyncIterator.from([1, 2, 3]).some(i => i > 10)).resolves.toEqual(false);
		});
	});

	describe(AsyncIterator.prototype.toArray.name, () => {
		it('works', async () => {
			await expect(AsyncIterator.from([1, 2, 3]).toArray()).resolves.toEqual([1, 2, 3]);
			await expect(AsyncIterator.from([]).toArray()).resolves.toEqual([]);
		});
	});
});
