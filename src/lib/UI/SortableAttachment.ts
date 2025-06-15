
import Sortable from "sortablejs";
import { tick } from "svelte";

export default function (options = {}, onchange: (v: (string | undefined)[]) => void) {

    const notify = (el: Element) => {
        const val = [...el.children].map((i) => (i as HTMLElement).dataset.id).filter(x => x);
        onchange(val);
        console.log(val)
    }


    return function (node: HTMLElement) {

        if (node.parentElement) {

            const sortable = Sortable.create(node.parentElement, {
                ...options,
                onUpdate: (ev) => notify(ev.to),
                onAdd: (ev) => notify(ev.to),
                onRemove: (ev) => notify(ev.from),
                onEnd: async (ev) => {
                    // console.log(ev)
                    // cancel the UI update so Svelte will take care of it
                    if (ev.from !== ev.to) {
                    }
                    ev.item.remove();
                    if (ev.oldIndex !== undefined) {
                        ev.from.insertBefore(ev.item, ev.from.childNodes[(ev.oldIndex + 1) * 2 - 1]);
                    }

                    await tick()
                    // items && updatePosition(items, e.oldIndex, e.newIndex, offset)
                },
            });

            // Temporary node removal
            node.parentElement.removeChild(node);

            return () => sortable?.destroy();
        }
    }
}


