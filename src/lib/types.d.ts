

type Datum = string | number | Date | null;
type Data = Record<string, Datum>;
type Values = Datum[];
interface Aggregator {
    push: (record: Data) => void,
    value: () => Datum,
    format: (x: any) => string,
    [k: string]: any
}
type Deriver = (record: Data) => Datum;
type DerivedAttrs = Record<string, Deriver>;

type Formatter = (x: number) => string;

type Filter = Record<string, boolean>
type FitlerSet = Record<string, Filter>

interface PivotDataProps {
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

interface TableRendererProps extends PivotDataProps {
    tableColorScaleGenerator: (values: Datum[]) => (x: Datum) => string;
    tableOptions: {
        clickCallback?: (e: MouseEvent, value: Datum, filters: Data, pivotData: any) => void;
    };
    compactRows: boolean;
    opts: {
        heatmapMode?: "full" | "row" | "col";
    };
}

interface PivotTableUIProps extends Partial<TableRendererProps> {
    aggregatorName?: string;
    aggregators?: Record<string, Aggregator>;
    rendererName?: string;
    renderers?: Record<string, Component>;
    hiddenAttributes?: string[];
    hiddenFromAggregators?: string[];
    hiddenFromDragDrop?: string[];
    unusedOrientationCutoff?: number;
    menuLimit?: number;

    compactRows?: boolean;
}

