<script lang="ts">
    import Draggable from "./Draggable.svelte";
    import FilterBox from "./FilterBox.svelte";

    let { valueFilter, name, attrValues, menuLimit, updateValuesInFilter } = $props();

    let open = $state(false);

    let is_empty = $derived(valueFilter ? Object.keys(valueFilter).length === 0 : true);

    const toggleOpen = () => (open = !open);
</script>

<li data-id={name}>
    <span class={`pvtAttr ${is_empty ? "" : "pvtFilteredAttribute"}`}>
        {name}
        <span class="pvtTriangle" onclick={toggleOpen} onkeypress={toggleOpen} role="presentation">
            {" "}
            ▾
        </span>
    </span>

    {#if open}
        <Draggable handle=".pvtDragHandle" close=".pvtCloseX" onclick={toggleOpen} onclose={toggleOpen}>
            <FilterBox
                {name}
                {valueFilter}
                values={attrValues}
                {menuLimit}
                onchange={(v: any) => updateValuesInFilter(name, v)}
            />
        </Draggable>
    {/if}
</li>
