<script lang="ts">
    import Aggregators from "./UI/Aggregators.svelte";
    import DnDCell from "./UI/DnDCell.svelte";
    import Dropdown from "./UI/Dropdown.svelte";
    import MainTable from "./UI/MainTable.svelte";
    import PivotTable from "./PivotTable.svelte";
    import PivotData from "./PivotData";
    import TableRenderers from "./TableRenderers";
    import { sortAs, aggregators as defaultAggregators } from "./Utilities";

    let {
        rendererName = "Table",
        renderers = TableRenderers,
        aggregatorName = "Count",
        aggregators = defaultAggregators,
        hiddenAttributes = [],
        hiddenFromAggregators = [],
        hiddenFromDragDrop = [],
        unusedOrientationCutoff = 85,
        menuLimit = 500,

        // pivotData props managed by PivotTableUI
        derivedAttributes = PivotData.defaultProps.derivedAttributes,
        cols = PivotData.defaultProps.cols,
        rows = PivotData.defaultProps.rows,
        vals = PivotData.defaultProps.vals,
        sorters = PivotData.defaultProps.sorters,
        valueFilter = PivotData.defaultProps.valueFilter,

        // pivot data
        data,

        ...restProps
    } = $props();

    let unusedOrder = [],
        attrValues = {};

    $effect(() => {
        attrValues = {};

        let recordsProcessed = 0;

        PivotData.forEachRecord(data, derivedAttributes, function (record) {
            for (const attr of Object.keys(record)) {
                if (!(attr in attrValues)) {
                    attrValues[attr] = {};
                    if (recordsProcessed > 0) {
                        attrValues[attr].null = recordsProcessed;
                    }
                }
            }
            for (const attr in attrValues) {
                const value = attr in record ? record[attr] : "null";
                if (!(value in attrValues[attr])) {
                    attrValues[attr][value] = 0;
                }
                attrValues[attr][value]++;
            }
            recordsProcessed++;
        });
    });

    const notHidden = (e: string) => !hiddenAttributes.includes(e) && !hiddenFromDragDrop.includes(e);

    let colAttrs = $derived(cols.filter(notHidden));
    let rowAttrs = $derived(rows.filter(notHidden));

    let unusedAttrs,
        horizUnused = $state(),
        valAttrs;

    $effect(() => {
        unusedAttrs = Object.keys(attrValues)
            .filter((e) => !colAttrs.includes(e) && !rowAttrs.includes(e) && notHidden(e))
            .sort(sortAs(unusedOrder));

        const unusedLength = unusedAttrs.reduce((r, e) => r + e.length, 0);
        horizUnused = unusedLength < unusedOrientationCutoff;

        valAttrs = Object.keys(attrValues).filter(
            (e) => !hiddenAttributes.includes(e) && !hiddenFromAggregators.includes(e),
        );
    });

    const firstKey = (x: object) => Object.keys(x)[0];

    let renderer = $derived(
        renderers[(rendererName in renderers ? rendererName : firstKey(renderers)) as keyof typeof renderers],
    );

    let aggregator = $derived(
        aggregators[
            (aggregatorName in aggregators ? aggregatorName : firstKey(aggregators)) as keyof typeof aggregators
        ],
    );
</script>

<MainTable {horizUnused}>
    {#snippet rendererCell()}
        <Dropdown bind:current={rendererName} values={Object.keys(renderers)} />
    {/snippet}

    {#snippet aggregatorCell()}
        <Aggregators
            {aggregatorName}
            {aggregators}
            {valAttrs}
            onChange={(v) => (aggregatorName = v)}
            onUpdate={(v) => (vals = v)}
            {vals}
        />
    {/snippet}

    {#snippet unusedAttrsCell()}
        <DnDCell
            {sorters}
            {valueFilter}
            {attrValues}
            items={unusedAttrs}
            onChange={(order) => (unusedOrder = order)}
            onUpdate={(v) => (valueFilter = v)}
            {menuLimit}
        />
    {/snippet}

    {#snippet colAttrsCell()}
        <DnDCell
            {sorters}
            {valueFilter}
            {attrValues}
            items={colAttrs}
            onChange={(v) => (cols = v)}
            onUpdate={(v) => (valueFilter = v)}
            {menuLimit}
        />
    {/snippet}

    {#snippet rowAttrsCell()}
        <DnDCell
            {sorters}
            {valueFilter}
            {attrValues}
            items={rowAttrs}
            onChange={(v) => (rows = v)}
            onUpdate={(v) => (valueFilter = v)}
            {menuLimit}
        />
    {/snippet}

    {#snippet outputCell()}
        <PivotTable
            {renderer}
            {...restProps}
            {cols}
            {rows}
            {vals}
            {derivedAttributes}
            {aggregator}
            {data}
            {sorters}
            {valueFilter}
        />
    {/snippet}
</MainTable>
