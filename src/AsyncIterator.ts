/**
 * Ponyfill implementation of proposal 'proposal-async-iterator-helpers'.
 * (https://github.com/tc39/proposal-async-iterator-helpers)
 *
 * Async Iterator Protocol:
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_async_iterator_and_async_iterable_protocols
 *
 * AsyncIterator interface:
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncIterator
 */
export class AsyncIterator<T, TReturn = any, TNext = any>
	implements globalThis.AsyncIterator<T, TReturn, TNext>,
		AsyncIterable<T, TReturn, TNext>
{
	//==================================================================================================================
	// Statics & constructor
	//==================================================================================================================

	static from<T, TReturn = any, TNext = any>(
		source: Iterator<T, TReturn, TNext> | Iterable<T, TReturn, TNext>
			| Iterable<Promise<T>, TReturn, TNext> | Iterator<Promise<T>, TReturn, TNext>
			| globalThis.AsyncIterator<T, TReturn, TNext> | AsyncIterable<T, TReturn, TNext>
	): AsyncIterator<T, TReturn, TNext> {
		if (source instanceof AsyncIterator) {
			return source;
		}
		const iterator = Symbol.iterator in source ? source[Symbol.iterator]()
			: Symbol.asyncIterator in source ? source[Symbol.asyncIterator]()
			: source;
		return new AsyncIterator(async function*() {
			let result;
			while ((result = await iterator.next(), !result.done)) {
				yield await result.value;
			}
			return result.value;
		}());
	}

	constructor(
		private source: globalThis.AsyncIterator<T>,
	) {}

	//==================================================================================================================
	// Async iterable protocol
	//==================================================================================================================

	[Symbol.asyncIterator](): globalThis.AsyncIterator<T> {
		return this;
	}

	//==================================================================================================================
	// Async iterator protocol
	//==================================================================================================================

	async next(): Promise<IteratorResult<T, TReturn>>;
	async next(value: TNext): Promise<IteratorResult<T, TReturn>>;
	async next(value?: TNext): Promise<IteratorResult<T, TReturn>> {
		return this.source.next(value);
	}

	async return(value?: TReturn | PromiseLike<TReturn> | undefined): Promise<IteratorResult<T, TReturn>> {
		return this.source.return?.(value)
			?? Promise.resolve({ value: await value, done: true });
	}

	async throw(e?: any): Promise<IteratorResult<T, TReturn>> {
		return this.source.throw?.(e)
			?? Promise.resolve({ value: undefined, done: true });
	}

	//==================================================================================================================
	// Async iterator helpers
	//==================================================================================================================

	/**
	 * Creates a new async iterator that ignores the first `limit` values and yields the rest.
	 *
	 * @param limit The number of values to ignore.
	 * @returns A new async iterator.
	 */
	drop(limit: number): AsyncIterator<T> {
		return new AsyncIterator((async function* (this: AsyncIterator<T, TReturn, TNext>) {
			for (let i = 0; i < limit; i++) {
				const result = await this.next();
				if (result.done) {
					return;
				}
			}
			yield* this;
		}).call(this));
	}

	/**
	 * Consumes the entire iterator, calling the provided predicate function for each value yielded by this iterator.
	 * This method returns a promise that resolves when the iterator is exhausted. The promise resolves to true if the
	 * predicate returned true for all values. If the predicate returns false for any value, the iteration stops and the
	 * promise resolves to false.
	 *
	 * @remarks
	 *
	 * The predicate function is expected to return a boolean value or a promise that resolves to a boolean value. If
	 * the predicate function returns a non-boolean value or the returned promise resolves to a non-boolean value, it
	 * will be coerced to a boolean value using the `Boolean` constructor.
	 *
	 * @param predicate A function that takes a value and returns a boolean.
	 * @returns A promise that resolves to true if the predicate returned true for all values, or false if it returns
	 * false for any value.
	 */
	async every(predicate: (value: T) => boolean | Promise<boolean>): Promise<boolean> {
		for await (const value of this) {
			if (!Boolean(await predicate(value))) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Creates a new async iterator that consumes this iterator and yields only the values for which the provided
	 * predicate function returns true.
	 *
	 * @remarks
	 *
	 * The predicate function is expected to return a boolean value or a promise that resolves to a boolean value. If
	 * the predicate function returns a non-boolean value or the returned promise resolves to a non-boolean value, it
	 * will be coerced to a boolean value using the `Boolean` constructor.
	 *
	 * @param predicate A function that takes a value and returns a boolean.
	 * @returns A new async iterator that yields only the values for which the predicate function returns true.
	 */
	filter<TYieldR extends T = T>(predicate: (value: T) => value is TYieldR): AsyncIterator<TYieldR>;
	filter(predicate: (value: T) => boolean | Promise<boolean>): AsyncIterator<T>;
	filter(predicate: (value: T) => boolean | Promise<boolean>): AsyncIterator<T> {
		return new AsyncIterator((async function* (this: AsyncIterator<T, TReturn, TNext>) {
			for await (const value of this) {
				if (Boolean(await predicate(value))) {
					yield value;
				}
			}
		}).call(this));
	}

	/**
	 * Consumes the entire iterator, calling the provided predicate function for each value yielded by this iterator.
	 * Returns a promise that resolves to the first value for which the predicate returns true. If no such value is
	 * found, the promise resolves to undefined.
	 *
	 * @param predicate A function that takes a value and returns a boolean or a promise that resolves to a boolean.
	 * @returns A promise that resolves to the first value for which the predicate returns true, or undefined if no such
	 * value is found.
	 */
	async find(predicate: (value: T) => boolean | Promise<boolean>): Promise<T | undefined> {
		for await (const value of this) {
			if (await predicate(value)) {
				return value;
			}
		}
		return undefined;
	}

	/**
	 * Creates a new async iterator by applying the provided mapper function to each value yielded by this iterator. The
	 * mapper function is expected to return an iterator or async iterator of new values. The returned iterator yields
	 * each of the values returned by the mapper function, in the order they are yielded.
	 *
	 * @param mapper A function that takes a value and returns an iterator, async iterator, or iterator of promises.
	 * @returns A new async iterator that yields the values from the iterators returned by the mapper function.
	 */
	flatMap<TNew>(
		mapper: (value: T) => Iterable<TNew> | Iterator<TNew>
			| Promise<Iterable<TNew>> | Promise<Iterator<TNew>>
			| Iterable<Promise<TNew>> | Iterator<Promise<TNew>>
			| Promise<Iterable<Promise<TNew>>> | Promise<Iterator<Promise<TNew>>>
			| AsyncIterable<TNew> | AsyncIterator<TNew>,
	): AsyncIterator<TNew> {
		return new AsyncIterator((async function* (this: AsyncIterator<T, TReturn, TNext>) {
			for await (const many of this) {
				for await (const single of AsyncIterator.from(await mapper(many))) {
					yield single;
				}
			}
		}).call(this));
	}

	/**
	 * Consumes the entire iterator, calling the provided callback function for each value yielded by this iterator.
	 * Returns a promise that resolves when the iterator is exhausted.
	 *
	 * @param callback A function that takes a value and returns void or a promise that resolves to void.
	 * @returns A promise that resolves when the iterator is exhausted.
	 */
	async forEach(callback: (value: T) => void|Promise<void>): Promise<void> {
		for await (const value of this) {
			await callback(value);
		}
	}

	/**
	 * Creates a new async iterator that applies the provided mapper function to each value yielded by this iterator.
	 * The mapper function can return a value or a promise of a value. The returned iterator yields the values returned
	 * by the mapper function.
	 *
	 * @param mapper A function that takes a value and returns a new value or a promise of a new value.
	 * @returns A new async iterator that yields the values returned by the mapper function.
	 */
	map<TNew>(mapper: (value: T) => TNew | Promise<TNew>): AsyncIterator<TNew> {
		return new AsyncIterator((async function* (this: AsyncIterator<T, TReturn, TNext>) {
			for await (const value of this) {
				yield await mapper(value);
			}
		}).call(this));
	}

	/**
	 * Consumes the entire iterator, calling the provided reducer function for each value yielded by this iterator.
	 * Returns a promise that resolves to the final accumulated value, after this iterator is exhausted.
	 *
	 * @remarks
	 *
	 * If no {@link initialValue} is provided, the first value yielded by this iterator is used as the initial
	 * accumulator, and the reducer function is not called for that first value.
	 *
	 * If the iterator exhausts without yielding any value, the promise resolves to the {@link initialValue} argument.
	 *
	 * If the iterator exhausts without yielding any value and no {@link initialValue} is provided, the promise is
	 * rejected with an error.
	 *
	 * @param reducer A function that takes an accumulator value and a value yielded by this iterator, and returns a new
	 * accumulator or a promise of a new accumulator.
	 * @param initialValue The initial value to use as the accumulator for the first call to the reducer function.
	 * @returns A promise that resolves to the final accumulated value.
	 */
	async reduce(reducer: (accumulator: T, value: T) => T | Promise<T>): Promise<T>;
	async reduce<TAccumulator>(
		reducer: (accumulator: TAccumulator, value: T) => TAccumulator | Promise<TAccumulator>,
		initialValue: TAccumulator
	): Promise<TAccumulator>;
	async reduce(
		reducer: (accumulator: any, value: T) => any|Promise<any>,
		initialValue?: any
	): Promise<any> {
		if (arguments.length < 2) {
			const result = await this.next();
			if (result.done) {
				throw new Error('Failed to reduce async iterator. Cause: Iterator is empty and has no initial value.');
			}
			initialValue = result.value;
		}
		let accumulator = initialValue;
		for await (const value of this) {
			accumulator = await reducer(accumulator, value);
		}
		return accumulator;
	}

	/**
	 * Consumes the entire iterator, calling the provided predicate function for each value yielded by this iterator.
	 * Returns a promise that resolves to true if the predicate returns true; or to false if this iterator is exhausted
	 * without the predicate returning true for any value.
	 *
	 * @remarks
	 *
	 * The predicate function is expected to return a boolean value or a promise that resolves to a boolean value. If
	 * the predicate function returns a non-boolean value or the returned promise resolves to a non-boolean value, it
	 * will be coerced to a boolean value using the `Boolean` constructor.
	 *
	 * @param predicate A function that takes a value and returns a boolean or a promise that resolves to a boolean.
	 * @returns A promise that resolves to true if the predicate returns true for any value, or false if the iterator is
	 * exhausted without the predicate returning true for any value.
	 */
	async some(predicate: (value: T) => boolean | Promise<boolean>): Promise<boolean> {
		for await (const value of this) {
			if (Boolean(await predicate(value))) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Creates a new async iterator that yields only the first {@link count} values from this iterator. The returned
	 * iterator is exhausted after yielding that many values, or earlier if this iterator is exhausted.
	 *
	 * @param count The number of values to yield from this iterator.
	 * @returns A new async iterator that yields only the first {@link count} values from this iterator.
	 */
	take(count: number): AsyncIterator<T> {
		return new AsyncIterator((async function* (this: AsyncIterator<T, TReturn, TNext>) {
			for (let i = 0; i < count; i++) {
				const result = await this.next();
				if (result.done) {
					break;
				}
				yield result.value;
			}
		}).call(this));
	}

	/**
	 * Consumes the entire iterator and collects all yielded values into an array. Returns a promise that resolves when
	 * this iterator is exhausted. The promise is resolved with an array containing all the values yielded by this
	 * iterator.
	 *
	 * @returns A promise that resolves to an array containing all the values yielded by this iterator.
	 */
	async toArray(): Promise<T[]> {
		const array: T[] = [];
		for (let result; (result = await this.next(), !result.done);) {
			array.push(result.value);
		}
		return array;
	}
}
