/**
 * Ponyfill implementation of protosal 'proposal-async-iterator-helpers'.
 * (https://github.com/tc39/proposal-async-iterator-helpers)
 *
 * 'Ponyfill' means this package exports a class that implements the proposal without modifying any global objects.
 */
export class AsyncIterator<TYield> implements globalThis.AsyncIterator<TYield> {
	static from<T, TReturn = any, TNext = any>(
		source: Iterator<T, TReturn, TNext> | Iterable<T>
			| globalThis.AsyncIterator<T, TReturn, TNext> | AsyncIterable<T, TReturn, TNext>
	): AsyncIterator<T> {
		return new AsyncIterator(
			(
				Symbol.iterator in source ? source[Symbol.iterator]()
					: Symbol.asyncIterator in source ? source[Symbol.asyncIterator]()
					: source
			) as globalThis.AsyncIterator<T>
		);
	}

	static fromStream<T>(stream: ReadableStream<T>): AsyncIterator<T> {
		return AsyncIterator.from<T>(async function*() {
			const reader = stream.getReader();
			try {
				for (let done: boolean, value: T|undefined; {done, value} = await reader.read(), !done;) {
					yield value!;
				}
			} finally {
				reader.releaseLock();
			}
		}());
	}

	static fromEvents<E extends Event = Event>(
		target: EventTarget,
		eventName: string,
		{ abort = null as AbortSignal|string|null } = {},
	): AsyncIterator<E> {
		const controller = new AbortController();
		const buffer: E[] = [];
		const bufferNotifier = new EventTarget();
		target.addEventListener(eventName, e => {
			buffer.push(e as E);
			bufferNotifier.dispatchEvent(new Event('buffered'));
		}, { signal: controller.signal, capture: true });
		if (typeof abort === 'string') {
			target.addEventListener(abort, () => controller.abort(), { signal: controller.signal, capture: true });
		}
		if (abort instanceof AbortSignal) {
			abort.addEventListener('abort', () => controller.abort(), { once: true });
		}
		return AsyncIterator.from({
			async next(): Promise<IteratorResult<E>> {
				if (controller.signal.aborted) {
					return { value: undefined, done: true };
				}
				if (buffer.length) {
					return { value: buffer.shift()!, done: false };
				}
				await new Promise<void>(resolve => {
					bufferNotifier.addEventListener('buffered', () => resolve(), { capture: true, once: true });
					controller.signal.addEventListener('abort', () => resolve());
				});
				return this.next();
			},
		} satisfies globalThis.AsyncIterator<E>);
	}

	private constructor(
		private source: globalThis.AsyncIterator<TYield>,
	) {}

	[Symbol.asyncIterator](): globalThis.AsyncIterator<TYield> {
		return this;
	}

	async next(): Promise<IteratorResult<TYield>> {
		return this.source.next();
	}

	drop(limit: number): AsyncIterator<TYield> {
		const _this = this;
		return new AsyncIterator((async function* () {
			let i = 0;
			for await (const value of _this) {
				if (i++ < limit) {
					continue;
				}
				yield value;
			}
		})());
	}

	async every(predicate: (value: TYield) => boolean): Promise<boolean> {
		for await (const value of this) {
			if (!predicate(value)) {
				return false;
			}
		}
		return true;
	}

	filter(predicate: (value: TYield) => boolean): AsyncIterator<TYield>;
	filter<TYieldR extends TYield = TYield>(predicate: (value: TYield) => value is TYieldR): AsyncIterator<TYieldR>;
	filter(predicate: (value: TYield) => boolean): AsyncIterator<TYield> {
		const _this = this;
		return new AsyncIterator((async function* () {
			for await (const value of _this) {
				if (predicate(value)) {
					yield value;
				}
			}
		})());
	}

	async find(predicate: (value: TYield) => boolean): Promise<TYield | undefined> {
		for await (const value of this) {
			if (predicate(value)) {
				return value;
			}
		}
		return undefined;
	}

	flatMap<TNew>(mapper: (value: TYield) => AsyncIterator<TNew>): AsyncIterator<TNew> {
		const _this = this;
		return new AsyncIterator((async function* () {
			for await (const value of _this) {
				for await (const newValue of mapper(value)) {
					yield newValue;
				}
			}
		})());
	}

	async forEach(callback: (value: TYield) => void|Promise<void>): Promise<void> {
		for await (const value of this) {
			await callback(value);
		}
	}

	map<TNew>(mapper: (value: TYield) => TNew|Promise<TNew>): AsyncIterator<TNew> {
		const _this = this;
		return new AsyncIterator((async function* () {
			for await (const value of _this) {
				yield await mapper(value);
			}
		})());
	}

	async reduce<TAccumulator>(reducer: (accumulator: TAccumulator, value: TYield, index: number) => TAccumulator|Promise<TAccumulator>, initialValue: TAccumulator): Promise<TAccumulator> {
		let accumulator = initialValue;
		let index = 0;
		for await (const value of this) {
			accumulator = await reducer(accumulator, value, index++);
		}
		return accumulator;
	}

	async some(predicate: (value: TYield) => boolean): Promise<boolean> {
		for await (const value of this) {
			if (predicate(value)) {
				return true;
			}
		}
		return false;
	}

	take(count: number): AsyncIterator<TYield> {
		const _this = this;
		return new AsyncIterator((async function* () {
			let i = 0;
			for await (const value of _this) {
				if (i++ >= count) {
					break;
				}
				yield value;
			}
		})());
	}

	async toArray(): Promise<TYield[]> {
		return this.reduce((acc, value) => {
			acc.push(value);
			return acc;
		}, [] as TYield[]);
	}

	toStream(): ReadableStream<TYield> {
		return new ReadableStream({
			pull: async controller => {
				const { value, done } = await this.next();
				if (done) {
					controller.close();
				} else {
					controller.enqueue(value);
				}
			},
		});
	}
}
