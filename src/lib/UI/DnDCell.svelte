<script lang="ts">
    import Sortable from "./Sortable.svelte";
    import DraggableAttribute from "./DraggableAttribute.svelte";
    import { getSort } from "../Utilities";
    import sortableAttachment from "./SortableAttachment";

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
</script>

<!-- this is removed after init -->
<div {@attach sortableAttachment(options, onChange)} hidden></div>
{#each items as name (name)}
    {@const is_empty = valueFilter[name] ? Object.keys(valueFilter[name]).length === 0 : true}
    <li data-id={name}>
        <span class={`pvtAttr ${is_empty ? "" : "pvtFilteredAttribute"}`}>
            {name}
            <span class="pvtTriangle" role="presentation">
                {" "}
                ▾
            </span>
        </span>
    </li>
    <!-- <DraggableAttribute
        attrValues={getAttrValues(name)}
        {name}
        valueFilter={valueFilter[name]}
        {menuLimit}
        {updateValuesInFilter}
    /> -->
{/each}
