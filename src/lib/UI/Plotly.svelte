<script module lang="ts">
    interface PlotlyModule {
        newPlot: (node: HTMLElement, options: any) => void;
        purge: (node: HTMLElement) => void;
    }

    let Plotly: PlotlyModule | undefined = $state();

    export function initPlotly(module: PlotlyModule) {
        Plotly = module;
    }
</script>

<script lang="ts">
    let { data, layout, config } = $props();

    export const onUpdate = () => {}; // TODO: connect to plotly events

    function create(node: HTMLElement) {
        Plotly?.newPlot(node, { data, layout, config });

        return () => Plotly?.purge(node);
    }
</script>

{#if Plotly}
    <div {@attach create}></div>
{:else}
    <p>Error! Plotly.js not initialized.</p>
{/if}
