(() => {

    "use strict";

    if (window.__AP_APRISHA_PRESENCE_V2__) {
        return;
    }

    window.__AP_APRISHA_PRESENCE_V2__ = true;


    const ROOT_ID =
        "apAprishaPresenceV2";

    const STYLE_ID =
        "apAprishaPresenceV2Style";


    let root = null;
    let title = null;
    let eyebrow = null;
    let subtitle = null;
    let status = null;

    let visible = false;
    let state = "hidden";
    let hideTimer = null;
    let wakeGuardUntil = 0;
    let lastSpeechState = false;


    function installStyles() {

        if (document.getElementById(STYLE_ID)) {
            return;
        }


        const style =
            document.createElement("style");

        style.id =
            STYLE_ID;


        style.textContent = String.raw`

:root {
    --ap-p-gold: #e5c36d;
    --ap-p-gold-bright: #f3dda0;
    --ap-p-ivory: #f7f2e8;
    --ap-p-bg: #050505;
    --ap-p-ease: cubic-bezier(.16,1,.3,1);
}


/* ======================================================
   FULL SCREEN INTELLIGENCE PRESENCE
   ====================================================== */

#apAprishaPresenceV2 {
    position: fixed;
    inset: 0;

    z-index: 2147483000;

    pointer-events: none;

    overflow: hidden;

    visibility: hidden;
    opacity: 0;

    isolation: isolate;

    transition:
        opacity .52s var(--ap-p-ease),
        visibility .52s;
}


#apAprishaPresenceV2.ap-visible {
    visibility: visible;
    opacity: 1;
}


/* ======================================================
   CINEMATIC BACKDROP
   ====================================================== */

.ap-p-backdrop {
    position: absolute;
    inset: 0;

    background:
        radial-gradient(
            ellipse at 50% 45%,
            rgba(229,195,109,.065) 0%,
            rgba(9,9,10,.20) 36%,
            rgba(3,3,4,.62) 78%,
            rgba(0,0,0,.78) 100%
        );

    backdrop-filter:
        blur(5px)
        saturate(.72);

    -webkit-backdrop-filter:
        blur(5px)
        saturate(.72);

    animation:
        apBackdropIn
        .7s
        var(--ap-p-ease)
        both;
}


/* ======================================================
   GOLD PERIMETER
   ====================================================== */

.ap-p-frame {
    position: absolute;

    inset: 10px;

    border-radius: 24px;

    border:
        1px solid
        rgba(229,195,109,.13);

    box-shadow:
        inset 0 0 90px
        rgba(229,195,109,.025),

        0 0 70px
        rgba(0,0,0,.25);
}


.ap-p-frame::before,
.ap-p-frame::after {
    content: "";

    position: absolute;

    left: 50%;

    width: 36%;
    height: 1px;

    transform:
        translateX(-50%);

    background:
        linear-gradient(
            90deg,
            transparent,
            rgba(243,221,160,.82),
            transparent
        );

    filter:
        drop-shadow(
            0 0 12px
            rgba(229,195,109,.45)
        );

    animation:
        apEdgeBreath
        3.4s
        ease-in-out
        infinite;
}


.ap-p-frame::before {
    top: -1px;
}


.ap-p-frame::after {
    bottom: -1px;
}


/* ======================================================
   CORNER SIGNATURES
   ====================================================== */

.ap-p-corner {
    position: absolute;

    width: 68px;
    height: 68px;

    opacity: .52;
}


.ap-p-corner::before,
.ap-p-corner::after {
    content: "";

    position: absolute;

    background:
        linear-gradient(
            90deg,
            rgba(229,195,109,.7),
            transparent
        );
}


.ap-p-corner::before {
    width: 68px;
    height: 1px;
}


.ap-p-corner::after {
    width: 1px;
    height: 68px;
}


.ap-p-c1 {
    top: 22px;
    left: 22px;
}


.ap-p-c2 {
    top: 22px;
    right: 22px;

    transform:
        rotate(90deg);
}


.ap-p-c3 {
    bottom: 22px;
    right: 22px;

    transform:
        rotate(180deg);
}


.ap-p-c4 {
    bottom: 22px;
    left: 22px;

    transform:
        rotate(270deg);
}


/* ======================================================
   NEURAL FIELD
   ====================================================== */

.ap-p-field {
    position: absolute;

    left: 50%;
    top: 48%;

    width:
        min(
            1080px,
            108vw
        );

    aspect-ratio: 1;

    transform:
        translate(-50%,-50%);

    border-radius: 50%;

    background:
        radial-gradient(
            circle,
            rgba(229,195,109,.085) 0%,
            rgba(229,195,109,.03) 27%,
            transparent 67%
        );

    animation:
        apFieldBreath
        5.2s
        ease-in-out
        infinite;
}


.ap-p-field::before {
    content: "";

    position: absolute;
    inset: 15%;

    border-radius: 50%;

    border:
        1px solid
        rgba(229,195,109,.06);

    animation:
        apRotate
        32s
        linear
        infinite;
}


.ap-p-field::after {
    content: "";

    position: absolute;
    inset: 28%;

    border-radius: 50%;

    border:
        1px dashed
        rgba(229,195,109,.08);

    animation:
        apRotateReverse
        22s
        linear
        infinite;
}


/* ======================================================
   PARTICLE CANVAS
   ====================================================== */

#apPresenceCanvas {
    position: absolute;
    inset: 0;

    width: 100%;
    height: 100%;

    opacity: .72;
}


/* ======================================================
   CENTRAL STAGE
   ====================================================== */

.ap-p-stage {
    position: absolute;

    left: 50%;
    top: 48%;

    transform:
        translate(-50%,-50%);

    width:
        min(
            720px,
            92vw
        );

    display: flex;
    flex-direction: column;

    align-items: center;

    text-align: center;

    opacity: 0;

    animation:
        apStageIn
        .72s
        var(--ap-p-ease)
        .05s
        forwards;
}


/* ======================================================
   INTELLIGENCE CORE
   ====================================================== */

.ap-p-core {
    position: relative;

    width: 210px;
    height: 210px;

    display: grid;
    place-items: center;

    margin-bottom: 38px;
}


.ap-p-aura {
    position: absolute;

    inset: -78px;

    border-radius: 50%;

    background:
        radial-gradient(
            circle,
            rgba(229,195,109,.17),
            rgba(229,195,109,.045) 39%,
            transparent 69%
        );

    filter:
        blur(21px);

    animation:
        apAura
        3.1s
        ease-in-out
        infinite;
}


.ap-p-orbit {
    position: absolute;
    inset: 0;

    border-radius: 50%;

    background:
        conic-gradient(
            from 8deg,

            transparent 0deg,

            rgba(229,195,109,.10)
            48deg,

            rgba(243,221,160,.98)
            93deg,

            rgba(229,195,109,.16)
            122deg,

            transparent 174deg,

            rgba(229,195,109,.48)
            273deg,

            transparent 332deg
        );

    -webkit-mask:
        radial-gradient(
            farthest-side,
            transparent
            calc(100% - 2px),
            #000 0
        );

    mask:
        radial-gradient(
            farthest-side,
            transparent
            calc(100% - 2px),
            #000 0
        );

    filter:
        drop-shadow(
            0 0 14px
            rgba(229,195,109,.34)
        );

    animation:
        apRotate
        8.5s
        linear
        infinite;
}


.ap-p-orbit2 {
    position: absolute;
    inset: 20px;

    border-radius: 50%;

    border:
        1px solid
        rgba(247,242,232,.12);

    animation:
        apOrbitPulse
        3.1s
        ease-in-out
        infinite;
}


.ap-p-orbit2::before {
    content: "";

    position: absolute;

    top: -4px;
    left: 50%;

    width: 7px;
    height: 7px;

    transform:
        translateX(-50%);

    border-radius: 50%;

    background:
        var(--ap-p-gold-bright);

    box-shadow:
        0 0 19px
        rgba(243,221,160,.90);
}


.ap-p-disc {
    position: absolute;

    inset: 45px;

    border-radius: 50%;

    background:
        linear-gradient(
            145deg,
            rgba(255,255,255,.072),
            rgba(255,255,255,.012)
        );

    border:
        1px solid
        rgba(255,255,255,.10);

    box-shadow:
        inset 0 1px 0
        rgba(255,255,255,.11),

        inset 0 -25px 44px
        rgba(0,0,0,.23),

        0 30px 90px
        rgba(0,0,0,.65);

    backdrop-filter:
        blur(20px);

    -webkit-backdrop-filter:
        blur(20px);
}


.ap-p-mark {
    position: relative;

    z-index: 3;

    color:
        var(--ap-p-gold-bright);

    font-family:
        Inter,
        "Segoe UI",
        sans-serif;

    font-size: 41px;

    font-weight: 520;

    letter-spacing: -.075em;

    text-shadow:
        0 0 28px
        rgba(229,195,109,.42);
}


/* ======================================================
   STATUS PILL
   ====================================================== */

.ap-p-status {
    position: absolute;

    top:
        max(
            22px,
            env(safe-area-inset-top)
        );

    left: 50%;

    transform:
        translateX(-50%);

    display: flex;
    align-items: center;

    gap: 9px;

    padding:
        9px 15px;

    border:
        1px solid
        rgba(229,195,109,.12);

    border-radius: 999px;

    background:
        rgba(7,7,8,.60);

    backdrop-filter:
        blur(18px);

    -webkit-backdrop-filter:
        blur(18px);

    color:
        rgba(247,242,232,.72);

    font-family:
        Inter,
        "Segoe UI",
        sans-serif;

    font-size: 9px;

    font-weight: 620;

    letter-spacing: .22em;

    text-transform: uppercase;

    animation:
        apStatusIn
        .75s
        var(--ap-p-ease)
        both;
}


.ap-p-dot {
    width: 5px;
    height: 5px;

    border-radius: 50%;

    background:
        var(--ap-p-gold-bright);

    box-shadow:
        0 0 13px
        rgba(243,221,160,.92);
}


/* ======================================================
   TYPOGRAPHY
   ====================================================== */

.ap-p-eyebrow {
    margin-bottom: 12px;

    color:
        rgba(229,195,109,.84);

    font-family:
        Inter,
        "Segoe UI",
        sans-serif;

    font-size: 10px;

    font-weight: 650;

    letter-spacing: .42em;

    text-transform: uppercase;
}


.ap-p-title {
    margin: 0;

    color:
        var(--ap-p-ivory);

    font-family:
        Inter,
        "Segoe UI",
        sans-serif;

    font-size:
        clamp(
            46px,
            6.3vw,
            78px
        );

    font-weight: 500;

    line-height: .97;

    letter-spacing: -.06em;

    text-shadow:
        0 16px 58px
        rgba(0,0,0,.68);
}


.ap-p-subtitle {
    margin-top: 17px;

    color:
        rgba(247,242,232,.57);

    font-family:
        Inter,
        "Segoe UI",
        sans-serif;

    font-size:
        clamp(
            13px,
            1.35vw,
            16px
        );

    font-weight: 430;

    letter-spacing: .04em;
}


/* ======================================================
   ACOUSTIC WAVE
   ====================================================== */

.ap-p-wave {
    height: 54px;

    margin-top: 27px;

    display: flex;

    align-items: center;
    justify-content: center;

    gap: 5px;
}


.ap-p-wave span {
    width: 2px;
    height: 7px;

    border-radius: 999px;

    background:
        linear-gradient(
            180deg,
            var(--ap-p-gold-bright),
            rgba(229,195,109,.24)
        );

    box-shadow:
        0 0 11px
        rgba(229,195,109,.30);

    animation:
        apWave
        1.12s
        ease-in-out
        infinite;
}


.ap-p-wave span:nth-child(2) {
    animation-delay: -.91s;
}

.ap-p-wave span:nth-child(3) {
    animation-delay: -.64s;
}

.ap-p-wave span:nth-child(4) {
    animation-delay: -.35s;
}

.ap-p-wave span:nth-child(5) {
    animation-delay: -.12s;
}

.ap-p-wave span:nth-child(6) {
    animation-delay: -.73s;
}

.ap-p-wave span:nth-child(7) {
    animation-delay: -.46s;
}

.ap-p-wave span:nth-child(8) {
    animation-delay: -.82s;
}

.ap-p-wave span:nth-child(9) {
    animation-delay: -.22s;
}


/* ======================================================
   STATES
   ====================================================== */

#apAprishaPresenceV2[data-state="thinking"]
.ap-p-orbit {
    animation-duration: 1.7s;
}


#apAprishaPresenceV2[data-state="thinking"]
.ap-p-orbit2 {
    animation-duration: 1.4s;
}


#apAprishaPresenceV2[data-state="speaking"]
.ap-p-core {
    animation:
        apSpeakingCore
        1.25s
        ease-in-out
        infinite;
}


#apAprishaPresenceV2[data-state="speaking"]
.ap-p-wave span {
    animation-duration: .62s;
}


/* ======================================================
   EXIT
   ====================================================== */

#apAprishaPresenceV2.ap-exit {
    opacity: 0;
}


/* ======================================================
   KEYFRAMES
   ====================================================== */

@keyframes apBackdropIn {

    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}


@keyframes apStageIn {

    from {
        opacity: 0;

        transform:
            translate(-50%,-46%)
            scale(.88);
    }

    to {
        opacity: 1;

        transform:
            translate(-50%,-50%)
            scale(1);
    }
}


@keyframes apStatusIn {

    from {
        opacity: 0;

        transform:
            translateX(-50%)
            translateY(-12px);
    }

    to {
        opacity: 1;

        transform:
            translateX(-50%)
            translateY(0);
    }
}


@keyframes apAura {

    0%,
    100% {
        transform: scale(.91);
        opacity: .43;
    }

    50% {
        transform: scale(1.10);
        opacity: .95;
    }
}


@keyframes apOrbitPulse {

    0%,
    100% {
        transform: scale(.96);
        opacity: .44;
    }

    50% {
        transform: scale(1.035);
        opacity: 1;
    }
}


@keyframes apFieldBreath {

    0%,
    100% {
        transform:
            translate(-50%,-50%)
            scale(.94);

        opacity: .48;
    }

    50% {
        transform:
            translate(-50%,-50%)
            scale(1.055);

        opacity: .90;
    }
}


@keyframes apEdgeBreath {

    0%,
    100% {
        opacity: .26;
        width: 23%;
    }

    50% {
        opacity: .96;
        width: 43%;
    }
}


@keyframes apRotate {

    to {
        transform: rotate(360deg);
    }
}


@keyframes apRotateReverse {

    to {
        transform: rotate(-360deg);
    }
}


@keyframes apWave {

    0%,
    100% {
        height: 7px;
        opacity: .38;
    }

    50% {
        height: 34px;
        opacity: 1;
    }
}


@keyframes apSpeakingCore {

    0%,
    100% {
        transform: scale(.98);
    }

    50% {
        transform: scale(1.05);
    }
}


/* ======================================================
   MOBILE
   ====================================================== */

@media (max-width: 720px) {

    .ap-p-frame {
        inset: 6px;
        border-radius: 19px;
    }


    .ap-p-stage {
        top: 47%;
    }


    .ap-p-core {
        width: 168px;
        height: 168px;

        margin-bottom: 31px;
    }


    .ap-p-disc {
        inset: 36px;
    }


    .ap-p-title {
        font-size:
            clamp(
                42px,
                14vw,
                62px
            );
    }


    .ap-p-status {
        top:
            max(
                14px,
                env(safe-area-inset-top)
            );
    }
}


/* ======================================================
   REDUCED MOTION
   ====================================================== */

@media (
    prefers-reduced-motion:
    reduce
) {

    #apAprishaPresenceV2 *,
    #apAprishaPresenceV2 *::before,
    #apAprishaPresenceV2 *::after {

        animation-duration:
            .001ms !important;

        animation-iteration-count:
            1 !important;
    }
}

`;

        document.head.appendChild(style);
    }



    function createUI() {

        installStyles();


        root =
            document.getElementById(
                ROOT_ID
            );


        if (root) {
            return;
        }


        root =
            document.createElement(
                "div"
            );


        root.id =
            ROOT_ID;


        root.innerHTML = `

            <div class="ap-p-backdrop"></div>

            <canvas id="apPresenceCanvas"></canvas>

            <div class="ap-p-frame"></div>

            <div class="ap-p-corner ap-p-c1"></div>
            <div class="ap-p-corner ap-p-c2"></div>
            <div class="ap-p-corner ap-p-c3"></div>
            <div class="ap-p-corner ap-p-c4"></div>

            <div class="ap-p-field"></div>


            <div class="ap-p-status">

                <span class="ap-p-dot"></span>

                <span id="apPresenceStatus">
                    Aprisha · Awake
                </span>

            </div>


            <main class="ap-p-stage">

                <div class="ap-p-core">

                    <div class="ap-p-aura"></div>

                    <div class="ap-p-orbit"></div>

                    <div class="ap-p-orbit2"></div>

                    <div class="ap-p-disc"></div>

                    <div class="ap-p-mark">
                        AP
                    </div>

                </div>


                <div
                    class="ap-p-eyebrow"
                    id="apPresenceEyebrow">

                    APRISHA · PRESENT

                </div>


                <h1
                    class="ap-p-title"
                    id="apPresenceTitle">

                    Yes?

                </h1>


                <div
                    class="ap-p-subtitle"
                    id="apPresenceSubtitle">

                    I'm listening.

                </div>


                <div class="ap-p-wave">

                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>

                </div>

            </main>
        `;


        document.body.appendChild(
            root
        );


        title =
            root.querySelector(
                "#apPresenceTitle"
            );


        eyebrow =
            root.querySelector(
                "#apPresenceEyebrow"
            );


        subtitle =
            root.querySelector(
                "#apPresenceSubtitle"
            );


        status =
            root.querySelector(
                "#apPresenceStatus"
            );


        startParticles();
    }



    function startParticles() {

        const canvas =
            document.getElementById(
                "apPresenceCanvas"
            );


        if (!canvas) {
            return;
        }


        const context =
            canvas.getContext(
                "2d"
            );


        if (!context) {
            return;
        }


        const particles = [];


        function resize() {

            const dpr =
                Math.min(
                    window.devicePixelRatio ||
                    1,
                    2
                );


            canvas.width =
                innerWidth *
                dpr;


            canvas.height =
                innerHeight *
                dpr;


            canvas.style.width =
                innerWidth +
                "px";


            canvas.style.height =
                innerHeight +
                "px";


            context.setTransform(
                dpr,
                0,
                0,
                dpr,
                0,
                0
            );
        }


        resize();


        window.addEventListener(
            "resize",
            resize,
            {
                passive: true
            }
        );


        for (
            let i = 0;
            i < 52;
            i++
        ) {

            particles.push({

                x:
                    Math.random() *
                    innerWidth,

                y:
                    Math.random() *
                    innerHeight,

                r:
                    .35 +
                    Math.random() *
                    1.25,

                a:
                    .08 +
                    Math.random() *
                    .42,

                vx:
                    (
                        Math.random() -
                        .5
                    ) *
                    .075,

                vy:
                    (
                        Math.random() -
                        .5
                    ) *
                    .075
            });
        }


        function frame() {

            context.clearRect(
                0,
                0,
                innerWidth,
                innerHeight
            );


            for (
                const particle
                of particles
            ) {

                particle.x +=
                    particle.vx;

                particle.y +=
                    particle.vy;


                if (
                    particle.x < 0
                ) {
                    particle.x =
                        innerWidth;
                }


                if (
                    particle.x >
                    innerWidth
                ) {
                    particle.x =
                        0;
                }


                if (
                    particle.y < 0
                ) {
                    particle.y =
                        innerHeight;
                }


                if (
                    particle.y >
                    innerHeight
                ) {
                    particle.y =
                        0;
                }


                context.beginPath();


                context.arc(
                    particle.x,
                    particle.y,
                    particle.r,
                    0,
                    Math.PI *
                    2
                );


                context.fillStyle =
                    "rgba(229,195,109," +
                    particle.a +
                    ")";


                context.fill();
            }


            requestAnimationFrame(
                frame
            );
        }


        frame();
    }



    function setText(
        node,
        value
    ) {

        if (node) {
            node.textContent =
                value;
        }
    }



    function show(
        nextState
    ) {

        createUI();


        visible =
            true;


        state =
            nextState;


        root.dataset.state =
            nextState;


        root.classList.remove(
            "ap-exit"
        );


        root.classList.add(
            "ap-visible"
        );


        clearTimeout(
            hideTimer
        );


        if (
            nextState ===
            "wake"
        ) {

            wakeGuardUntil =
                Date.now() +
                1750;


            setText(
                status,
                "Aprisha · Awake"
            );


            setText(
                eyebrow,
                "APRISHA · PRESENT"
            );


            setText(
                title,
                "Yes?"
            );


            setText(
                subtitle,
                "I'm listening."
            );


            hideTimer =
                setTimeout(
                    hide,
                    14000
                );


            return;
        }


        if (
            nextState ===
            "thinking"
        ) {

            setText(
                status,
                "Aprisha · Thinking"
            );


            setText(
                eyebrow,
                "APRISHA · INTELLIGENCE"
            );


            setText(
                title,
                "Thinking"
            );


            setText(
                subtitle,
                "Understanding your request."
            );


            hideTimer =
                setTimeout(
                    hide,
                    20000
                );


            return;
        }


        if (
            nextState ===
            "speaking"
        ) {

            setText(
                status,
                "Aprisha · Speaking"
            );


            setText(
                eyebrow,
                "APRISHA · RESPONSE"
            );


            setText(
                title,
                "Aprisha"
            );


            setText(
                subtitle,
                "Speaking."
            );


            return;
        }


        setText(
            status,
            "Aprisha · Listening"
        );


        setText(
            eyebrow,
            "APRISHA · ACTIVE"
        );


        setText(
            title,
            "Listening"
        );


        setText(
            subtitle,
            "Speak naturally."
        );


        hideTimer =
            setTimeout(
                hide,
                9500
            );
    }



    function hide() {

        if (!root) {
            return;
        }


        visible =
            false;


        state =
            "hidden";


        root.classList.add(
            "ap-exit"
        );


        setTimeout(
            () => {

                if (
                    !visible
                ) {

                    root.classList.remove(
                        "ap-visible"
                    );
                }
            },
            550
        );
    }



    /*
     * PASSIVE TTS OBSERVER.
     *
     * Reads state only.
     * Never replaces speak() or cancel().
     */

    setInterval(
        () => {

            if (!visible) {
                return;
            }


            const synth =
                window.speechSynthesis;


            const speaking =
                Boolean(
                    synth &&
                    synth.speaking
                );


            if (
                Date.now() <
                wakeGuardUntil
            ) {

                lastSpeechState =
                    speaking;

                return;
            }


            if (
                speaking &&
                !lastSpeechState
            ) {

                show(
                    "speaking"
                );
            }


            if (
                !speaking &&
                lastSpeechState &&
                state ===
                "speaking"
            ) {

                show(
                    "listening"
                );
            }


            lastSpeechState =
                speaking;

        },
        80
    );



    window.APAprishaPresenceV2 = {

        wake() {

            show(
                "wake"
            );
        },


        listening() {

            show(
                "listening"
            );
        },


        thinking() {

            show(
                "thinking"
            );
        },


        speaking() {

            show(
                "speaking"
            );
        },


        hide,


        preview() {

            show(
                "wake"
            );
        }
    };


    console.log(
        "✦ APRISHA PRESENCE V2 PASSIVE READY"
    );

})();
