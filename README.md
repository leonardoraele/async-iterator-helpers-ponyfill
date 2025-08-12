# Async Iterator Helpers Ponyfill

A [ponyfill] implementation of the `AsyncIterator` class compliant with the [proposal-async-iterator-helpers].

> ⚠ **Still in development. Not very well tested yet. Do not use in production.**

[ponyfill]: https://github.com/sindresorhus/ponyfill
[proposal-async-iterator-helpers]: https://github.com/tc39/proposal-async-iterator-helpers

## Installation

Install the package using npm:

```bash
npm install async-iterator-helpers-ponyfill
```

## Usage

Import the `AsyncIterator` class and use its methods to work with asynchronous iterators.

### Example

```typescript
import { AsyncIterator } from 'async-iterator-helpers-ponyfill';

// Example: Using `from` to create an AsyncIterator from an iterator, from an iterable, from an async iterator, or from
// an async iterable.
const asyncIterator = AsyncIterator.from([1, 2, 3, 4]);

// Example: Using `map` to transform values
const mappedIterator = asyncIterator.map(x => Promise.resolve(x * 2));

console.log(await mappedIterator.toArray()); // Output: [2, 4, 6, 8]
```

### Static Methods

- `AsyncIterator.from(source)`: Creates an `AsyncIterator` from an iterable or async iterable.
- `AsyncIterator.fromStream(stream)`: Creates an `AsyncIterator` from a `ReadableStream`.

### Instance Methods

- `drop(limit)`: Skips the first `limit` items.
- `every(predicate)`: Checks if all items satisfy the predicate.
- `filter(predicate)`: Filters items based on the predicate.
- `find(predicate)`: Finds the first item that satisfies the predicate.
- `flatMap(mapper)`: Maps and flattens items.
- `forEach(callback)`: Executes a callback for each item.
- `map(mapper)`: Transforms items using the mapper function.
- `reduce(reducer, initialValue)`: Reduces items to a single value.
- `some(predicate)`: Checks if any item satisfies the predicate.
- `take(count)`: Takes the first `count` items.
- `toArray()`: Converts the iterator to an array.
- `toStream()`: Converts the iterator to a `ReadableStream`.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
