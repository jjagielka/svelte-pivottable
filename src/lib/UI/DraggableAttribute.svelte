<script>
  import Draggable from "./Draggable.svelte";
  import FilterBox from "./FilterBox.svelte";

  export let valueFilter;
  export let name;
  export let attrValues;
  export let menuLimit;
  export let updateValuesInFilter;

  let open = false;

  $: is_empty = Object.keys(valueFilter).length === 0;

  const toggleOpen = () => (open = !open);
</script>

<li data-id={name}>
  <span class={`pvtAttr ${is_empty ? "" : "pvtFilteredAttribute"}`}>
    {name}
    <span class="pvtTriangle" on:click={toggleOpen} on:keypress={toggleOpen}>
      {" "}
      ▾
    </span>
  </span>

  {#if open}
    <Draggable
      handle=".pvtDragHandle"
      close=".pvtCloseX"
      on:click={toggleOpen}
      on:close={toggleOpen}
    >
      <FilterBox
        {name}
        {valueFilter}
        values={attrValues}
        {menuLimit}
        on:change={(ev) => updateValuesInFilter(name, ev.detail)}
      />
    </Draggable>
  {/if}
</li>
