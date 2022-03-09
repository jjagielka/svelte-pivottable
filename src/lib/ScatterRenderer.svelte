<script>
    import { PivotData } from './Utilities';
    import Plotly from './UI/Plotly.svelte';

    export let plotlyOptions = {},
        plotlyConfig = {},
        onRendererUpdate;

    let pivotData, rowKeys, colKeys, data, layout;

    $: {
        pivotData = new PivotData($$restProps);
        rowKeys = pivotData.getRowKeys();
        colKeys = pivotData.getColKeys();
        if (rowKeys.length === 0) {
            rowKeys.push([]);
        }
        if (colKeys.length === 0) {
            colKeys.push([]);
        }

        data = { x: [], y: [], text: [], type: 'scatter', mode: 'markers' };

        rowKeys.map((rowKey) => {
            colKeys.map((colKey) => {
                const v = pivotData.getAggregator(rowKey, colKey).value();
                if (v !== null) {
                    data.x.push(colKey.join('-'));
                    data.y.push(rowKey.join('-'));
                    data.text.push(v);
                }
            });
        });

        layout = {
            title: pivotData.props.rows.join('-') + ' vs ' + pivotData.props.cols.join('-'),
            hovermode: 'closest',
            /* eslint-disable no-magic-numbers */
            xaxis: { title: pivotData.props.cols.join('-'), automargin: true },
            yaxis: { title: pivotData.props.rows.join('-'), automargin: true },
            width: window.innerWidth / 1.5,
            height: window.innerHeight / 1.4 - 50,
            /* eslint-enable no-magic-numbers */
        };
    }
</script>

<Plotly
    data={[data]}
    layout={Object.assign(layout, plotlyOptions)}
    config={plotlyConfig}
    onUpdate={onRendererUpdate}
/>
