(() => {
    "use strict";

    const ID = "apAprishaTopbarButton";

    function addStyle() {
        if (document.getElementById("apAprishaTopbarStyle")) return;

        const style = document.createElement("style");
        style.id = "apAprishaTopbarStyle";
        style.textContent = `
            #apAprishaTopbarButton {
                height: 46px;
                padding: 0 16px;
                border: 1px solid rgba(214,181,94,.44);
                border-radius: 14px;
                background: linear-gradient(145deg, rgba(30,31,36,.96), rgba(10,11,14,.96));
                color: #e4c26c;
                font: 850 13px/1 Inter, system-ui, sans-serif;
                cursor: pointer;
                box-shadow: 0 10px 28px rgba(0,0,0,.28);
            }

            #apAprishaTopbarButton:hover {
                border-color: rgba(226,194,108,.75);
                box-shadow: 0 0 22px rgba(214,181,94,.16);
            }

            @media (max-width: 640px) {
                #apAprishaTopbarButton {
                    width: 46px;
                    padding: 0;
                    font-size: 0;
                }

                #apAprishaTopbarButton::after {
                    content: "A";
                    font-size: 14px;
                    font-weight: 900;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function openAprisha() {
        if (window.AprishaFinal?.open) {
            window.AprishaFinal.open();
            return;
        }

        if (window.AprishaV2?.open) {
            window.AprishaV2.open();
            return;
        }

        const mic =
            document.querySelector("[aria-label*='mic' i]") ||
            document.querySelector("[title*='mic' i]");

        if (mic) mic.click();
    }

    function findTopbar() {
        const profile = Array.from(document.querySelectorAll("button, a, [role='button']"))
            .find((el) => String(el.textContent || "").trim().toLowerCase() === "ap");

        return profile?.parentElement || document.querySelector("header") || document.body;
    }

    function install() {
        if (document.getElementById(ID)) return;

        addStyle();

        const button = document.createElement("button");
        button.id = ID;
        button.type = "button";
        button.textContent = "Aprisha";
        button.title = "Open Aprisha";
        button.setAttribute("aria-label", "Open Aprisha");

        button.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            openAprisha();
        });

        const host = findTopbar();
        host.insertBefore(button, host.firstChild);
    }

    function boot() {
        install();
        setInterval(install, 1200);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot, { once: true });
    } else {
        boot();
    }
})();
