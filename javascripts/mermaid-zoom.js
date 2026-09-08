(function () {
    "use strict";

    const MIN_ZOOM = 0.5;
    const MAX_ZOOM = 4;
    const ZOOM_STEP = 1.25;

    function setupMermaidZoom() {
        document.querySelectorAll(".mermaid").forEach((container) => {
            if (container.dataset.zoomReady === "true") {
                return;
            }

            const svg = container.querySelector("svg");

            if (!svg) {
                return;
            }

            container.dataset.zoomReady = "true";

            const originalViewBox = svg.getAttribute("viewBox");

            if (!originalViewBox) {
                console.warn("Mermaid SVG has no viewBox.");
                return;
            }

            const values = originalViewBox
                .split(/[\s,]+/)
                .map(Number);

            if (values.length !== 4 || values.some(isNaN)) {
                return;
            }

            const [originalX, originalY, originalWidth, originalHeight] = values;

            let zoom = 1;
            let offsetX = 0;
            let offsetY = 0;

            function update() {
                const width = originalWidth / zoom;
                const height = originalHeight / zoom;

                const x =
                    originalX +
                    (originalWidth - width) / 2 +
                    offsetX;

                const y =
                    originalY +
                    (originalHeight - height) / 2 +
                    offsetY;

                svg.setAttribute(
                    "viewBox",
                    `${x} ${y} ${width} ${height}`
                );
            }

            function changeZoom(newZoom) {
                zoom = Math.max(
                    MIN_ZOOM,
                    Math.min(MAX_ZOOM, newZoom)
                );

                update();
            }

            function reset() {
                zoom = 1;
                offsetX = 0;
                offsetY = 0;

                svg.setAttribute(
                    "viewBox",
                    originalViewBox
                );
            }

            /*
             * Controls
             */
            const controls = document.createElement("div");

            controls.className = "mermaid-zoom-controls";

            controls.innerHTML = `
                <button type="button" data-zoom="in" title="Zoom in">+</button>
                <button type="button" data-zoom="out" title="Zoom out">−</button>
                <button type="button" data-zoom="reset" title="Reset">↻</button>
            `;

            container.appendChild(controls);

            controls.addEventListener("click", (event) => {
                const button = event.target.closest("button");

                if (!button) {
                    return;
                }

                switch (button.dataset.zoom) {
                    case "in":
                        changeZoom(zoom * ZOOM_STEP);
                        break;

                    case "out":
                        changeZoom(zoom / ZOOM_STEP);
                        break;

                    case "reset":
                        reset();
                        break;
                }
            });

            /*
             * Mouse wheel
             */
            container.addEventListener(
                "wheel",
                (event) => {
                    event.preventDefault();

                    if (event.deltaY < 0) {
                        changeZoom(zoom * ZOOM_STEP);
                    } else {
                        changeZoom(zoom / ZOOM_STEP);
                    }
                },
                { passive: false }
            );

            /*
             * Double click = reset
             */
            container.addEventListener("dblclick", (event) => {
                if (event.target.closest(".mermaid-zoom-controls")) {
                    return;
                }

                reset();
            });
        });
    }

    async function renderMermaid() {
        if (typeof mermaid === "undefined") {
            console.error("Mermaid is not loaded.");
            return;
        }

        mermaid.initialize({
            startOnLoad: false,
            securityLevel: "loose"
        });

        const elements = document.querySelectorAll(
            ".mermaid:not([data-mermaid-rendered])"
        );

        if (!elements.length) {
            return;
        }

        await mermaid.run({
            nodes: Array.from(elements)
        });

        elements.forEach((element) => {
            element.dataset.mermaidRendered = "true";
        });

        setupMermaidZoom();
    }

    /*
     * Material for MkDocs
     * Handles both initial page load and navigation.instant.
     */
    if (typeof document$ !== "undefined") {
        document$.subscribe(() => {
            setTimeout(renderMermaid, 0);
        });
    } else {
        document.addEventListener("DOMContentLoaded", renderMermaid);
    }
})();