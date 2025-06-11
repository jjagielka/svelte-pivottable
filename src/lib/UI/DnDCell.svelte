<script lang="ts">
    import Sortable from "./Sortable.svelte";
    import DraggableAttribute from "./DraggableAttribute.svelte";
    import { getSort } from "../Utilities";

    let { items, onChange, valueFilter, attrValues, sorters, menuLimit, onUpdate } = $props();

    const options = {
        group: "shared",
        ghostClass: "pvtPlaceholder",
        filter: ".pvtFilterBox",
        preventOnFilter: false,
    };

    function getAttrValues(x: string) {
        const values = attrValues[x] ?? {},
            sorter = getSort(sorters, x);
        return Object.keys(values).sort(sorter);
    }

    function updateValuesInFilter(attribute: string, values: any) {
        valueFilter[attribute] = values;
        onUpdate(valueFilter);
    }
    console.log("DnDCell", items);
</script>

<Sortable {items} onchange={onChange} {options}>
    {#snippet children(x: string)}
        <DraggableAttribute
            attrValues={getAttrValues(x)}
            name={x}
            valueFilter={valueFilter[x] || {}}
            {menuLimit}
            {updateValuesInFilter}
        />
    {/snippet}
</Sortable>
