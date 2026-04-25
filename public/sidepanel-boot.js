(() => {
  const splash = document.getElementById("boot-splash");
  const title = splash?.querySelector(".boot-splash__title");
  const body = splash?.querySelector(".boot-splash__body");
  const spinner = splash?.querySelector(".boot-splash__spinner");

  function updateSplash(nextTitle, nextBody, timedOut) {
    if (!splash) {
      return;
    }

    if (timedOut) {
      splash.classList.add("boot-splash--timeout");
    } else {
      splash.classList.remove("boot-splash--timeout");
    }

    if (title) {
      title.textContent = nextTitle;
    }

    if (body) {
      body.textContent = nextBody;
    }

    if (spinner) {
      spinner.style.display = timedOut ? "none" : "";
    }
  }

  window.__sidepanelBoot = {
    ready() {
      document.body.dataset.appReady = "true";
      splash?.remove();
    },
    fatal(message) {
      updateSplash(
        "侧边栏启动失败",
        message || "启动脚本报错，请到 chrome://extensions 里重新加载扩展后再试。",
        true
      );
    }
  };

  window.addEventListener("error", (event) => {
    if (document.body.dataset.appReady === "true") {
      return;
    }

    const message =
      event.error instanceof Error
        ? event.error.message
        : event.message || "启动脚本报错，请重新加载扩展后再试。";
    window.__sidepanelBoot.fatal(message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    if (document.body.dataset.appReady === "true") {
      return;
    }

    const reason = event.reason;
    const message =
      reason instanceof Error
        ? reason.message
        : typeof reason === "string"
          ? reason
          : "初始化异步流程失败，请重新加载扩展后再试。";
    window.__sidepanelBoot.fatal(message);
  });

  window.setTimeout(() => {
    if (document.body.dataset.appReady === "true") {
      return;
    }

    updateSplash(
      "加载时间过长",
      "初始化未完成，请到 chrome://extensions 里重新加载扩展后再试。",
      true
    );
  }, 4000);
})();
