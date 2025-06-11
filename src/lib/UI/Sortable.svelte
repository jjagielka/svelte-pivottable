<script lang="ts">
    import Sortable from "sortablejs";

    function notify(el: Element) {
        const val = [...el.children].map((i) => (i as HTMLElement).dataset.id);
        onchange(val);
    }

    let { children, options = {}, items = [], onchange } = $props();

    // items = items || [];
    // options = options || {};

    function create(node: HTMLElement) {
        if (!node.parentElement) return;

        const sortable = Sortable.create(node.parentElement, {
            ...options,
            onUpdate: (ev) => notify(ev.to),
            onAdd: (ev) => notify(ev.to),
            onRemove: (ev) => notify(ev.from),
        });

        // Temporary node removal
        node.parentElement.removeChild(node);

        return sortable.destroy;
    }
</script>

<div {@attach create}><!-- Temporary node only for the initialization. --></div>
{#each items as item (item)}
    {@render children(item)}
{/each}
