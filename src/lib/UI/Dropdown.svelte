<script>
    import { clickOutside } from './utils';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    export let current,
        values = [];

    let open = false;
    const toggle = () => (open = !open);
</script>

<div class="pvtDropdown" use:clickOutside on:outside={() => (open = false)}>
    <div
        on:click|stopPropagation={toggle}
        class={'pvtDropdownValue pvtDropdownCurrent ' + (open ? 'pvtDropdownCurrentOpen' : '')}
        role="button"
    >
        <div class="pvtDropdownIcon">{open ? '×' : '▾'}</div>
        {#if current}
            {current}
        {:else}
            <span>&nbsp;</span>
        {/if}
    </div>

    {#if open}
        <div class="pvtDropdownMenu" style="z-index: 100;">
            {#each values as r (r)}
                <div
                    role="button"
                    on:click|stopPropagation={() => {
                        if (current !== r) dispatch('change', (current = r));
                        toggle();
                    }}
                    class={'pvtDropdownValue ' + (r === current ? 'pvtDropdownActiveValue' : '')}
                >
                    {r}
                </div>
            {/each}
        </div>
    {/if}
</div>
