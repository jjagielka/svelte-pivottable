<script lang="ts">
    // export const onUpdate = () => {}; // TODO: connect to plotly events
    let { data, layout, config, onUpdate } = $props();

    function create(node: HTMLElement) {
        if (window.Plotly) {
            const Plotly = window.Plotly;
            Plotly.newPlot(node, data, layout, config);
            return () => Plotly.purge(node);
        }
    }
</script>

<div {@attach create}></div>
