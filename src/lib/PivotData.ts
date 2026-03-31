
import type { Datum } from "plotly.js";
import type { Aggregator, Data, DerivedAttrs, PivotDataProps, Values } from "./types";
import { aggregators, getSort, naturalSort } from "./Utilities";



// [1,2,3] -> [[1], [1,2], [1,2,3]]
const subarrays = <T>(array: T[]) => array.map((_, i) => array.slice(0, i + 1));

// NULL_CHAR is used as a separator for composite keys. Values containing \u0000 will produce key collisions.
const NULL_CHAR = String.fromCharCode(0);
const flatKey = (arr: Datum[]) => arr.join(NULL_CHAR);

/*
Data Model class
*/
class PivotData {
    static readonly defaultProps: PivotDataProps = {
        cols: [],
        rows: [],
        vals: [],
        sorters: {},
        valueFilter: {},
        rowOrder: 'key_a_to_z',
        colOrder: 'key_a_to_z',
        derivedAttributes: {},
        grouping: false,
        rowGroupBefore: true,
        colGroupBefore: false,
        aggregator: aggregators["Count"],
        data: []
    }

    props: PivotDataProps;
    rowKeys: Datum[][];
    colKeys: Datum[][];
    tree: Record<string, Record<string, Aggregator>>;
    rowTotals: Record<string, Aggregator>;
    colTotals: Record<string, Aggregator>;
    allTotal: Aggregator;
    sorted: boolean;
    aggregator: ReturnType<PivotDataProps['aggregator']>;
    private _hasFilter: boolean;
    private _leafColKeys?: Datum[][];
    private _leafRowKeys?: Datum[][];

    constructor(inputProps: Partial<PivotDataProps> = {}) {
        this.props = Object.assign({}, PivotData.defaultProps, inputProps);

        this.aggregator = this.props.aggregator(this.props.vals);
        this.tree = {};
        this.rowKeys = [];
        this.colKeys = [];
        this.rowTotals = {};
        this.colTotals = {};
        this.allTotal = this.aggregator(this, [], []);
        this.sorted = false;
        this._hasFilter = Object.keys(this.props.valueFilter).length > 0;

        // iterate through input, accumulating data for cells
        PivotData.forEachRecord(this.props.data, this.props.derivedAttributes, (record: Data) => {
            if (this.filter(record)) {
                this.processRecord(record);
            }
        });
    }

    filter(record: Data) {
        if (!this._hasFilter) return true;
        for (const k in this.props.valueFilter) {
            const filterSet = this.props.valueFilter[k];
            if (filterSet && (`${record[k]}` in filterSet)) {
                return false;
            }
        }
        return true;
    }

    forEachMatchingRecord(criteria: Record<string, Datum>, callback: (x: Data) => void) {
        // Note: derivedAttributes are re-applied here. For array-of-objects inputs, records were
        // already mutated during construction, so derived attrs are computed a second time per call.
        return PivotData.forEachRecord(this.props.data, this.props.derivedAttributes, (record: Data) => {
            if (!this.filter(record)) {
                return;
            }
            for (const k in criteria) {
                const v = criteria[k];
                if (v !== (k in record ? record[k] : 'null')) {
                    return;
                }
            }
            callback(record);
        });
    }

    arrSort(attrs: string[], nulls_first: boolean) {
        const sortersArr = attrs.map((a) => getSort(this.props.sorters, a));

        return function (a: Values, b: Values) {
            for (let i = 0; i < sortersArr.length; i++) {
                const comparison = sortersArr[i](a[i], b[i], nulls_first);
                if (comparison !== 0) {
                    return comparison;
                }
            }
            return 0;
        };
    }

    sortKeys() {
        if (!this.sorted) {
            this.sorted = true;
            const v = (r: Datum[], c: Datum[]) => this.getAggregator(r, c).value();
            switch (this.props.rowOrder) {
                case 'value_a_to_z': {
                    const rowVals = new Map(this.rowKeys.map((k) => [k, v(k, [])]));
                    this.rowKeys.sort((a, b) => naturalSort(rowVals.get(a), rowVals.get(b)));
                    break;
                }
                case 'value_z_to_a': {
                    const rowVals = new Map(this.rowKeys.map((k) => [k, v(k, [])]));
                    this.rowKeys.sort((a, b) => -naturalSort(rowVals.get(a), rowVals.get(b)));
                    break;
                }
                default:
                    this.rowKeys.sort(this.arrSort(this.props.rows, this.props.rowGroupBefore));
            }
            switch (this.props.colOrder) {
                case 'value_a_to_z': {
                    const colVals = new Map(this.colKeys.map((k) => [k, v([], k)]));
                    this.colKeys.sort((a, b) => naturalSort(colVals.get(a), colVals.get(b)));
                    break;
                }
                case 'value_z_to_a': {
                    const colVals = new Map(this.colKeys.map((k) => [k, v([], k)]));
                    this.colKeys.sort((a, b) => -naturalSort(colVals.get(a), colVals.get(b)));
                    break;
                }
                default:
                    this.colKeys.sort(this.arrSort(this.props.cols, this.props.colGroupBefore));
            }
        }
    }

