<script>
    export let horizUnused;
</script>

{#if horizUnused}
    <table class="pvtUi">
        <tbody>
            <tr>
                <td class="pvtRenderers"><slot name="rendererCell" /></td>
                <td class="pvtAxisContainer pvtUnused pvtHorizList"><slot name="unusedAttrsCell" /></td>
            </tr>
            <tr>
                <td class="pvtVals"><slot name="aggregatorCell" /></td>
                <td class="pvtAxisContainer pvtHorizList pvtCols"><slot name="colAttrsCell" /></td>
            </tr>
            <tr>
                <td class="pvtAxisContainer pvtVertList pvtRows"><slot name="rowAttrsCell" /></td>
                <td class="pvtOutput"><slot name="outputCell" /></td>
            </tr>
        </tbody>
    </table>
{:else}
    <table class="pvtUi">
        <tbody>
            <tr>
                <td class="pvtRenderers"><slot name="rendererCell" /></td>
                <td class="pvtVals"><slot name="aggregatorCell" /></td>
                <td class="pvtAxisContainer pvtHorizList pvtCols"><slot name="colAttrsCell" /></td>
            </tr>
            <tr>
                <td class="pvtAxisContainer pvtUnused pvtVertList"><slot name="unusedAttrsCell" /></td>
                <td class="pvtAxisContainer pvtVertList pvtRows"><slot name="rowAttrsCell" /></td>
                <td class="pvtOutput"><slot name="outputCell" /></td>
            </tr>
        </tbody>
    </table>
{/if}
