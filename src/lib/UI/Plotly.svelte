<script module lang="ts">
    // export interface PlotlyModule {
    //     newPlot: (node: HTMLElement, options: any) => void;
    //     purge: (node: HTMLElement) => void;
    // }
    // import * as PlotlyModule from "plotly.js";
    /// <reference types="Plotly" />
    // let Plotly: PlotlyModule  | undefined = $state();

    // export function initPlotly(module: PlotlyModule) {
    //     Plotly = module;
    // }
    // type PlotlyModule = typeof import("plotly.js");
</script>

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
