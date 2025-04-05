document.addEventListener("DOMContentLoaded", function () {
    const translateButtons = document.querySelectorAll(".translate-btn");

    function getCurrentPath() {
        return window.location.pathname; // "/about-cards/xpwhy.html" gibi
    }

    function loadTranslations(lang) {
        fetch("/data/translate.json")
            .then(response => response.json())
            .then(data => {
                const currentPath = getCurrentPath();
                if (!data[currentPath] || !data[currentPath][lang]) return;

                // Sayfadaki çevirileri güncelle
                document.querySelectorAll(".translate").forEach(el => {
                    const key = el.getAttribute("data-key");
                    if (data[currentPath][lang][key]) {
                        el.textContent = data[currentPath][lang][key];
                    }
                });
            })
            .catch(error => console.error("Çeviri dosyası yüklenemedi:", error));
    }

    // Sayfa yüklendiğinde LocalStorage'dan dili al
    const savedLang = localStorage.getItem("selectedLanguage") || "tr";
    loadTranslations(savedLang);

    // Dil değiştirme butonları
    translateButtons.forEach(button => {
        button.addEventListener("click", function () {
            const selectedLang = this.getAttribute("data-lang");
            localStorage.setItem("selectedLanguage", selectedLang);
            loadTranslations(selectedLang);
        });
    });
});