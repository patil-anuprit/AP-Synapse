(() => {
    "use strict";

    if (
        window.__AP_APRISHA_ASSISTANT_RUNTIME__
    ) {
        return;
    }

    window.__AP_APRISHA_ASSISTANT_RUNTIME__ =
        true;


    async function executeInbound() {

        const url =
            new URL(
                location.href
            );


        const command =
            String(
                url.searchParams.get(
                    "aprishaCommand"
                ) || ""
            )
            .trim();


        if (!command) {
            return;
        }


        url.searchParams.delete(
            "aprishaCommand"
        );


        history.replaceState(
            history.state,
            "",
            url.pathname +
            url.search +
            url.hash
        );


        const started =
            Date.now();


        while (
            Date.now() -
            started <
            15000
        ) {

            if (
                window.APAprisha &&
                typeof window.APAprisha
                    .execute ===
                    "function"
            ) {

                console.log(
                    "⚡ ANDROID ASSISTANT →",
                    command
                );


                await window.APAprisha
                    .execute(
                        command
                    );


                return;
            }


            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        120
                    )
            );
        }


        console.error(
            "APAprisha.execute was not ready."
        );
    }


    window.AprishaAssistantRuntime = {

        activate() {

            /*
             * Opens only AP Synapse's own native
             * role-activation activity.
             *
             * Android then presents the official
             * Assistant confirmation.
             */
            location.href =
                "apsynapse://assistant/activate";
        },


        executeInbound
    };


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            executeInbound,
            {
                once: true
            }
        );

    } else {

        executeInbound();
    }


    console.log(
        "⚡ APRISHA ANDROID ASSISTANT BRIDGE READY"
    );

})();