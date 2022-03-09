<script>
    import Aggregators from './UI/Aggregators.svelte';
    import DnDCell from './UI/DnDCell.svelte';
    import Dropdown from './UI/Dropdown.svelte';
    import MainTable from './UI/MainTable.svelte';
    import PivotTable from './PivotTable.svelte';
    import TableRenderers from './TableRenderers';
    import { delta } from './UI/utils';
    import { PivotData, sortAs } from './Utilities';

    export let rendererName = 'Table',
        renderers = TableRenderers,
        hiddenAttributes = [],
        hiddenFromAggregators = [],
        hiddenFromDragDrop = [],
        unusedOrientationCutoff = 85,
        menuLimit = 500;

    export let data;

    let unusedOrder = [],
        attrValues = {};

    let props = { ...PivotData.defaultProps, ...$$restProps };

    // monitor the $$restProps changes
    let oldProps = {};
    $: {
        props = { ...props, ...delta($$restProps, oldProps) };
        oldProps = $$restProps;
    }

    let derivedAttributes = props.derivedAttributes; // TODO: this is not reactive, should be changed somehow
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
                const value = attr in record ? record[attr] : 'null';
                if (!(value in attrValues[attr])) {
                    attrValues[attr][value] = 0;
                }
                attrValues[attr][value]++;
            }
            recordsProcessed++;
        });
    }

    function propUpdater(key) {
        return (value) => (props[key] = value);
    }

    function notHidden(e) {
        return !hiddenAttributes.includes(e) && !hiddenFromDragDrop.includes(e);
    }

    let colAttrs, rowAttrs;
    $: colAttrs = props.cols.filter(notHidden);
    $: rowAttrs = props.rows.filter(notHidden);

    let unusedAttrs, horizUnused, valAttrs;
    $: {
        unusedAttrs = Object.keys(attrValues)
            .filter((e) => !colAttrs.includes(e) && !rowAttrs.includes(e) && notHidden(e))
            .sort(sortAs(unusedOrder));

        const unusedLength = unusedAttrs.reduce((r, e) => r + e.length, 0);
        horizUnused = unusedLength < unusedOrientationCutoff;

        valAttrs = Object.keys(attrValues).filter(
            (e) => !hiddenAttributes.includes(e) && !hiddenFromAggregators.includes(e)
        );
    }

    let renderer;
    $: {
        rendererName = rendererName in renderers ? rendererName : Object.keys(renderers)[0];
        renderer = renderers[rendererName];
    }
</script>

<MainTable {horizUnused}>
    <Dropdown slot="rendererCell" bind:current={rendererName} values={Object.keys(renderers)} />

    <Aggregators
        slot="aggregatorCell"
        aggregatorName={props.aggregatorName}
        aggregators={props.aggregators}
        {valAttrs}
        onChange={propUpdater('aggregatorName')}
        onUpdate={propUpdater('vals')}
        vals={props.vals}
    />

    <DnDCell
        slot="unusedAttrsCell"
        sorters={props.sorters}
        valueFilter={props.valueFilter}
        {attrValues}
        items={unusedAttrs}
        onChange={(order) => (unusedOrder = order)}
        onUpdate={propUpdater('valueFilter')}
        {menuLimit}
    />

    <DnDCell
        slot="colAttrsCell"
        sorters={props.sorters}
        valueFilter={props.valueFilter}
        {attrValues}
        items={colAttrs}
        onChange={propUpdater('cols')}
        onUpdate={propUpdater('valueFilter')}
        {menuLimit}
    />

    <DnDCell
        slot="rowAttrsCell"
        sorters={props.sorters}
        valueFilter={props.valueFilter}
        {attrValues}
        items={rowAttrs}
        onChange={propUpdater('rows')}
        onUpdate={propUpdater('valueFilter')}
        {menuLimit}
    />

    <PivotTable slot="outputCell" {renderer} {...props} {data} />
</MainTable>
