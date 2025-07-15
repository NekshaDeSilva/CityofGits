// Landscape orientation overlay logic for mobile devices
(function(){
  const overlay = document.getElementById('landscape-overlay');
  function checkOrientation() {
    const isMobile = window.matchMedia('(max-width: 900px)').matches;
    const isPortrait = window.matchMedia('(orientation: portrait)').matches;
    if (isMobile && isPortrait) {
      overlay.style.display = 'flex';
      overlay.style.opacity = '0.98';
      document.body.style.overflow = 'hidden';
    } else {
      overlay.style.display = 'none';
      overlay.style.opacity = '0';
      document.body.style.overflow = '';
    }
  }
  window.addEventListener('orientationchange', checkOrientation);
  window.addEventListener('resize', checkOrientation);
  document.addEventListener('DOMContentLoaded', checkOrientation);
  checkOrientation();
})();
