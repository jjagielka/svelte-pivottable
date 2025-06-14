<script lang="ts">
    import { getSort } from "../Utilities";
    import DraggableAttribute from "./DraggableAttribute.svelte";
    import sortableAttachment from "./SortableAttachment";

    let { items, onChange, attrValues, sorters, menuLimit, onUpdate } = $props();

    const options = {
        group: "shared",
        ghostClass: "pvtPlaceholder",
        filter: ".pvtFilterBox",
        preventOnFilter: false,
        revertOnSpill: true, // Enable plugin
        removeOnSpill: false, // Enable plugin
    };

    function getAttrValues(x: string) {
        const values = attrValues[x] ?? {},
            sorter = getSort(sorters, x);
        return Object.keys(values).sort(sorter);
    }
</script>

<!-- this is removed after init -->
<div {@attach sortableAttachment(options, onChange)} hidden></div>
{#each items as name (name)}
    <DraggableAttribute attrValues={getAttrValues(name)} {name} {menuLimit} />
{/each}
