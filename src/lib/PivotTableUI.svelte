<script>
    import Aggregators from "./UI/Aggregators.svelte";
    import DnDCell from "./UI/DnDCell.svelte";
    import Dropdown from "./UI/Dropdown.svelte";
    import MainTable from "./UI/MainTable.svelte";
    import PivotTable from "./PivotTable.svelte";
    import PivotData from "./PivotData";
    import TableRenderers from "./TableRenderers";
    import { sortAs, aggregators as defaultAggregators } from "./Utilities";

    export let rendererName = "Table",
        renderers = TableRenderers,
        aggregatorName = "Count",
        aggregators = defaultAggregators,
        hiddenAttributes = [],
        hiddenFromAggregators = [],
        hiddenFromDragDrop = [],
        unusedOrientationCutoff = 85,
        menuLimit = 500;

    // pivotData props managed by PivotTableUI
    export let { derivedAttributes, cols, rows, vals, sorters, valueFilter } = PivotData.defaultProps;

    export let data;

    let unusedOrder = [],
        attrValues = {};

    $: {
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
    }

    function notHidden(e) {
        return !hiddenAttributes.includes(e) && !hiddenFromDragDrop.includes(e);
    }

    let colAttrs, rowAttrs;
    $: colAttrs = cols.filter(notHidden);
    $: rowAttrs = rows.filter(notHidden);

    let unusedAttrs, horizUnused, valAttrs;
    $: {
        unusedAttrs = Object.keys(attrValues)
            .filter((e) => !colAttrs.includes(e) && !rowAttrs.includes(e) && notHidden(e))
            .sort(sortAs(unusedOrder));

        const unusedLength = unusedAttrs.reduce((r, e) => r + e.length, 0);
        horizUnused = unusedLength < unusedOrientationCutoff;

        valAttrs = Object.keys(attrValues).filter(
            (e) => !hiddenAttributes.includes(e) && !hiddenFromAggregators.includes(e),
        );
    }

    let renderer;
    $: {
        rendererName = rendererName in renderers ? rendererName : Object.keys(renderers)[0];
        renderer = renderers[rendererName];
    }
    let aggregator;
    $: {
        aggregatorName = aggregatorName in aggregators ? aggregatorName : Object.keys(aggregators)[0];
        aggregator = aggregators[aggregatorName];
    }
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
            onChange={(v) => (console.log(v), (cols = v))}
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
            {...$$restProps}
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
