# svelte-pivottable

This is a Svelte component implementation of [react-pivottable-grouping](https://github.com/jjagielka/react-pivottable-grouping) that is itself a fork of [react-pivottable](https://react-pivottable.js.org/) with added capacity of grouping and displaying subtotals.

# svelte-pivottable

`svelte-pivottable` is a Svelte-based pivot table library with drag'n'drop functionality.

It is based on the original work of [Nicolas Kruchten](https://github.com/nicolaskruchten) author of [react-pivottable](https://react-pivottable.js.org/) a React port of the jQuery-based
[PivotTable.js](https://pivottable.js.org/) by the same author.

## What does it do & where is the demo?

`svelte-pivottable`'s function is to enable data exploration and analysis by
summarizing a data set into table or [Plotly.js](https://plot.ly/javascript/)
chart with a true 2-d drag'n'drop UI, very similar to the one found in older
versions of Microsoft Excel.

A [live demo can be found here](https://jjagielka.github.io/svelte-pivottable-demo/).

![screencap](https://raw.githubusercontent.com/jjagielka/react-pivottable-grouping/master/examples/basic.gif)

## How can I use it in my project?

### Drag'n'drop UI with Table output only

Installation is via NPM or Yarn:

```
npm install --save svelte-pivottable

yarn add svelte-pivottable
```

Basic usage is as follows. Note that `PivotTableUI` is a "dumb component" that
maintains essentially no state of its own.

```svelte
<script>
    import { PivotTableUI } from "svelte-pivottable/PivotTableUI";

    const options = {
        // see documenation for supported options
        };

    // see documentation for supported input formats
    const data = [
        ["attribute", "attribute2"],
        ["value1", "value2"],
    ];
</script>

<PivotTableUI {...options} {data}>
```

### Drag'n'drop UI with Plotly charts as well as Table output

The Plotly `plotly.js` component can be passed in via dependency injection. 

**Important:** If you build your project using webpack, you'll have to follow
[these instructions](https://github.com/plotly/plotly.js#building-plotlyjs-with-webpack)
in order to successfully bundle `plotly.js`. See below for how to avoid having
to bundle `plotly.js`.

```
npm install --save plotly.js
```

To add the Plotly renderers to your app, you can use the following pattern:

```svelte
<script>
    import { PivotTableUI } from "svelte-pivottable/PivotTableUI";
    import TableRenderers from "svelte-pivottable/TableRenderers";
    import Plotly from "plotly.js";
    import PlotlyRenderers from "svelte-pivottable/PlotlyRenderers";

    // create Plotly renderers via dependency injection
    const plotlyRenderers = PlotlyRenderers(Plotly);

    // see documentation for supported input formats
    const data = [
        ["attribute", "attribute2"],
        ["value1", "value2"],
    ];
</script>

<PivotTableUI
    data={data}
    renderers={Object.assign({}, TableRenderers, plotlyRenderers)}
/>
```

#### With external `plotly.js`

If you would rather not install and bundle `plotly.js` but rather get it into
your app via something like `<script>` tag, you can handle the dependency injection like this:

```svelte
<script>
    import { PivotTableUI } from "svelte-pivottable/PivotTableUI";
    import TableRenderers from "svelte-pivottable/TableRenderers";
    import PlotlyRenderers from "svelte-pivottable/PlotlyRenderers";

    // create Plotly renderers via dependency injection
    const plotlyRenderers = PlotlyRenderers(window.Plotly);

    // see documentation for supported input formats
    const data = [
        ["attribute", "attribute2"],
        ["value1", "value2"],
    ];
</script>

<PivotTableUI
    data={data}
    renderers={...TableRenderers, ...plotlyRenderers)}
/>
```

## Properties and layered architecture

-   `<PivotTableUI {...props} />`
    -   `<PivotTable {...props} />`
        -   `<Renderer {...props} />`
            -   `PivotData(props)`

The interactive component provided by `svelte-pivottable` is `PivotTableUI`, but
output rendering is delegated to the non-interactive `PivotTable` component,
which accepts a subset of its properties. `PivotTable` can be invoked directly
and is useful for outputting non-interactive saved snapshots of `PivotTableUI`
configurations. `PivotTable` in turn delegates to a specific renderer component,
such as the default `TableRenderer`, which accepts a subset of the same
properties. Finally, most renderers will create `PivotData` object to
handle the actual computations, which also accepts a subset of the same props as
the rest of the stack.

Here is a table of the properties accepted by this stack, including an
indication of which layer consumes each, from the bottom up:

| Layer          | Key & Type                                       | Default Value                 | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| -------------- | ------------------------------------------------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PivotData`    | `data` <br /> see below for formats              | (none, required)              | data to be summarized                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `PivotData`    | `rows` <br /> array of strings                   | `[]`                          | attribute names to prepopulate in row area                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `PivotData`    | `cols` <br /> array of strings                   | `[]`                          | attribute names to prepopulate in cols area                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `PivotData`    | `vals` <br /> array of strings                   | `[]`                          | attribute names used as arguments to aggregator (gets passed to aggregator generating function)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `PivotData`    | `aggregators` <br /> object of functions         | `aggregators` from `Utilites` | dictionary of generators for aggregation functions in dropdown (see [original PivotTable.js documentation](https://github.com/nicolaskruchten/pivottable/wiki/Aggregators))                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `PivotData`    | `aggregatorName` <br /> string                   | first key in `aggregators`    | key to `aggregators` object specifying the aggregator to use for computations                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `PivotData`    | `valueFilter` <br /> object of arrays of strings | `{}`                          | object whose keys are attribute names and values are objects of attribute value-boolean pairs which denote records to include or exclude from computation and rendering; used to prepopulate the filter menus that appear on double-click                                                                                                                                                                                                                                                                                                                                                                     |
| `PivotData`    | `sorters` <br /> object or function              | `{}`                          | accessed or called with an attribute name and can return a [function which can be used as an argument to `array.sort`](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/sort) for output purposes. If no function is returned, the default sorting mechanism is a built-in "natural sort" implementation. Useful for sorting attributes like month names, see [original PivotTable.js example 1](http://nicolas.kruchten.com/pivottable/examples/mps_agg.html) and [original PivotTable.js example 2](http://nicolas.kruchten.com/pivottable/examples/montreal_2014.html). |
| `PivotData`    | `rowOrder` <br /> string                         | `"key_a_to_z"`                | the order in which row data is provided to the renderer, must be one of `"key_a_to_z"`, `"value_a_to_z"`, `"value_z_to_a"`, ordering by value orders by row total                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `PivotData`    | `colOrder` <br /> string                         | `"key_a_to_z"`                | the order in which column data is provided to the renderer, must be one of `"key_a_to_z"`, `"value_a_to_z"`, `"value_z_to_a"`, ordering by value orders by column total                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `PivotData`    | `derivedAttributes` <br /> object of functions   | `{}`                          | defines derived attributes (see [original PivotTable.js documentation](https://github.com/nicolaskruchten/pivottable/wiki/Derived-Attributes))                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `Renderer`     | `<any>`                                          | (none, optional)              | Renderers may accept any additional properties                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `PivotTable`   | `renderers` <br /> object of functions           | `TableRenderers`              | dictionary of renderer components                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `PivotTable`   | `rendererName` <br /> string                     | first key in `renderers`      | key to `renderers` object specifying the renderer to use                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `PivotTableUI` | `onChange` <br /> function                       | (none, required)              | function called every time anything changes in the UI, with the new value of the properties needed to render the new state. This function must be hooked into a state-management system in order for the "dumb" `PivotTableUI` component to work.                                                                                                                                                                                                                                                                                                                                                             |
| `PivotTableUI` | `hiddenAttributes` <br /> array of strings       | `[]`                          | contains attribute names to omit from the UI                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `PivotTableUI` | `hiddenFromAggregators` <br /> array of strings  | `[]`                          | contains attribute names to omit from the aggregator arguments dropdowns                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `PivotTableUI` | `hiddenFromDragDrop` <br /> array of strings     | `[]`                          | contains attribute names to omit from the drag'n'drop portion of the UI                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `PivotTableUI` | `menuLimit` <br /> integer                       | 500                           | maximum number of values to list in the double-click menu                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `PivotTableUI` | `unusedOrientationCutoff` <br /> integer         | 85                            | If the attributes' names' combined length in characters exceeds this value then the unused attributes area will be shown vertically to the left of the UI instead of horizontally above it. `0` therefore means 'always vertical', and `Infinity` means 'always horizontal'.                                                                                                                                                                                                                                                                                                                                  |

### Accepted formats for `data`

#### Arrays of objects

One object per record, the object's keys are the attribute names.

_Note_: missing attributes or attributes with a value of `null` are treated as
if the value was the string `"null"`.

```js
const data = [
    {
        attr1: "value1_attr1",
        attr2: "value1_attr2",
        //...
    },
    {
        attr1: "value2_attr1",
        attr2: "value2_attr2",
        //...
    },
    //...
];
```

#### Arrays of arrays

One sub-array per record, the first sub-array contains the attribute names. If
subsequent sub-arrays are shorter than the first one, the trailing values are
treated as if they contained the string value `"null"`. If subsequent sub-arrays
are longer than the first one, excess values are ignored. This format is
compatible with the output of CSV parsing libraries like PapaParse.

```js
const data = [
    ["attr1", "attr2"],
    ["value1_attr1", "value1_attr2"],
    ["value2_attr1", "value2_attr2"],
    //...
];
```

#### Functions that call back

The function will be called with a callback that takes an object as a parameter.

_Note_: missing attributes or attributes with a value of `null` are treated as
if the value was the string `"null"`.

```js
const data = function(callback) {
    callback({
        "attr1": "value1_attr1",
        "attr2": "value1_attr2",
        //...
    });
    callback({
        "attr1": "value2_attr1",
        "attr2": "value2_attr2",
        //...
    };
    //...
};
```
