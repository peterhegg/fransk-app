(function () {
  try {
    var saved = localStorage.getItem('theme');
    var dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', saved || (dark ? 'dark' : 'light'));
  } catch (e) {}
})();
