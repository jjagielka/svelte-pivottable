<script module>
    let zIndexGlobal = 1000;
</script>

<script lang="ts">
    let { name, values, valueFilter = {}, menuLimit = 500, onchange } = $props();

    let filterText = $state("");

    let shown = $derived(values.filter(matchesFilter, filterText)); // filterText only to trigger reactivity

    function toggleValue(value: string) {
        value in valueFilter ? removeValuesFromFilter([value]) : addValuesToFilter([value]);
        onchange(valueFilter);
    }

    function setValuesInFilter(values: string[]) {
        Object.keys(valueFilter).forEach((key) => delete valueFilter[key]);
        addValuesToFilter(values);
        // values.forEach((v) => (valueFilter[v] = true));
    }

    function addValuesToFilter(values: string[]) {
        values.forEach((v) => (valueFilter[v] = true));
    }

    function removeValuesFromFilter(values: string[]) {
        values.forEach((v) => delete valueFilter[v]);
    }

    function matchesFilter(x: string) {
        return x.toLowerCase().trim().includes(filterText.toLowerCase().trim());
    }

    function selectOnly(value: string) {
        setValuesInFilter(values.filter((y: string) => y !== value));
        onchange(valueFilter);
    }

    function select(all: boolean) {
        const func = all ? removeValuesFromFilter : addValuesToFilter;
        return function (ev: MouseEvent) {
            ev.stopPropagation();
            func(values.filter(matchesFilter));
            onchange(valueFilter);
        };
    }
    function init(node: HTMLElement) {
        node.style.zIndex = "" + zIndexGlobal++;
    }
</script>

<div class="pvtFilterBox" style:display="block" style:cursor="initial" use:init>
    <span class="pvtCloseX"> × </span>
    <span class="pvtDragHandle">☰</span>
    <h4>{name}</h4>

    {#if values.length < menuLimit}
        <p>
            <input type="text" placeholder="Filter values" class="pvtSearch" bind:value={filterText} />
            <br />
            <button class="pvtButton" onclick={select(true)}>
                Select {values.length === shown.length ? "All" : shown.length}
            </button>{" "}
            <button class="pvtButton" onclick={select(false)}>
                Deselect {values.length === shown.length ? "All" : shown.length}
            </button>
        </p>

        <div class="pvtCheckContainer">
            {#each shown as x (x)}
                <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <p onclick={() => toggleValue(x)} class={x in valueFilter ? "" : "selected"}>
                    <!-- svelte-ignore a11y_missing_attribute -->
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <a class="pvtOnly" onclick={() => selectOnly(x)} role="presentation"> only </a>
                    <span class="pvtOnlySpacer">&nbsp;</span>

                    {#if x === ""}<em>null</em>{:else}{x}{/if}
                </p>
            {/each}
        </div>
    {:else}
        <p>(too many values to show)</p>
    {/if}
</div>
