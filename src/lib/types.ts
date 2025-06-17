import type { Component } from "svelte";


export type Datum = string | number | Date | null;
export type Data = Record<string, Datum>;
export type Values = Datum[];
export interface Aggregator {
    push: (record: Data) => void,
    value: () => Datum,
    format: (x: any) => string,
    [k: string]: any
}
export type Deriver = (record: Data) => Datum;
export type DerivedAttrs = Record<string, Deriver>;

export type Formatter = (x: number) => string;

export type Filter = Record<string, boolean>
export type FitlerSet = Record<string, Filter>

export interface PivotDataProps {
    cols: string[];
    rows: string[];
    vals: string[];
    sorters: Record<string, Function>;
    valueFilter: FitlerSet;
    rowOrder: string;
    colOrder: string;
    derivedAttributes: Record<string, any>;
    grouping: boolean;
    rowGroupBefore: boolean;
    colGroupBefore: boolean;
    aggregator: (...args: any[]) => () => Aggregator;
    data: Data[] | Datum[][] | Function;
}

export interface TableRendererProps extends PivotDataProps {
    tableColorScaleGenerator: (values: Datum[]) => (x: Datum) => string;
    tableOptions: {
        clickCallback?: (e: MouseEvent, value: Datum, filters: Data, pivotData: any) => void;
    };
    compactRows: boolean;
    opts: {
        heatmapMode?: "full" | "row" | "col";
    };
}

export interface PivotTableUIProps extends Partial<TableRendererProps> {
    aggregatorName?: string;
    aggregators?: Record<string, Aggregator>;
    rendererName?: string;
    renderers?: Record<string, Component<any>>;
    hiddenAttributes?: string[];
    hiddenFromAggregators?: string[];
    hiddenFromDragDrop?: string[];
    unusedOrientationCutoff?: number;
    menuLimit?: number;

    compactRows?: boolean;
}

