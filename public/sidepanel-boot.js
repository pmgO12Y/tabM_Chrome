(() => {
  const splash = document.getElementById("boot-splash");
  const title = splash?.querySelector(".boot-splash__title");
  const body = splash?.querySelector(".boot-splash__body");
  const spinner = splash?.querySelector(".boot-splash__spinner");

  function getLocale() {
    const language = chrome.i18n?.getUILanguage?.() ?? navigator.language ?? "en";
    return String(language).toLowerCase().startsWith("zh") ? "zh-CN" : "en";
  }

  const messages = {
    "zh-CN": {
      loadingTitle: "侧边栏标签管家",
      loadingBody: "正在初始化侧边栏并读取标签…",
      fatalTitle: "侧边栏启动失败",
      fatalBody: "启动脚本报错，请到 chrome://extensions 里重新加载扩展后再试。",
      fatalBodyShort: "启动脚本报错，请重新加载扩展后再试。",
      asyncFailure: "初始化异步流程失败，请重新加载扩展后再试。",
      timeoutTitle: "加载时间过长",
      timeoutBody: "初始化未完成，请到 chrome://extensions 里重新加载扩展后再试。"
    },
    en: {
      loadingTitle: "Tab Sidebar Manager",
      loadingBody: "Starting the side panel and reading tabs…",
      fatalTitle: "Side panel failed to start",
      fatalBody: "The startup script failed. Reload the extension on chrome://extensions and try again.",
      fatalBodyShort: "The startup script failed. Reload the extension and try again.",
      asyncFailure: "The async startup flow failed. Reload the extension and try again.",
      timeoutTitle: "Loading is taking too long",
      timeoutBody: "Initialization did not finish. Reload the extension on chrome://extensions and try again."
    }
  };

  function t(key) {
    return messages[getLocale()][key] ?? messages.en[key] ?? key;
  }

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

  updateSplash(t("loadingTitle"), t("loadingBody"), false);

  window.__sidepanelBoot = {
    ready() {
      document.body.dataset.appReady = "true";
      splash?.remove();
    },
    fatal(message) {
      updateSplash(
        t("fatalTitle"),
        message || t("fatalBody"),
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
        : event.message || t("fatalBodyShort");
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
          : t("asyncFailure");
    window.__sidepanelBoot.fatal(message);
  });

  window.setTimeout(() => {
    if (document.body.dataset.appReady === "true") {
      return;
    }

    updateSplash(
      t("timeoutTitle"),
      t("timeoutBody"),
      true
    );
  }, 4000);
})();
