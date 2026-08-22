(() => {
    "use strict";

    const html =
        document.documentElement;

    let rail = null;
    let thumb = null;
    let currentScroller = null;


    function active() {

        return (
            window.innerWidth <= 760 &&
            document.body.dataset.page === "assistant"
        );
    }


    function ensureScrollbar() {

        if (rail) {
            return;
        }


        rail =
            document.createElement("div");

        rail.className =
            "ap-mobile-single-scrollbar";


        thumb =
            document.createElement("div");

        thumb.className =
            "ap-mobile-single-scrollbar-thumb";


        rail.appendChild(thumb);

        document.body.appendChild(rail);
    }


    /* ========================================================
       REMOVE OLD CUSTOM VISUAL TRACKS
       ======================================================== */

    function hideOldScrollbarElements() {

        const selectors = `
            [class*="scrollbar"],
            [class*="scroll-track"],
            [class*="scroll-thumb"],
            [class*="scroll-indicator"]
        `;


        document
            .querySelectorAll(selectors)
            .forEach(element => {

                /*
                 * Never hide our new scrollbar.
                 */
                if (
                    element === rail ||
                    element === thumb ||
                    rail?.contains(element)
                ) {
                    return;
                }


                const rect =
                    element.getBoundingClientRect();


                /*
                 * Only suppress narrow/tall scrollbar-like
                 * elements near the right edge of the phone.
                 */
                if (
                    rect.height > 80 &&
                    rect.width <= 20 &&
                    rect.right >
                        window.innerWidth - 30
                ) {

                    element.classList.add(
                        "ap-old-scroll-visual-hidden"
                    );
                }

            });
    }


    /* ========================================================
       FIND REAL SCROLL OWNER
       ======================================================== */

    function canScroll(element) {

        if (!element) {
            return false;
        }


        return (
            element.scrollHeight >
            element.clientHeight + 4
        );
    }


    function findBestScroller() {

        const page =
            document.getElementById(
                "assistantPage"
            );


        const candidates = [];


        if (page) {

            candidates.push(page);


            /*
             * Parents
             */
            let parent =
                page.parentElement;


            while (
                parent &&
                parent !== document.body
            ) {

                candidates.push(parent);

                parent =
                    parent.parentElement;
            }


            /*
             * Descendants
             */
            page
                .querySelectorAll("*")
                .forEach(element => {

                    if (
                        element.matches(
                            "textarea, input, select"
                        )
                    ) {
                        return;
                    }

                    candidates.push(element);
                });
        }


        if (
            document.scrollingElement
        ) {

            candidates.push(
                document.scrollingElement
            );
        }


        const unique =
            [...new Set(candidates)];


        const ranked =
            unique
                .filter(canScroll)
                .map(element => {

                    const rect =
                        element.getBoundingClientRect();


                    return {

                        element,

                        /*
                         * Prefer large visible page/workspace
                         * scrollers rather than small cards.
                         */
                        score:
                            Math.max(
                                0,
                                rect.height
                            ) +

                            (
                                rect.right >
                                window.innerWidth - 40
                                    ? 1000
                                    : 0
                            ) +

                            Math.min(
                                500,
                                element.scrollHeight -
                                element.clientHeight
                            )
                    };

                })
                .sort(
                    (a, b) =>
                        b.score - a.score
                );


        return (
            ranked[0]?.element ||
            document.scrollingElement ||
            page
        );
    }


    /* ========================================================
       DRAW ONE SCROLL THUMB
       ======================================================== */

    function updateScrollbar(
        scroller = currentScroller
    ) {

        if (
            !active() ||
            !rail ||
            !thumb ||
            !scroller
        ) {
            return;
        }


        if (!canScroll(scroller)) {

            rail.classList.add(
                "no-scroll"
            );

            return;
        }


        rail.classList.remove(
            "no-scroll"
        );


        const trackHeight =
            rail.clientHeight;


        if (trackHeight <= 0) {
            return;
        }


        const clientHeight =
            scroller.clientHeight;


        const scrollHeight =
            scroller.scrollHeight;


        const scrollTop =
            scroller.scrollTop;


        const scrollRange =
            Math.max(
                1,
                scrollHeight -
                clientHeight
            );


        const thumbHeight =
            Math.max(
                28,

                Math.min(
                    trackHeight,

                    trackHeight *
                    (
                        clientHeight /
                        scrollHeight
                    )
                )
            );


        const available =
            Math.max(
                0,
                trackHeight -
                thumbHeight
            );


        const progress =
            Math.max(
                0,
                Math.min(
                    1,
                    scrollTop /
                    scrollRange
                )
            );


        thumb.style.height =
            `${thumbHeight}px`;


        thumb.style.transform =
            `translateY(${
                available * progress
            }px)`;
    }


    /* ========================================================
       MODE
       ======================================================== */

    function refresh() {

        ensureScrollbar();


        if (!active()) {

            html.classList.remove(
                "ap-one-mobile-scrollbar"
            );


            rail.style.display =
                "none";


            return;
        }


        html.classList.add(
            "ap-one-mobile-scrollbar"
        );


        rail.style.display =
            "block";


        hideOldScrollbarElements();


        currentScroller =
            findBestScroller();


        updateScrollbar(
            currentScroller
        );


        console.log(
            "✅ AP SYNAPSE — SINGLE VISUAL SCROLLBAR ACTIVE",
            currentScroller
        );
    }


    /* ========================================================
       LISTEN TO WHICHEVER CONTAINER ACTUALLY SCROLLS
       ======================================================== */

    document.addEventListener(
        "scroll",
        event => {

            if (!active()) {
                return;
            }


            let scroller;


            if (
                event.target === document
            ) {

                scroller =
                    document.scrollingElement;

            } else {

                scroller =
                    event.target;
            }


            if (
                scroller &&
                canScroll(scroller)
            ) {

                currentScroller =
                    scroller;

                updateScrollbar(
                    currentScroller
                );
            }

        },

        true
    );


    window.addEventListener(
        "resize",
        refresh,
        {
            passive: true
        }
    );


    const observer =
        new MutationObserver(
            refresh
        );


    observer.observe(
        document.body,
        {
            attributes: true,
            attributeFilter: [
                "data-page"
            ]
        }
    );


    requestAnimationFrame(() => {

        requestAnimationFrame(
            refresh
        );

    });


    setTimeout(
        refresh,
        250
    );

})();