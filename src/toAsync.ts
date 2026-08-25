import { AsyncIterator } from './AsyncIterator.js';

export const toAsync = Symbol('Iterator.toAsync');

globalThis.Iterator.prototype[toAsync] = function() {
	return AsyncIterator.from(this);
};

declare global {
	interface Iterator<T> {
		[toAsync](): AsyncIterator<T>;
	}
}
