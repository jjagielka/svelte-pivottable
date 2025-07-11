
import Sortable from "sortablejs";


export default function (options = {}, onchange: (v: (string | undefined)[]) => void) {

    const notify = (el: HTMLElement) => {
        const val = Array.from(el.children).map((i) => (i as HTMLElement).dataset.id); //.filter(x => x);
        onchange(val)
    }

    return function (node: HTMLElement) {
        if (node.parentElement) {
            const sortable = Sortable.create(node.parentElement, {
                ...options,
                onStart({ item }) {
                    const oldIndex = Array.prototype.indexOf.call(item.parentElement?.childNodes, item);
                    item.dataset.oldIndex = String(oldIndex);
                },
                onUpdate: (ev) => notify(ev.to),
                onAdd: (ev) => notify(ev.to),
                onRemove: (ev) => notify(ev.from),
                onEnd: (ev) => {
                    // sortablejs doesn't work perfectly with Svelte5
                    // https://github.com/sveltejs/svelte/issues/11826#issuecomment-2141791882

                    // cancel the UI update so Svelte will take care of it
                    ev.item.remove();

                    if (ev.oldIndex !== undefined) {
                        ev.from.insertBefore(ev.item, ev.from.childNodes[Number(ev.item.dataset.oldIndex)]);
                        // ev.from.insertBefore(ev.item, ev.from.childNodes[(ev.oldIndex + 1) * 2 - 1]);
                    }
                },
            });

            // Temporary node removal
            // node.parentElement.removeChild(node);

            // return () => sortable?.destroy();
        }
    }
}


