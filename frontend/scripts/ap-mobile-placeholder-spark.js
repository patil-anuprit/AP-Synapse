
(() => {
  function init() {
    const input = document.getElementById("userInput");
    const bar = input?.closest(".command-bar");
    if (!input || !bar) return;

    const label = document.createElement("span");
    label.className = "ap-gold-placeholder";
    label.textContent = input.placeholder;
    label.setAttribute("aria-hidden", "true");
    bar.appendChild(label);

    if (getComputedStyle(bar).position === "static") {
      bar.style.position = "relative";
    }

    const mobile = matchMedia("(max-width: 767px)");
    const px = value => parseFloat(value) || 0;

    function update() {
      const visible = mobile.matches && input.value === "";
      label.style.display = visible ? "block" : "none";
      bar.classList.toggle("ap-spark-ready", visible);
      if (!visible) return;

      const rect = input.getBoundingClientRect();
      const parent = bar.getBoundingClientRect();
      const style = getComputedStyle(input);
      const leftPad = px(style.paddingLeft);
      const rightPad = px(style.paddingRight);

      label.style.left = `${rect.left - parent.left + leftPad}px`;
      label.style.top = `${rect.top - parent.top}px`;
      label.style.width = `${Math.max(0, rect.width - leftPad - rightPad)}px`;
      label.style.height = `${rect.height}px`;
      label.style.lineHeight = `${rect.height}px`;
      label.style.fontFamily = style.fontFamily;
      label.style.fontSize = style.fontSize;
      label.style.fontWeight = style.fontWeight;
      label.style.letterSpacing = style.letterSpacing;
      label.style.textAlign = style.textAlign;
    }

    input.addEventListener("input", update);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    mobile.addEventListener?.("change", update);

    if (window.ResizeObserver) {
      const observer = new ResizeObserver(update);
      observer.observe(input);
      observer.observe(bar);
    }

    update();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
