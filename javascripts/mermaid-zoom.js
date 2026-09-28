(() => {
    const viewers = new WeakSet();

    function button(label, title, action) {
        const element = document.createElement("button");
        element.type = "button";
        if (label instanceof Node) {
            element.append(label);
        } else {
            element.textContent = label;
        }
        element.title = title;
        element.setAttribute("aria-label", title);
        element.addEventListener("click", action);
        return element;
    }

    function icon(paths) {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("aria-hidden", "true");
        for (const attributes of paths) {
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            for (const [name, value] of Object.entries(attributes)) {
                path.setAttribute(name, value);
            }
            svg.append(path);
        }
        return svg;
    }

    function fullscreenIcon() {
        return icon([
            { d: "M15 3h6v6" },
            { d: "m21 3-7 7" },
            { d: "m3 21 7-7" },
            { d: "M9 21H3v-6" },
        ]);
    }

    function closeIcon() {
        return icon([{ d: "M18 6 6 18" }, { d: "m6 6 12 12" }]);
    }

    function copyIcon() {
        return icon([
            { d: "M9 9h11a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V11a2 2 0 0 1 2-2Z" },
            { d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" },
        ]);
    }

    function setupViewer(diagram, source) {
        if (!diagram.isConnected || viewers.has(diagram)) return;
        viewers.add(diagram);

        const shell = document.createElement("section");
        shell.className = "mermaid-viewer";
        shell.setAttribute("aria-label", "Mermaid");
        const header = document.createElement("div");
        header.className = "mermaid-viewer-header";
        const title = document.createElement("span");
        title.className = "mermaid-viewer-title";
        title.textContent = "Mermaid";
        const actions = document.createElement("div");
        actions.className = "mermaid-viewer-actions";
        const viewport = document.createElement("div");
        viewport.className = "mermaid-viewer-viewport";
        viewport.tabIndex = 0;
        viewport.setAttribute("role", "region");
        viewport.setAttribute("aria-label", "Mermaid content");
        const preview = document.createElement("div");
        preview.className = "mermaid-viewer-preview";
        const code = document.createElement("pre");
        code.className = "mermaid-viewer-code";
        const codeText = document.createElement("code");
        codeText.textContent = source;
        code.append(codeText);
        code.hidden = true;

        const status = document.createElement("span");
        status.className = "mermaid-viewer-status";
        status.setAttribute("role", "status");

        const fullscreen = button(fullscreenIcon(), "Enter fullscreen", async () => {
            try {
                if (document.fullscreenElement === shell) {
                    await document.exitFullscreen();
                } else {
                    await shell.requestFullscreen();
                }
            } catch {
                status.textContent = "Fullscreen is unavailable in this browser.";
            }
        });
        fullscreen.className = "mermaid-viewer-fullscreen";

        // Copy the Mermaid source in both views, so it can be pasted into an editor.
        const copy = button(copyIcon(), "Copy Mermaid code", async () => {
            try {
                await navigator.clipboard.writeText(source);
                status.textContent = "Copied";
            } catch {
                setMode(true);
                const range = document.createRange();
                range.selectNodeContents(codeText);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
                status.textContent = "Copy unavailable. Code selected; use Command/Ctrl+C.";
            }
        });
        const modes = document.createElement("div");
        modes.className = "mermaid-viewer-modes";
        modes.setAttribute("role", "group");
        modes.setAttribute("aria-label", "Mermaid view");
        const codeButton = button("Code", "Show Mermaid code", () => setMode(true));
        const previewButton = button("Preview", "Show diagram", () => setMode(false));
        modes.append(codeButton, previewButton);

        function setMode(showCode) {
            code.hidden = !showCode;
            preview.hidden = showCode;
            codeButton.setAttribute("aria-pressed", String(showCode));
            previewButton.setAttribute("aria-pressed", String(!showCode));
            viewport.scrollTo(0, 0);
        }

        diagram.before(shell);
        header.append(title, actions);
        actions.append(fullscreen, copy, modes);
        preview.append(diagram);
        viewport.append(preview, code);
        shell.append(header, status, viewport);
        setMode(false);

        // Fixed CSS dimensions in fullscreen let native browser zoom enlarge the
        // content and create scrollbars, instead of fitting it back down each time.
        shell.addEventListener("fullscreenchange", () => {
            const active = document.fullscreenElement === shell;
            fullscreen.replaceChildren(active ? closeIcon() : fullscreenIcon());
            fullscreen.title = active ? "Exit fullscreen" : "Enter fullscreen";
            fullscreen.setAttribute("aria-label", fullscreen.title);
            if (active) {
                preview.style.width = `${Math.max(1, viewport.clientWidth - 32)}px`;
            } else {
                preview.style.removeProperty("width");
            }
            viewport.scrollTo(0, 0);
        });
    }

    // Material 9.7 replaces each source <pre> with a closed-shadow <div>.
    // Capture that replacement's source directly; SVG text cannot recover it.
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            const source = [...mutation.removedNodes].find(
                (node) => node instanceof Element && node.matches("pre.mermaid")
            );
            if (!source) continue;
            for (const node of mutation.addedNodes) {
                if (node instanceof Element && node.matches("div.mermaid")) {
                    setupViewer(node, source.textContent);
                }
            }
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // If rendering finished before this script loaded, recover the original
    // fences from the current page HTML, preserving document order.
    async function setupExisting() {
        const diagrams = [...document.querySelectorAll("div.mermaid")];
        if (!diagrams.some((diagram) => !viewers.has(diagram))) return;
        try {
            const response = await fetch(location.href);
            if (!response.ok) return;
            const html = new DOMParser().parseFromString(await response.text(), "text/html");
            const sources = [...html.querySelectorAll("pre.mermaid")];
            if (sources.length !== diagrams.length) return;
            diagrams.forEach((diagram, index) => setupViewer(diagram, sources[index].textContent));
        } catch {
            // Leave the rendered diagram usable if the source cannot be fetched.
        }
    }

    setupExisting();
    if (typeof document$ !== "undefined") document$.subscribe(setupExisting);
})();
