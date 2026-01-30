const APP_VERSION = '9.7';
window.APP_VERSION = APP_VERSION;

document.addEventListener("DOMContentLoaded", function () {
    // Load Header/Footer CSS if not linked
    if (!document.querySelector('link[href*="header-footer.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'css/header-footer.css';
        document.head.appendChild(link);
    }

    loadHeader();
    loadFooter();

    // Update version on specialized spans that might already exist in static HTML
    updateVersionInfo();
});

function loadHeader() {
    if (document.querySelector('header.global-header')) return;

    const container = document.querySelector('.app-container') || document.body;

    fetch("components/header.html")
        .then(response => response.text())
        .then(data => {
            const div = document.createElement('div');
            div.innerHTML = data;
            const header = div.firstElementChild;
            header.classList.add('global-header');

            // Insert at top of container
            container.insertBefore(header, container.firstChild);
        })
        .catch(err => console.error("Error loading header:", err));
}

function loadFooter() {
    // Check if we already have a global footer
    if (document.querySelector('footer.global-footer')) return;

    fetch("components/footer.html")
        .then(response => response.text())
        .then(data => {
            const container = document.querySelector('.app-container') || document.body;

            const div = document.createElement('div');
            div.innerHTML = data;
            const footer = div.firstElementChild;
            footer.classList.add('global-footer');

            container.appendChild(footer);

            updateVersionInfo();
        })
        .catch(err => console.error("Error loading footer:", err));
}

function updateVersionInfo() {
    // Run periodically or once with delay to catch loaded elements
    const update = () => {
        const ids = ['versionInfo', 'flohmarktVersionInfo', 'rpVersionInfo'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                // Avoid duplicating if already set
                if (!el.textContent.includes(APP_VERSION)) {
                    el.textContent = ' | Version ' + APP_VERSION;
                }
            }
        });

        // Also update local storage if needed matching index.html logic
        if (localStorage.getItem('appVersion') !== APP_VERSION) {
            localStorage.setItem('appVersion', APP_VERSION);
            // Optionally force reload logic here if needed
        }
    };

    setTimeout(update, 100);
    setTimeout(update, 1000); // Retry later for slow loads
}

// Fallback goHome
if (typeof window.goHome !== 'function') {
    window.goHome = function () {
        window.location.href = 'index.html';
    };
}

// Helper to keep footer at the bottom even when DOM changes
function keepFooterAtBottom() {
    const footer = document.querySelector('.global-footer');
    const container = document.querySelector('.app-container') || document.body;

    if (footer && container) {
        // If footer is not the last child, move it to the end
        if (container.lastElementChild !== footer) {
            container.appendChild(footer);
        }
    }
}

// Run this check periodically / on clicks
setInterval(keepFooterAtBottom, 1000);
document.addEventListener('click', () => setTimeout(keepFooterAtBottom, 50));
