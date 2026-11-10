/* Hamburger menu behavior for pages whose header has a .nav-toggle but no menu script
   (the service pages). The homepage has its own handler and does not load this file. */
(function () {
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (!toggle || !links || document.body.dataset.navBound) return;
  document.body.dataset.navBound = '1';
  function setOpen(open) {
    document.body.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  toggle.addEventListener('click', function () { setOpen(!document.body.classList.contains('nav-open')); });
  links.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
})();
