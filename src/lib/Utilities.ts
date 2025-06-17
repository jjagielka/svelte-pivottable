/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS201: Simplify complex destructure assignments
 * DS203: Remove `|| {}` from converted for-own loops
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import { fmt, fmtInt, fmtPct } from "./formatters";
import type PivotData from "./PivotData";
import type { Data, Datum, Formatter } from "./types";


const rx = /(\d+)|(\D+)/g;
const rd = /\d/;
const rz = /^0/;
const naturalSort = (as: Datum = null, bs: Datum = null, nulls_first: boolean = true) => {
    // nulls first or last
    if (bs !== null && as === null) {
        return nulls_first ? -1 : 1;
    }
    if (as !== null && bs === null) {
        return nulls_first ? 1 : -1;
    }

    // then raw NaNs
    if (typeof as === 'number' && isNaN(as)) {
        return -1;
    }
    if (typeof bs === 'number' && isNaN(bs)) {
        return 1;
    }

    // numbers and numbery strings group together
    const nas = Number(as);
    const nbs = Number(bs);
    if (nas < nbs) {
        return -1;
    }
    if (nas > nbs) {
        return 1;
    }

    // within that, true numbers before numbery strings
    if (typeof as === 'number' && typeof bs !== 'number') {
        return -1;
    }
    if (typeof bs === 'number' && typeof as !== 'number') {
        return 1;
    }
    if (typeof as === 'number' && typeof bs === 'number') {
        return 0;
    }

    // 'Infinity' is a textual number, so less than 'A'
    if (isNaN(nbs) && !isNaN(nas)) {
        return -1;
    }
    if (isNaN(nas) && !isNaN(nbs)) {
        return 1;
    }

    // finally, "smart" string sorting per http://stackoverflow.com/a/4373421/112871
    let a = String(as);
    let b = String(bs);
    if (a === b) {
        return 0;
    }
    if (!rd.test(a) || !rd.test(b)) {
        return a > b ? 1 : -1;
    }

    // special treatment for strings containing digits
    let am = a.match(rx) ?? [];
    let bm = b.match(rx) ?? [];
    while (a.length && b.length) {
        const a1 = am.shift() ?? "";
        const b1 = bm.shift() ?? "";
        if (a1 !== b1) {
            if (rd.test(a1) && rd.test(b1)) {
                return parseFloat(a1.replace(rz, '.0')) - parseFloat(b1.replace(rz, '.0'));
            }
            return a1 > b1 ? 1 : -1;
        }
    }
    return a.length - b.length;
};

const sortAs = function (order: string[]) {
    const mapping: Record<string, number> = {};

    // sort lowercased keys similarly
    const l_mapping: Record<string, number> = {};
    for (const i in order) {
        const x = order[i];
        mapping[x] = +i;
        if (typeof x === 'string') {
            l_mapping[x.toLowerCase()] = +i;
        }
    }
    return function (a: string | null = null, b: string | null = null, nulls_first = true) {
        if (b === null && a === null) {
            return 0;
        } else if (a === null) {
            return nulls_first ? -1 : 1;
        } else if (b === null) {
            return nulls_first ? 1 : -1;
        }

        if (a in mapping && b in mapping) {
            return mapping[a] - mapping[b];
        } else if (a in mapping) {
            return -1;
        } else if (b in mapping) {
            return 1;
        } else if (a in l_mapping && b in l_mapping) {
            return l_mapping[a] - l_mapping[b];
        } else if (a in l_mapping) {
            return -1;
        } else if (b in l_mapping) {
            return 1;
        }
        return naturalSort(a, b, nulls_first);
    };
};

const getSort = function (sorters: Record<string, Function> | Function | null, attr: string) {
    if (sorters) {
        if (typeof sorters === 'function') {
            const sort = sorters(attr);
            if (typeof sort === 'function') {
                return sort;
            }
        } else if (attr in sorters) {
            return sorters[attr];
        }
    }
    return naturalSort;
};


