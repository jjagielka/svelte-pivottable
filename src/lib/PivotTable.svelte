<script>
    import TableRenderers from './TableRenderers';

    export let renderer = TableRenderers.Table;
</script>

<svelte:component this={renderer} {...$$restProps} />
