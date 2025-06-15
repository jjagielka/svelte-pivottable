<script>
    import TableRenderers from "./TableRenderers";

    let { renderer: Renderer = TableRenderers.Table, ...restProps } = $props();

    $inspect("PT", restProps);
</script>

<Renderer {...restProps} />