const aggregatorTemplates: Record<string, Function> = {
    count(formatter = fmtInt) {
        return () =>
            function () {
                return {
                    count: 0,
                    push() {
                        this.count++;
                    },
                    value() {
                        return this.count;
                    },
                    format: formatter,
                };
            };
    },

    uniques(fn: (x: Datum[]) => Datum, formatter = fmtInt) {
        return function ([attr]: string[]) {
            return function () {
                return {
                    uniq: [] as Datum[],
                    push(record: Data) {
                        if (!Array.from(this.uniq).includes(record[attr])) {
                            this.uniq.push(record[attr]);
                        }
                    },
                    value() {
                        return fn(this.uniq);
                    },
                    format: formatter,
                    numInputs: typeof attr !== 'undefined' ? 0 : 1,
                };
            };
        };
    },

    sum(formatter = fmt) {
        return function ([attr]: string[]) {
            return function () {
                return {
                    sum: 0,
                    push(record: Data) {
                        if (!isNaN(parseFloat(record[attr] as string))) {
                            this.sum += parseFloat(record[attr] as string);
                        }
                    },
                    value() {
                        return this.sum;
                    },
                    format: formatter,
                    numInputs: typeof attr !== 'undefined' ? 0 : 1,
                };
            };
        };
    },

    extremes(mode: 'min' | 'max' | 'first' | 'last', formatter = fmt) {
        return function ([attr]: string[]) {
            return function (data: { sorters: Function }) {
                return {
                    val: null as Datum,
                    sorter: getSort(typeof data !== 'undefined' ? data.sorters : null, attr),
                    push(record: Data) {
                        let x = record[attr];
                        if (mode === 'min' || mode === 'max') {
                            const n = parseFloat(x as string);
                            if (!isNaN(n)) {
                                this.val = Math[mode](n, (this.val !== null ? this.val : n) as number);
                            }
                        }
                        if (mode === 'first' && this.sorter(x, this.val !== null ? this.val : x) <= 0) {
                            this.val = x;
                        }
                        if (mode === 'last' && this.sorter(x, this.val !== null ? this.val : x) >= 0) {
                            this.val = x;
                        }
                    },
                    value() {
                        return this.val;
                    },
                    format(x: number) {
                        if (isNaN(x)) {
                            return x;
                        }
                        return formatter(x);
                    },
                    numInputs: typeof attr !== 'undefined' ? 0 : 1,
                };
            };
        };
    },

    quantile(q: number, formatter = fmt) {
        return function ([attr]: string[]) {
            return function () {
                return {
                    vals: [] as number[],
                    push(record: Data) {
                        const x = parseFloat(record[attr] as string);
                        if (!isNaN(x)) {
                            this.vals.push(x);
                        }
                    },
                    value() {
                        if (this.vals.length === 0) {
                            return null;
                        }
                        this.vals.sort((a, b) => a - b);
                        const i = (this.vals.length - 1) * q;
                        return (this.vals[Math.floor(i)] + this.vals[Math.ceil(i)]) / 2.0;
                    },
                    format: formatter,
                    numInputs: typeof attr !== 'undefined' ? 0 : 1,
                };
            };
        };
    },

    runningStat(mode = 'mean', ddof = 1, formatter = fmt) {
        return function ([attr]: string[]) {
            return function () {
                return {
                    n: 0.0,
                    m: 0.0,
                    s: 0.0,
                    push(record: Data) {
                        const x = parseFloat(record[attr] as string);
                        if (isNaN(x)) {
                            return;
                        }
                        this.n += 1.0;
                        if (this.n === 1.0) {
                            this.m = x;
                        }
                        const m_new = this.m + (x - this.m) / this.n;
                        this.s = this.s + (x - this.m) * (x - m_new);
                        this.m = m_new;
                    },
                    value() {
                        if (mode === 'mean') {
                            if (this.n === 0) {
                                return 0 / 0;
                            }
                            return this.m;
                        }
                        if (this.n <= ddof) {
                            return 0;
                        }
                        switch (mode) {
                            case 'var':
                                return this.s / (this.n - ddof);
                            case 'stdev':
                                return Math.sqrt(this.s / (this.n - ddof));
                            default:
                                throw new Error('unknown mode for runningStat');
                        }
                    },
                    format: formatter,
                    numInputs: typeof attr !== 'undefined' ? 0 : 1,
                };
            };
        };
    },

    sumOverSum(formatter = fmt) {
        return function ([num, denom]: string[]) {
            return function () {
                return {
                    sumNum: 0,
                    sumDenom: 0,
                    push(record: Data) {
                        const _num = parseFloat(record[num] as string);
                        if (!isNaN(_num)) { this.sumNum += _num; }
                        const _denom = parseFloat(record[denom] as string);
                        if (!isNaN(_denom)) { this.sumDenom += _denom; }
                    },
                    value() {
                        return this.sumNum / this.sumDenom;
                    },
                    format: formatter,
                    numInputs: typeof num !== 'undefined' && typeof denom !== 'undefined' ? 0 : 2,
                };
            };
        };
    },

    fractionOf(wrapped: Function, type: "total" | "row" | "col" = 'total', formatter = fmtPct) {
        return (...x: any[]) =>
            function (data: PivotData, rowKey: Datum[], colKey: Datum[]) {
                return {
                    selector: { total: [[], []], row: [rowKey, []], col: [[], colKey] }[type] ?? [],
                    inner: wrapped(...Array.from(x || []))(data, rowKey, colKey),
                    push(record: Data) {
                        this.inner.push(record);
                    },
                    format: formatter,
                    value() {
                        return (
                            this.inner.value() /
                            data.getAggregator(this.selector[0], this.selector[1]).inner.value()
                        );
                    },
                    numInputs: wrapped(...Array.from(x || []))().numInputs,
                };
            };
    },
};

