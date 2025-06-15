
import { aggregators, getSort, naturalSort } from "./Utilities";



// [1,2,3] -> [[1], [1,2], [1,2,3]]
const subarrays = <T>(array: T[]) => array.map((d, i) => array.slice(0, i + 1));

const flatKey = (arr: Datum[]) => arr.join(String.fromCharCode(0));

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

    props: typeof PivotData.defaultProps;
    rowKeys: Datum[][];
    colKeys: Datum[][];
    tree: Record<string, Record<string, Aggregator>>;
    rowTotals: Record<string, Aggregator>;
    colTotals: Record<string, Aggregator>;
    allTotal: Aggregator;
    sorted: boolean;
    aggregator: typeof aggregators["Count"];

    constructor(inputProps = {}) {
        this.props = Object.assign({}, PivotData.defaultProps, inputProps);
        this.props.aggregator = PivotData.defaultProps.aggregator;

        this.aggregator = this.props.aggregator(this.props.vals);
        this.tree = {};
        this.rowKeys = [];
        this.colKeys = [];
        this.rowTotals = {};
        this.colTotals = {};
        this.allTotal = this.aggregator(this, [], []);
        this.sorted = false;

        // iterate through input, accumulating data for cells
        PivotData.forEachRecord(this.props.data, this.props.derivedAttributes, (record: Data) => {
            if (this.filter(record)) {
                this.processRecord(record);
            }
        });
    }

    filter(record: Data) {
        for (const k in this.props.valueFilter) {
            /* @ts-ignore */
            if (record[k] in (this.props.valueFilter[k] || {})) {
                return false;
            }
        }
        return true;
    }

    forEachMatchingRecord(criteria: Record<string, Datum>, callback: (x: Data) => void) {
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
        const sortersArr = Array.from(attrs).map((a) => getSort(this.props.sorters, a));

        return function (a: Values, b: Values) {
            // Why that was used here?
            // for (const i of Object.keys(sortersArr || {})) {
            for (const i in sortersArr || []) {
                const sorter = sortersArr[+i];
                const comparison = sorter(a[i], b[i], nulls_first);
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
                case 'value_a_to_z':
                    this.rowKeys.sort((a, b) => naturalSort(v(a, []), v(b, [])));
                    break;
                case 'value_z_to_a':
                    this.rowKeys.sort((a, b) => -naturalSort(v(a, []), v(b, [])));
                    break;
                default:
                    this.rowKeys.sort(this.arrSort(this.props.rows, this.props.rowGroupBefore));
            }
            switch (this.props.colOrder) {
                case 'value_a_to_z':
                    this.colKeys.sort((a, b) => naturalSort(v([], a), v([], b)));
                    break;
                case 'value_z_to_a':
                    this.colKeys.sort((a, b) => -naturalSort(v([], a), v([], b)));
                    break;
                default:
                    this.colKeys.sort(this.arrSort(this.props.cols, this.props.colGroupBefore));
            }
        }
    }

    getColKeys(all_keys = false) {
        this.sortKeys();
        return all_keys ? this.colKeys : this.colKeys.filter((x) => x.length === this.props.cols.length);
    }

    getRowKeys(all_keys = false) {
        this.sortKeys();
        return all_keys ? this.rowKeys : this.rowKeys.filter((x) => x.length === this.props.rows.length);
    }

    processRecord(record: Data) {

        // this code is called in a tight loop
        let _colKeys: Datum[] = [];
        let _rowKeys: Datum[] = [];
        for (const x of Array.from(this.props.cols)) {
            _colKeys.push(x in record ? record[x] : 'null');
        }
        for (const x of Array.from(this.props.rows)) {
            _rowKeys.push(x in record ? record[x] : 'null');
        }

        let colKeys = this.props.grouping ? subarrays(_colKeys) : [_colKeys];
        let rowKeys = this.props.grouping ? subarrays(_rowKeys) : [_rowKeys];

        this.allTotal.push(record);

        for (const rowKey of rowKeys) {
            const flatRowKey = flatKey(rowKey);

            for (const colKey of colKeys) {
                const flatColKey = flatKey(colKey);

                if (rowKey.length !== 0) {
                    if (!this.rowTotals[flatRowKey]) {
                        this.rowKeys.push(rowKey);
                        this.rowTotals[flatRowKey] = this.aggregator(this, rowKey, []);
                    }
                    if (!(this.props.grouping && colKey.length !== 1)) {
                        this.rowTotals[flatRowKey].push(record);
                    }
                }

                if (colKey.length !== 0) {
                    if (!this.colTotals[flatColKey]) {
                        this.colKeys.push(colKey);
                        this.colTotals[flatColKey] = this.aggregator(this, [], colKey);
                    }
                    if (!(this.props.grouping && rowKey.length !== 1)) {
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
            agg = this.tree[flatRowKey][flatColKey];
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


    // can handle arrays or jQuery selections of tables
    static forEachRecord(input: Data[] | Datum[][] | Function, derivedAttributes: DerivedAttrs, func: (record: Data) => void) {
        let addRecord;
        if (Object.getOwnPropertyNames(derivedAttributes).length === 0) {
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
                return (() => {
                    const result = [];
                    // this the original - super safe ??
                    // for (const i of Object.keys(input || {})) {
                    //     const compactRecord = input[i];
                    //     if (+i > 0) {
                    //         const record: Data = {};
                    //         for (const j of Object.keys(input[0] || {})) {
                    //             const k = input[0][j];
                    //             record[k] = compactRecord[j];
                    //         }
                    //         result.push(addRecord(record));
                    //     }
                    // }

                    const headers = input[0] as (string | number)[];
                    for (let i = 1; i < input.length; i++) {
                        const compactRecord: Datum[] = input[i] as Datum[];

                        const record: Data = {};
                        for (let j = 0; j < headers.length; j++) {
                            const k = headers[j];
                            record[k] = compactRecord[j];
                        }
                        result.push(addRecord(record));
                    }
                    return result;
                })();
            }

            // array of objects
            return Array.from(input as Data[]).map(addRecord);
        }
        throw new Error('unknown input format');
    };

}

export default PivotData;