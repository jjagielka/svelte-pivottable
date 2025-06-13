import type { Component } from "svelte";

export function partial(component: Component, partialProps = {}) {
    return new Proxy(component, {
        construct(target, [options], newTarget) {
            options.props = { ...options.props, ...partialProps };
            return Reflect.construct(target, [options], newTarget);
        },
    });
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
        }
    }

    element.addEventListener('click', handleClick, true);

    return {
        destroy() {
            element.removeEventListener('click', handleClick, true);
        },
    };
}


