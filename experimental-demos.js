(() => {
  "use strict";

  const FIRST_FRAME_TIME = 0.04;

  function initExperimentalDemos() {
    // =========================================================
    // 1. Config 缩略图：显示真实视频第一帧
    // =========================================================
    document.querySelectorAll(".exp-config-thumb").forEach((thumb) => {
      thumb.muted = true;
      thumb.playsInline = true;

      const showFirstFrame = () => {
        if (!Number.isFinite(thumb.duration) || thumb.duration <= 0) return;

        const t = Math.min(
          FIRST_FRAME_TIME,
          Math.max(0.001, thumb.duration / 100)
        );

        try {
          thumb.currentTime = t;
        } catch (_) {}
      };

      if (thumb.readyState >= 1) {
        showFirstFrame();
      } else {
        thumb.addEventListener(
          "loadedmetadata",
          showFirstFrame,
          { once: true }
        );
      }

      thumb.addEventListener(
        "seeked",
        () => {
          thumb.pause();
        },
        { once: true }
      );
    });

    // =========================================================
    // 2. 每一组 demo 独立控制
    // =========================================================
    document.querySelectorAll("[data-demo-group]").forEach((group) => {
      const mainVideo = group.querySelector(".exp-main-video");
      const speedSelect = group.querySelector(".exp-speed-select");
      const cards = Array.from(
        group.querySelectorAll(".exp-config-card")
      );

      if (!mainVideo || cards.length === 0) return;

      // 主播放器属性
      mainVideo.muted = true;
      mainVideo.loop = true;
      mainVideo.playsInline = true;

      // =======================================================
      // 播放速度
      // =======================================================
      function getSpeed() {
        const value = Number(
          speedSelect ? speedSelect.value : 1
        );

        return Number.isFinite(value) && value > 0
          ? value
          : 1;
      }

      function applySpeed() {
        const speed = getSpeed();

        mainVideo.playbackRate = speed;
        mainVideo.defaultPlaybackRate = speed;
      }

      function safePlay() {
        applySpeed();

        const playPromise = mainVideo.play();

        if (
          playPromise &&
          typeof playPromise.catch === "function"
        ) {
          playPromise.catch(() => {});
        }
      }

      // =======================================================
      // 切换 Config
      // =======================================================
      function switchTo(card) {
        const src = card.dataset.src;

        if (!src) return;

        // 更新 active 样式
        cards.forEach((item) => {
          const isActive = item === card;

          item.classList.toggle(
            "is-active",
            isActive
          );

          item.setAttribute(
            "aria-pressed",
            isActive ? "true" : "false"
          );
        });

        // 当前主视频地址
        const currentSrc =
          mainVideo.currentSrc || mainVideo.src;

        // 点击目标视频的绝对路径
        const targetSrc =
          new URL(src, window.location.href).href;

        // 如果不是当前视频，就切换
        if (currentSrc !== targetSrc) {
          mainVideo.pause();

          // 清除旧 src
          mainVideo.removeAttribute("src");

          // 删除旧 <source>
          mainVideo
            .querySelectorAll("source")
            .forEach((source) => {
              source.remove();
            });

          // 直接给 video 设置新 src
          mainVideo.src = src;

          // 重新加载
          mainVideo.load();

          // 可以播放后自动播放
          mainVideo.addEventListener(
            "canplay",
            () => {
              applySpeed();
              safePlay();
            },
            { once: true }
          );
        } else {
          // 如果点击的就是当前 config
          // 从头重新播放
          mainVideo.currentTime = 0;
          safePlay();
        }
      }

      // =======================================================
      // 给每个 Config 按钮绑定点击事件
      // =======================================================
      cards.forEach((card) => {
        card.addEventListener(
          "click",
          (event) => {
            event.preventDefault();
            event.stopPropagation();

            switchTo(card);
          }
        );
      });

      // =======================================================
      // 倍速选择
      // =======================================================
      if (speedSelect) {
        speedSelect.addEventListener(
          "change",
          () => {
            applySpeed();
          }
        );
      }

      mainVideo.addEventListener(
        "loadedmetadata",
        () => {
          applySpeed();
        }
      );

      mainVideo.addEventListener(
        "play",
        () => {
          applySpeed();
        }
      );

      // 默认自动播放 Config 1
      applySpeed();
      safePlay();
    });
  }

  // =========================================================
  // 等 HTML 加载完成后再绑定
  // =========================================================
  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initExperimentalDemos,
      { once: true }
    );
  } else {
    initExperimentalDemos();
  }
})();