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