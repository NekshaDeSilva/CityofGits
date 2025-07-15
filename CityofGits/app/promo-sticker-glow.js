// Rotates the promo sticker glow for 2 seconds every 2 minutes
(function(){
    const promoSticker = document.getElementById('promo-sticker');
    if (!promoSticker) return;
    let glowActive = false;
    function activateGlow() {
        promoSticker.classList.add('active-glow');
        glowActive = true;
        setTimeout(() => {
            promoSticker.classList.remove('active-glow');
            glowActive = false;
        }, 2000); // 2 seconds
    }
    // Initial delay before first glow
    setTimeout(function glowLoop() {
        activateGlow();
        setTimeout(glowLoop, 120000); // 2 minutes
    }, 120000);
})();
