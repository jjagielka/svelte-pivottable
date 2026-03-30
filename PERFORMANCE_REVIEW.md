# Performance Review: `PivotData.ts`

`processRecord` is the hot path — called once per data record inside a tight loop. Nearly every finding below lives there.

---

## 1. `String.fromCharCode(0)` called on every `flatKey` invocation — **Critical**

```typescript
// line 11
const flatKey = (arr: Datum[]) => arr.join(String.fromCharCode(0));
```

`flatKey` is called at least twice per record (once for rowKey, once for colKey), more when `grouping=true`. `String.fromCharCode(0)` is a function call every single time. Fix is trivial:

```typescript
const NULL_CHAR = String.fromCharCode(0);
const flatKey = (arr: Datum[]) => arr.join(NULL_CHAR);
```

---

## 2. `Array.from()` on arrays that are already arrays — **High**

```typescript
// lines 147–152
for (const x of Array.from(this.props.cols)) { ... }
for (const x of Array.from(this.props.rows)) { ... }
```

`this.props.cols` and `this.props.rows` are `string[]`. `Array.from()` allocates a full copy of each on every record. Just iterate directly. Same problem exists in `arrSort` (line 89) and `forEachRecord` (line 279):

```typescript
const sortersArr = Array.from(attrs).map(...)   // attrs is already string[]
return Array.from(input as Data[]).map(addRecord); // input is already Data[]
```

---

## 3. Dynamic array push instead of pre-allocated arrays — **High**

```typescript
let _colKeys: Datum[] = [];
_colKeys.push(x in record ? record[x] : 'null');
```

The length is known (`cols.length`/`rows.length`). Dynamic push causes incremental resizing. Use pre-allocated arrays with index assignment:

```typescript
const colLen = cols.length;
const _colKeys: Datum[] = new Array(colLen);
for (let i = 0; i < colLen; i++) {
    const x = cols[i];
    _colKeys[i] = x in record ? record[x] : 'null';
}
```

This also lets V8 use a packed array type rather than a holey one.

---

## 4. Repeated property lookups on `this.props` inside the hot loop — **High**

`this.props.cols`, `this.props.rows`, `this.props.grouping` are all looked up through two property accesses on every iteration. Cache them as local `const` references at the top of `processRecord`:

```typescript
processRecord(record: Data) {
    const { cols, rows, grouping } = this.props;
    ...
}
```

This is especially impactful for `grouping`, which is tested inside the double loop:
```typescript
// lines 170, 180
if (!(this.props.grouping && colKey.length !== 1)) { ... }
```

---

## 5. `flatColKey` recomputed inside the outer `rowKey` loop — **High when `grouping=true`**

```typescript
for (const rowKey of rowKeys) {
    const flatRowKey = flatKey(rowKey);
    for (const colKey of colKeys) {
        const flatColKey = flatKey(colKey);   // ← only depends on colKey
```

`flatColKey` depends only on `colKey`, but is recomputed for every `(rowKey, colKey)` pair. With R rowKeys and C colKeys, this runs `R × C` times instead of `C`. Pre-compute:

```typescript
const flatColKeys = colKeys.map(flatKey);   // computed C times, before rowKey loop
for (const rowKey of rowKeys) {
    const flatRowKey = flatKey(rowKey);
    for (let ci = 0; ci < colKeys.length; ci++) {
        const colKey = colKeys[ci];
        const flatColKey = flatColKeys[ci];
```

---

## 6. `filter()` iterates over an empty object for every record — **Medium**

When `valueFilter` is `{}`, the `for...in` loop still executes for every single record. The `derivedAttributes` path already short-circuits correctly (line 228). Same fix here — set a boolean flag in the constructor:

```typescript
// constructor
this._hasFilter = Object.keys(this.props.valueFilter).length > 0;

// filter()
filter(record: Data) {
    if (!this._hasFilter) return true;
    ...
}
```

---

## 7. `getColKeys`/`getRowKeys` allocate a new filtered array on every call — **Medium**

```typescript
// lines 134, 139
return all_keys ? this.colKeys : this.colKeys.filter((x) => x.length === this.props.cols.length);
```

Since `PivotData` is immutable post-construction, cache the filtered result on first call:

```typescript
private _leafColKeys?: Datum[][];

getColKeys(all_keys = false) {
    this.sortKeys();
    if (all_keys) return this.colKeys;
    return (this._leafColKeys ??= this.colKeys.filter((x) => x.length === this.props.cols.length));
}
```

---

## 8. Potential runtime crash in `getAggregator` — **Bug**

```typescript
// line 210
agg = this.tree[flatRowKey][flatColKey];
```

If `this.tree[flatRowKey]` is `undefined` (a row/col combination where all records were filtered out), this throws `TypeError`. The fallback on lines 212–221 never gets a chance to run. Fix:

```typescript
agg = this.tree[flatRowKey]?.[flatColKey];
```

---

## Bonus: `uniques` aggregator is O(n²) — **Critical for `Count Unique Values`/`List Unique Values`**

In `Utilities.ts` lines 168–170:

```typescript
push(record: Data) {
    if (!Array.from(this.uniq).includes(record[attr])) {
        this.uniq.push(record[attr]);
    }
},
```

`Array.from(this.uniq)` creates a full copy of the growing array, then `.includes()` is a linear scan — making each push O(n) and the whole aggregation O(n²). Use a `Set` as a companion for O(1) membership testing:

```typescript
{
    uniq: [] as Datum[],
    seen: new Set<Datum>(),
    push(record: Data) {
        const v = record[attr];
        if (!this.seen.has(v)) {
            this.seen.add(v);
            this.uniq.push(v);
        }
    },
```

---

## Summary

| # | Location | Issue | Impact |
|---|----------|-------|--------|
| 1 | `flatKey` | `String.fromCharCode(0)` called per invocation | Critical |
| 2 | `processRecord`, `arrSort`, `forEachRecord` | `Array.from()` on arrays | High |
| 3 | `processRecord` | `push` vs pre-allocated array | High |
| 4 | `processRecord` | Repeated `this.props.*` lookups in loop | High |
| 5 | `processRecord` | `flatColKey` recomputed R×C instead of C times | High (grouping) |
| 6 | `filter` | `for...in` on empty object per record | Medium |
| 7 | `getColKeys`/`getRowKeys` | Repeated `.filter()` allocation | Medium |
| 8 | `getAggregator` | Potential crash on missing tree key | Bug |
| B | `Utilities.ts` `uniques` | O(n²) includes-on-copy | Critical |

Items 1–5 are all in the record-processing hot path and compound each other — fixing them together will give the most noticeable speedup on large datasets.
