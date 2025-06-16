import { type Component, type ComponentInternals, type ComponentProps } from "svelte";


export function partial<T extends Component<any>>(component: T, partialProps: Partial<ComponentProps<T>>) {
    const wrapper = (anchor: ComponentInternals, props: ComponentProps<T>) => {
        const proxy = new Proxy(partialProps, {
            get(target, p, receiver) {
                return Reflect.get(props, p, receiver) ?? Reflect.get(target, p, receiver)
            },
            set(target, p, newValue, receiver) {
                return Reflect.set(props, p, newValue, receiver) || Reflect.set(target, p, newValue, receiver)
            },
            has(target, p) {
                return Reflect.has(props, p) || Reflect.has(target, p)
            },
            getOwnPropertyDescriptor(target, p) {
                return Reflect.getOwnPropertyDescriptor(props, p) ?? Reflect.getOwnPropertyDescriptor(target, p);
            },
            ownKeys(target) {
                return [...new Set([...Reflect.ownKeys(props), ...Reflect.ownKeys(target)])];
            },
        });
        return component(anchor, proxy)
    }
    // Do we need to copy the symbols attached as well?
    return copySymbols(wrapper, component)
    // Object.assign(wrapper, ...Object.getOwnPropertySymbols(component).map(sym => ({ [sym]: component[sym] })));
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




/**
 * Copy all symbol properties from `source` to `target`,
 * preserving property descriptors and type information.
*/
type SymbolsOf<T> = Extract<keyof T, symbol>;
export function copySymbols<S extends object, T extends object>(target: T, source: S): T & Pick<S, SymbolsOf<S>> {
    for (const sym of Object.getOwnPropertySymbols(source) as SymbolsOf<S>[]) {
        const desc = Object.getOwnPropertyDescriptor(source, sym);
        if (desc) {
            Object.defineProperty(target, sym, desc);
        }
    }
    return target as T & Pick<S, SymbolsOf<S>>;
}

export function copySymbols2(target: object, source: object) {
    for (const sym of Object.getOwnPropertySymbols(source)) {
        const desc = Object.getOwnPropertyDescriptor(source, sym);
        if (desc) {
            Object.defineProperty(target, sym, desc);
        }
    }
    return target;
}
