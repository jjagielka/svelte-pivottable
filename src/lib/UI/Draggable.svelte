<script lang="ts">
    import { clickClose } from "./utils";

    let {
        children,
        handle, // query
        close,
        onclose,
        onclick,
    } = $props();

    let left = $state(0);
    let top = $state(0);

    let moving = false;

    function onMouseDown() {
        moving = true;
    }

    function onMouseMove(e: MouseEvent) {
        if (moving) {
            left += e.movementX;
            top += e.movementY;
        }
    }

    function onMouseUp() {
        moving = false;
    }

    function init(node: HTMLElement) {
        const handleElem = node.querySelector(handle) ?? node;
        handleElem.addEventListener("mousedown", onMouseDown, true);
        return () => {
            handleElem.removeEventListener("mousedown", onMouseDown, true);
        };
    }
    // use:clickClose={close}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<section
    {@attach init}
    style="left: {left}px; top: {top}px;"
    class={"draggable"}
    {onclose}
    {onclick}
    role="presentation"
>
    {@render children()}
</section>

<svelte:window onmouseup={onMouseUp} onmousemove={onMouseMove} />

<style>
    .draggable {
        user-select: none;
        cursor: auto;
        position: relative;
    }
</style>
