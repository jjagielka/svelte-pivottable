// import adapter from "@sveltejs/adapter-auto";
import adapter from "@sveltejs/adapter-static";
import preprocess from "svelte-preprocess";

/** @type {import('@sveltejs/kit').Config} */
const config = {
    preprocess: preprocess(),

    kit: {
        adapter: adapter(),
        package: {
            dir: "package",
            emitTypes: false,
        },
        paths: {
            assets: "https://jjagielka.github.io/svelte-pivottable-demo",
        },
        prerender: { default: true },
    },
};

export default config;
