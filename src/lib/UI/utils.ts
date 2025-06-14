import type { Component, ComponentInternals, ComponentProps } from "svelte";

export function partial<T extends Component<any>>(component: T, partialProps: Partial<ComponentProps<T>>) {
    return function (anchor: ComponentInternals, props: ComponentProps<T>) {
        return component(anchor, { ...partialProps, ...props })
    }
}


export function clickOutside(node: Node) {
    const handleClick = (event: MouseEvent) => {
        if (node && event.target && !node.contains(event.target as Node) && !event.defaultPrevented) {
            node.dispatchEvent(new CustomEvent('outside', { detail: node }));
        }
    }

    document.addEventListener('click', handleClick, true);

    return {
        destroy() {
            document.removeEventListener('click', handleClick, true);
        },
    };
}

export function clickClose(node: Element, selector: any) {
    const element = node.querySelector(selector);

    const handleClick = (event: MouseEvent) => {
        if (!event.defaultPrevented) {
            node.dispatchEvent(new CustomEvent('close', element));
            console.log('dispaching close')
        }
    }

    element.addEventListener('click', handleClick, true);

    return {
        destroy() {
            element.removeEventListener('click', handleClick, true);
        },
    };
}


