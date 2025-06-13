<script lang="ts">
    import PivotData from "./PivotData.svelte";
    import Plotly from "./UI/Plotly.svelte";

    let { plotlyOptions = {}, plotlyConfig = {}, onRendererUpdate, ...restProps } = $props();

    let pivotData: PivotData,
        rowKeys: string[][],
        colKeys: string[][],
        data: { x: string[]; y: string[]; text: string[]; type: string; mode: string } = $state({
            x: [],
            y: [],
            text: [],
            type: "scatter",
            mode: "markers",
        }),
        layout:
            | {
                  title: string;
                  hovermode: string;
                  xaxis: { title: string; automargin: boolean };
                  yaxis: { title: string; automargin: boolean };

                  width: number;
                  height: number;
              }
            | undefined = $state();

    $effect(() => {
        pivotData = new PivotData(restProps);
        rowKeys = pivotData.getRowKeys();
        colKeys = pivotData.getColKeys();
        if (rowKeys.length === 0) {
            rowKeys.push([]);
        }
        if (colKeys.length === 0) {
            colKeys.push([]);
        }

        data = { x: [], y: [], text: [], type: "scatter", mode: "markers" };

        rowKeys.map((rowKey) => {
            colKeys.map((colKey) => {
                const v = pivotData.getAggregator(rowKey, colKey).value();
                if (v !== null) {
                    data.x.push(colKey.join("-"));
                    data.y.push(rowKey.join("-"));
                    data.text.push(v);
                }
            });
        });

        layout = {
            title: pivotData.props.rows.join("-") + " vs " + pivotData.props.cols.join("-"),
            hovermode: "closest",
            xaxis: { title: pivotData.props.cols.join("-"), automargin: true },
            yaxis: { title: pivotData.props.rows.join("-"), automargin: true },
            /* eslint-disable no-magic-numbers */
            width: window.innerWidth / 1.5,
            height: window.innerHeight / 1.4 - 50,
            /* eslint-enable no-magic-numbers */
        };
    });
</script>

<Plotly
    data={[data]}
    layout={Object.assign(layout ?? {}, plotlyOptions)}
    config={plotlyConfig}
    onUpdate={onRendererUpdate}
/>
