/* ============================================================
   AP SYNAPSE — MOBILE TABLE MASTER ENGINE
   ============================================================ */

(() => {
    "use strict";

    const SHELL =
        "ap-mobile-table-shell";


    function columns(table) {

        let max =
            1;


        [...table.rows]
            .slice(0, 10)
            .forEach(row => {

                let count =
                    0;


                [...row.cells]
                    .forEach(cell => {

                        count +=
                            Number(
                                cell.colSpan || 1
                            );

                    });


                max =
                    Math.max(
                        max,
                        count
                    );

            });


        return max;
    }


    function minimumWidth(count) {

        if (count <= 2) {
            return "100%";
        }

        if (count === 3) {
            return "430px";
        }

        if (count === 4) {
            return "560px";
        }

        if (count === 5) {
            return "690px";
        }


        return `${
            Math.min(
                1000,
                count * 138
            )
        }px`;
    }


    function releaseParents(table) {

        let element =
            table.parentElement;

        let depth =
            0;


        while (
            element &&
            element.id !== "assistantPage" &&
            depth < 7
        ) {

            /*
             * Do not alter the overall messages scroller.
             * Only free the response's local wrappers.
             */

            if (
                !element.matches(
                    ".messages, .chat-messages, .conversation-messages, .message-list, .messages-container"
                )
            ) {

                element.classList.add(
                    "ap-table-content-owner"
                );

            }


            element =
                element.parentElement;

            depth++;
        }
    }


    function updateWideState(shell) {

        requestAnimationFrame(() => {

            const wide =
                shell.scrollWidth >
                shell.clientWidth + 4;


            shell.classList.toggle(
                "ap-table-wide",
                wide
            );

        });
    }


    function enhance(table) {

        if (
            !(table instanceof HTMLTableElement)
        ) {
            return;
        }


        if (
            !table.closest("#assistantPage")
        ) {
            return;
        }


        if (
            table.closest(
                "." + SHELL
            )
        ) {

            updateWideState(
                table.closest(
                    "." + SHELL
                )
            );

            return;
        }


        /*
         * FIRST:
         * free narrow assistant response ancestors.
         */

        releaseParents(
            table
        );


        const count =
            columns(
                table
            );


        const shell =
            document.createElement(
                "div"
            );


        shell.className =
            `${SHELL} ap-columns-${count}`;


        shell.tabIndex =
            0;


        shell.setAttribute(
            "role",
            "region"
        );


        shell.setAttribute(
            "aria-label",
            "Scrollable comparison table"
        );


        table.style.setProperty(
            "--ap-table-width",
            minimumWidth(count)
        );


        const hint =
            document.createElement(
                "div"
            );


        hint.className =
            "ap-mobile-table-hint";


        hint.innerHTML =
            `<span>Swipe to compare</span><span aria-hidden="true">→</span>`;


        const parent =
            table.parentNode;


        if (!parent) {
            return;
        }


        parent.insertBefore(
            shell,
            table
        );


        shell.appendChild(
            hint
        );


        shell.appendChild(
            table
        );


        updateWideState(
            shell
        );


        /*
         * Once the user starts scrolling,
         * make the hint less visually dominant.
         */

        shell.addEventListener(
            "scroll",
            () => {

                if (
                    shell.scrollLeft > 12
                ) {

                    hint.style.opacity =
                        ".38";

                } else {

                    hint.style.opacity =
                        "1";
                }

            },
            {
                passive:
                    true
            }
        );

    }


    function scan(root) {

        if (!root) return;


        if (
            root instanceof
            HTMLTableElement
        ) {

            enhance(
                root
            );

            return;
        }


        root
            .querySelectorAll?.(
                "table"
            )
            .forEach(
                enhance
            );
    }


    function start() {

        const page =
            document.getElementById(
                "assistantPage"
            );


        if (!page) {
            return;
        }


        /*
         * Existing responses.
         */

        page
            .querySelectorAll(
                "table"
            )
            .forEach(
                enhance
            );


        /*
         * Streaming/new responses.
         *
         * CHILD INSERTIONS ONLY.
         * No attribute observer,
         * no style observer,
         * no feedback loop.
         */

        const observer =
            new MutationObserver(
                mutations => {

                    mutations.forEach(
                        mutation => {

                            mutation
                                .addedNodes
                                .forEach(node => {

                                    if (
                                        node.nodeType !==
                                        Node.ELEMENT_NODE
                                    ) {
                                        return;
                                    }


                                    scan(
                                        node
                                    );

                                });

                        });

                }
            );


        observer.observe(
            page,
            {
                childList:
                    true,

                subtree:
                    true
            }
        );


        window.addEventListener(
            "resize",
            () => {

                page
                    .querySelectorAll(
                        "." + SHELL
                    )
                    .forEach(
                        updateWideState
                    );

            },
            {
                passive:
                    true
            }
        );


        console.log(
            "✅ AP SYNAPSE — MOBILE TABLE MASTER READY"
        );
    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            start,
            {
                once:
                    true
            }
        );

    } else {

        start();
    }

})();

