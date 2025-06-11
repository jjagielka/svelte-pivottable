
import Sortable from "sortablejs";

export default function (options = {}, onchange: (v: (string | undefined)[]) => void) {

    const notify = (el: Element) => {
        const val = [...el.children].map((i) => (i as HTMLElement).dataset.id).filter(x => x);
        console.log('notify', val)
        onchange(val);
    }


    return function create(node: HTMLElement) {

        if (node.parentElement) {

            const sortable = Sortable.create(node.parentElement, {
                ...options,
                onUpdate: (ev) => notify(ev.to),
                onAdd: (ev) => notify(ev.to),
                onRemove: (ev) => notify(ev.from),
            });

            // Temporary node removal
            // node.parentElement.removeChild(node);

            return () => sortable?.destroy();
        }
    }
}


