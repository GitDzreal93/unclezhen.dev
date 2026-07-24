(function () {
  var toggle = document.querySelector("[data-nav-toggle]");
  var drawer = document.querySelector("[data-nav-drawer]");
  if (toggle && drawer) {
    function closeDrawer() {
      drawer.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      toggle.focus();
    }
    function openDrawer() {
      drawer.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      var first = drawer.querySelector("a,button");
      if (first) first.focus();
    }
    toggle.addEventListener("click", function () {
      if (drawer.classList.contains("is-open")) closeDrawer();
      else openDrawer();
    });
    drawer.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        drawer.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && drawer.classList.contains("is-open")) {
        closeDrawer();
      }
    });
  }

  window.ZhenShu = window.ZhenShu || {};
  window.ZhenShu.toast = function (msg) {
    var el = document.querySelector("[data-toast]");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      el.setAttribute("data-toast", "");
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("is-show");
    clearTimeout(el._t);
    el._t = setTimeout(function () {
      el.classList.remove("is-show");
    }, 2400);
  };

  window.ZhenShu.openModal = function (id) {
    var m = document.getElementById(id);
    if (m) {
      m.classList.add("is-open");
      m.setAttribute("aria-hidden", "false");
      var focusable = m.querySelector("input,button,textarea,[href]");
      if (focusable) focusable.focus();
    }
  };

  window.ZhenShu.closeModal = function (id) {
    var m = document.getElementById(id);
    if (m) {
      m.classList.remove("is-open");
      m.setAttribute("aria-hidden", "true");
    }
  };

  document.querySelectorAll("[data-close-modal]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var id = btn.getAttribute("data-close-modal");
      window.ZhenShu.closeModal(id);
    });
  });

  document.querySelectorAll(".modal-backdrop").forEach(function (bd) {
    bd.addEventListener("click", function (e) {
      if (e.target === bd) {
        bd.classList.remove("is-open");
        bd.setAttribute("aria-hidden", "true");
      }
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal-backdrop.is-open").forEach(function (m) {
        m.classList.remove("is-open");
        m.setAttribute("aria-hidden", "true");
      });
    }
  });
})();