aggregatorTemplates.countUnique = (f: Formatter) => aggregatorTemplates.uniques((x: Datum[]) => x.length, f);
aggregatorTemplates.listUnique = (s: string) => aggregatorTemplates.uniques((x: Datum[]) => x.join(s), (x: Datum) => x);
aggregatorTemplates.max = (f: Formatter) => aggregatorTemplates.extremes('max', f);
aggregatorTemplates.min = (f: Formatter) => aggregatorTemplates.extremes('min', f);
aggregatorTemplates.first = (f: Formatter) => aggregatorTemplates.extremes('first', f);
aggregatorTemplates.last = (f: Formatter) => aggregatorTemplates.extremes('last', f);
aggregatorTemplates.median = (f: Formatter) => aggregatorTemplates.quantile(0.5, f);
aggregatorTemplates.average = (f: Formatter) => aggregatorTemplates.runningStat('mean', 1, f);
aggregatorTemplates.var = (ddof: number, f: Formatter) => aggregatorTemplates.runningStat('var', ddof, f);
aggregatorTemplates.stdev = (ddof: number, f: Formatter) => aggregatorTemplates.runningStat('stdev', ddof, f);

// default aggregators & renderers use US naming and number formatting
const aggregators = ((tpl) => ({
    Count: tpl.count(fmtInt),
    'Count Unique Values': tpl.countUnique(fmtInt),
    'List Unique Values': tpl.listUnique(', '),
    Sum: tpl.sum(fmt),
    'Integer Sum': tpl.sum(fmtInt),
    Average: tpl.average(fmt),
    Median: tpl.median(fmt),
    'Sample Variance': tpl.var(1, fmt),
    'Sample Standard Deviation': tpl.stdev(1, fmt),
    Minimum: tpl.min(fmt),
    Maximum: tpl.max(fmt),
    First: tpl.first(fmt),
    Last: tpl.last(fmt),
    'Sum over Sum': tpl.sumOverSum(fmt),
    'Sum as Fraction of Total': tpl.fractionOf(tpl.sum(), 'total', fmtPct),
    'Sum as Fraction of Rows': tpl.fractionOf(tpl.sum(), 'row', fmtPct),
    'Sum as Fraction of Columns': tpl.fractionOf(tpl.sum(), 'col', fmtPct),
    'Count as Fraction of Total': tpl.fractionOf(tpl.count(), 'total', fmtPct),
    'Count as Fraction of Rows': tpl.fractionOf(tpl.count(), 'row', fmtPct),
    'Count as Fraction of Columns': tpl.fractionOf(tpl.count(), 'col', fmtPct),
}))(aggregatorTemplates);

const locales = {
    en: {
        aggregators,
        localeStrings: {
            renderError: 'An error occurred rendering the PivotTable results.',
            computeError: 'An error occurred computing the PivotTable results.',
            uiRenderError: 'An error occurred rendering the PivotTable UI.',
            selectAll: 'Select All',
            selectNone: 'Select None',
            tooMany: '(too many to list)',
            filterResults: 'Filter values',
            apply: 'Apply',
            cancel: 'Cancel',
            totals: 'Totals',
            vs: 'vs',
            by: 'by',
        },
    },
};

// dateFormat deriver l10n requires month and day names to be passed in directly
const mthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const zeroPad = (num: number) => String(num).padStart(2, '0');

const derivers = {
    bin(col: string, binWidth: number) {
        return (record: Record<string, number>) => record[col] - (record[col] % binWidth);
    },
    dateFormat(col: string, formatString: string, utcOutput = false, mthNames = mthNamesEn, dayNames = dayNamesEn) {
        const utc = utcOutput ? 'UTC' : '';
        return function (record: Data) {
            const date: Date = new Date(Date.parse(record[col] as string));
            if (isNaN(+date)) {
                return '';
            }
            /** @ts-ignore */
            return formatString.replace(/%(.)/g, function (m, p) {
                switch (p) {
                    case 'y':
                        return date[`get${utc}FullYear`]();
                    case 'm':
                        return zeroPad(date[`get${utc}Month`]() + 1);
                    case 'n':
                        return mthNames[date[`get${utc}Month`]()];
                    case 'd':
                        return zeroPad(date[`get${utc}Date`]());
                    case 'w':
                        return dayNames[date[`get${utc}Day`]()];
                    case 'x':
                        return date[`get${utc}Day`]();
                    case 'H':
                        return zeroPad(date[`get${utc}Hours`]());
                    case 'M':
                        return zeroPad(date[`get${utc}Minutes`]());
                    case 'S':
                        return zeroPad(date[`get${utc}Seconds`]());
                    default:
                        return `%${p}`;
                }
            });
        };
    },
};


export {
    aggregatorTemplates,
    aggregators,
    derivers,
    locales,
    naturalSort,
    getSort,
    sortAs,
};
