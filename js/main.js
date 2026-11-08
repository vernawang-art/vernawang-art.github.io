(function () {
  'use strict';

  /* ---------- 漢堡選單（手機） ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');

  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? '關閉選單' : '開啟選單');
    nav.classList.toggle('is-open', open);
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setMenu(false);
        toggle.focus();
      }
    });

    document.addEventListener('click', function (e) {
      if (nav.classList.contains('is-open') && !e.target.closest('.site-header')) {
        setMenu(false);
      }
    });

    // 轉到平板／桌機寬度時收起選單
    window.matchMedia('(min-width: 800px)').addEventListener('change', function (e) {
      if (e.matches) setMenu(false);
    });
  }

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 核心挑戰：逐行揭示（GSAP） ---------- */
  // 編號依序從遮罩下方帶點旋轉翻上來，接著細線由左往右畫出。
  // GSAP 沒載入或偏好減少動態時，編號與細線直接以完成狀態顯示。
  var challenges = document.querySelector('.challenges');

  if (challenges && window.gsap && !reduceMotion && 'IntersectionObserver' in window) {
    var nums = challenges.querySelectorAll('.challenge__num-inner');
    var rules = challenges.querySelectorAll('.challenge__rule');

    gsap.set(nums, { yPercent: 115, rotation: 8 });
    gsap.set(rules, { scaleX: 0 });

    var lineReveal = gsap.timeline({ paused: true })
      .to(nums, { yPercent: 0, rotation: 0, duration: 0.9, ease: 'power3.out', stagger: 0.14 })
      .to(rules, { scaleX: 1, duration: 0.8, ease: 'power2.inOut', stagger: 0.14 }, '-=0.5');

    var challengeObserver = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        lineReveal.play();
        challengeObserver.disconnect();
      }
    }, { rootMargin: '0px 0px -15% 0px' });

    challengeObserver.observe(challenges);
  }

  /* ---------- 柔邊遮罩揭示（GSAP） ---------- */
  // 羽化漸層遮罩由左往右掃過（--p：-25% → 100%），同時圖片從 1.08 倍、偏左 8px 縮回原位。
  // 遮罩一開始由 CSS 套上；播完、GSAP 沒載入或偏好減少動態時加 .is-revealed 拿掉。
  // data-reveal-delay：首屏主視覺等標題先出現再揭開（秒）。
  var softReveals = document.querySelectorAll('.soft-reveal');
  var revealNow = function (frame) { frame.classList.add('is-revealed'); };

  if (softReveals.length && window.gsap && !reduceMotion && 'IntersectionObserver' in window) {
    var softObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var frame = entry.target;
        softObserver.unobserve(frame);

        gsap.timeline({
          delay: parseFloat(frame.getAttribute('data-reveal-delay')) || 0,
          defaults: { duration: 2.1, ease: 'power2.out' },
          onComplete: function () { revealNow(frame); }
        })
          .to(frame, { '--p': '100%' }, 0)
          .to(frame.querySelector('.soft-reveal__media'), { scale: 1, x: 0 }, 0);
      });
    }, { rootMargin: '0px 0px -15% 0px' });

    softReveals.forEach(function (frame) {
      gsap.set(frame, { '--p': '-25%' });
      gsap.set(frame.querySelector('.soft-reveal__media'), { scale: 1.08, x: -8 });
      softObserver.observe(frame);
    });
  } else {
    Array.prototype.forEach.call(softReveals, revealNow);
  }

  /* ---------- 案例卡片：骨架載入 ---------- */
  // 卡片先顯示骨架；捲到卡片後等圖片載好（至少顯示 0.9 秒、最多等 3 秒），
  // 再切換成 .is-loaded：骨架淡出、內容淡入上滑。偏好減少動態時直接顯示內容。
  var caseCards = document.querySelectorAll('.case');

  if (caseCards.length && !reduceMotion && 'IntersectionObserver' in window && window.Promise) {
    var wait = function (ms) {
      return new Promise(function (resolve) { setTimeout(resolve, ms); });
    };

    var caseObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var card = entry.target;
        var img = card.querySelector('.case__image');
        caseObserver.unobserve(card);

        var imageReady = img && img.decode
          ? img.decode().catch(function () {})
          : Promise.resolve();

        Promise.race([Promise.all([imageReady, wait(900)]), wait(3000)]).then(function () {
          card.classList.remove('is-loading');
          card.classList.add('is-loaded');
        });
      });
    }, { rootMargin: '0px 0px -10% 0px' });

    caseCards.forEach(function (card) {
      card.classList.add('is-loading');
      caseObserver.observe(card);
    });
  }

  /* ---------- 捲動淡入 ---------- */
  var items = document.querySelectorAll('.reveal');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  // 底部只內縮 24px，頁尾最後一個按鈕捲到底時才能觸發
  }, { rootMargin: '0px 0px -24px 0px', threshold: 0 });

  items.forEach(function (el) { observer.observe(el); });
})();