    getColKeys(all_keys = false) {
        this.sortKeys();
        if (all_keys) return this.colKeys;
        return (this._leafColKeys ??= this.colKeys.filter((x) => x.length === this.props.cols.length));
    }

    getRowKeys(all_keys = false) {
        this.sortKeys();
        if (all_keys) return this.rowKeys;
        return (this._leafRowKeys ??= this.rowKeys.filter((x) => x.length === this.props.rows.length));
    }

    processRecord(record: Data) {
        // this code is called in a tight loop
        const cols = this.props.cols;
        const rows = this.props.rows;
        const grouping = this.props.grouping;
        const colLen = cols.length;
        const rowLen = rows.length;

        const _colKeys: Datum[] = new Array(colLen);
        const _rowKeys: Datum[] = new Array(rowLen);
        for (let i = 0; i < colLen; i++) {
            const x = cols[i];
            _colKeys[i] = x in record ? record[x] : 'null';
        }
        for (let i = 0; i < rowLen; i++) {
            const x = rows[i];
            _rowKeys[i] = x in record ? record[x] : 'null';
        }

        const colKeys = grouping ? subarrays(_colKeys) : [_colKeys];
        const rowKeys = grouping ? subarrays(_rowKeys) : [_rowKeys];
        const flatColKeys = colKeys.map(flatKey);

        this.allTotal.push(record);

        for (const rowKey of rowKeys) {
            const flatRowKey = flatKey(rowKey);

            if (rowKey.length !== 0) {
                if (!this.rowTotals[flatRowKey]) {
                    this.rowKeys.push(rowKey);
                    this.rowTotals[flatRowKey] = this.aggregator(this, rowKey, []);
                }
                this.rowTotals[flatRowKey].push(record);
            }

            for (let ci = 0; ci < colKeys.length; ci++) {
                const colKey = colKeys[ci];
                const flatColKey = flatColKeys[ci];

                if (colKey.length !== 0) {
                    if (!this.colTotals[flatColKey]) {
                        this.colKeys.push(colKey);
                        this.colTotals[flatColKey] = this.aggregator(this, [], colKey);
                    }
                    if (!(grouping && rowKey.length !== 1)) {
                        this.colTotals[flatColKey].push(record);
                    }
                }

                if (colKey.length !== 0 && rowKey.length !== 0) {
                    if (!this.tree[flatRowKey]) {
                        this.tree[flatRowKey] = {};
                    }
                    if (!this.tree[flatRowKey][flatColKey]) {
                        this.tree[flatRowKey][flatColKey] = this.aggregator(this, rowKey, colKey);
                    }
                    this.tree[flatRowKey][flatColKey].push(record);
                }
            }
        }
    }
    getAggregator(rowKey: Datum[], colKey: Datum[]): Aggregator {
        let agg;

        const flatRowKey = flatKey(rowKey);
        const flatColKey = flatKey(colKey);

        if (rowKey.length === 0 && colKey.length === 0) {
            agg = this.allTotal;
        } else if (rowKey.length === 0) {
            agg = this.colTotals[flatColKey];
        } else if (colKey.length === 0) {
            agg = this.rowTotals[flatRowKey];
        } else {
            agg = this.tree[flatRowKey]?.[flatColKey];
        }
        return (
            agg || {
                value() {
                    return null;
                },
                format() {
                    return '';
                },
            }
        );
    }


    static forEachRecord(input: Data[] | Datum[][] | ((addRecord: (record: Data) => void) => void), derivedAttributes: DerivedAttrs, func: (record: Data) => void) {
        let addRecord;
        if (Object.keys(derivedAttributes).length === 0) {
            addRecord = func;
        } else {
            addRecord = function (record: Data) {
                for (const k in derivedAttributes) {
                    const derived = derivedAttributes[k](record);
                    if (derived !== null) {
                        record[k] = derived;
                    }
                }
                return func(record);
            };
        }

        // if it's a function, have it call us back
        if (typeof input === 'function') {
            return input(addRecord);
        } else if (Array.isArray(input)) {
            if (Array.isArray(input[0])) {
                // array of arrays
                const headers = input[0] as (string | number)[];
                for (let i = 1; i < input.length; i++) {
                    const compactRecord: Datum[] = input[i] as Datum[];
                    const record: Data = {};
                    for (let j = 0; j < headers.length; j++) {
                        record[headers[j]] = compactRecord[j];
                    }
                    addRecord(record);
                }
                return;
            }

            // array of objects
            return (input as Data[]).forEach(addRecord);
        }
        throw new Error('unknown input format');
    };

}

export default PivotData;