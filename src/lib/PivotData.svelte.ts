import { aggregators, getSort, naturalSort } from "./Utilities";

// [1,2,3] -> [[1], [1,2], [1,2,3]]
const subarrays = <T>(array: T[]) => array.map((d, i) => array.slice(0, i + 1));
function subarrays1<T>(array: T[]): T[][] { return array.map((d, i) => array.slice(0, i + 1)) };

// returns a new object with the values at each key mapped using mapFn(value)
function objectMap(object) {
    return Object.keys(object).reduce(function (result, key) {
        result[key] = object[key]
        return result
    }, {})
}

/*
Data Model class
*/

class PivotData {
    static readonly defaultProps = {
        aggregators: aggregators,
        cols: [],
        rows: [],
        vals: [],
        aggregatorName: 'Count',
        sorters: {},
        valueFilter: {} as FitlerSet,
        rowOrder: 'key_a_to_z',
        colOrder: 'key_a_to_z',
        derivedAttributes: {},
        grouping: false,
        rowGroupBefore: true,
        colGroupBefore: false,
        aggregator: aggregators["Count as Fraction of Columns"],
        data: []
    }

    props: typeof PivotData.defaultProps;
    rowKeys: string[][];
    colKeys: string[][];
    tree: Record<string, Record<string, any[]>>;
    rowTotals: Record<string, any>;
    colTotals: Record<string, any>;
    allTotal: any[];
    sorted: boolean;
    aggregator: typeof aggregators["Average"];

    constructor(inputProps = {}) {
        this.props = Object.assign({}, PivotData.defaultProps, inputProps);

        this.aggregator = this.props.aggregator(this.props.vals);
        this.tree = {};
        this.rowKeys = [];
        this.colKeys = [];
        this.rowTotals = {};
        this.colTotals = {};
        this.allTotal = this.aggregator(this, [], []);
        this.sorted = false;

        // iterate through input, accumulating data for cells
        PivotData.forEachRecord(this.props.data, this.props.derivedAttributes, (record: any) => {
            if (this.filter(record)) {
                this.processRecord(record);
            }
        });
    }

    filter(record: any) {
        for (const k in this.props.valueFilter) {
            if (record[k] in (this.props.valueFilter[k] || {})) {
                return false;
            }
        }
        return true;
    }

    forEachMatchingRecord(criteria, callback) {
        return PivotData.forEachRecord(this.props.data, this.props.derivedAttributes, (record) => {
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

    arrSort(attrs, nulls_first: boolean) {
        let a;
        const sortersArr = (() => {
            const result = [];
            for (a of Array.from(attrs)) {
                result.push(getSort(this.props.sorters, a));
            }
            return result;
        })();
        // Why not .map above?
        // const sortersArr = Array.from(attrs).map(a => getSort(this.props.sorters, a));
        return function (a, b) {
            for (const i of Object.keys(sortersArr || {})) {
                const sorter = sortersArr[i];
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
            const v = (r, c) => this.getAggregator(r, c).value();
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

    processRecord(record) {
        // this code is called in a tight loop
        let colKeys = [];
        let rowKeys = [];
        for (const x of Array.from(this.props.cols)) {
            colKeys.push(x in record ? record[x] : 'null');
        }
        for (const x of Array.from(this.props.rows)) {
            rowKeys.push(x in record ? record[x] : 'null');
        }

        colKeys = this.props.grouping ? subarrays(colKeys) : [colKeys];
        rowKeys = this.props.grouping ? subarrays(rowKeys) : [rowKeys];

        this.allTotal.push(record);

        for (const rowKey of rowKeys) {
            const flatRowKey = rowKey.join(String.fromCharCode(0));

            for (const colKey of colKeys) {
                const flatColKey = colKey.join(String.fromCharCode(0));

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

    getAggregator(rowKey: string[], colKey: string[]) {
        let agg;

        const flatRowKey = rowKey.join(String.fromCharCode(0));
        const flatColKey = colKey.join(String.fromCharCode(0));

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
    static forEachRecord(input, derivedAttributes, f) {
        let addRecord, record;
        // if (Object.getOwnPropertyNames(derivedAttributes).length === 0) {
        if (Object.keys(derivedAttributes).length === 0) {
            addRecord = f;
        } else {
            addRecord = function (record: Record<string, number>) {
                for (const k in derivedAttributes) {
                    const derived = derivedAttributes[k](record);
                    if (derived !== null) {
                        record[k] = derived;
                    }
                }
                return f(record);
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
                    for (const i of Object.keys(input || {})) {
                        const compactRecord = input[i];
                        if (+i > 0) {
                            record = {};
                            for (const j of Object.keys(input[0] || {})) {
                                const k = input[0][j];
                                record[k] = compactRecord[j];
                            }
                            result.push(addRecord(record));
                        }
                    }
                    return result;
                })();
            }

            // array of objects
            return Array.from(input).map(addRecord);
            // return (() => {
            //     const result1 = [];
            //     for (record of Array.from(input)) {
            //         result1.push(addRecord(record));
            //     }
            //     return result1;
            // })();
        }
        throw new Error('unknown input format');
    };

}

export default PivotData;