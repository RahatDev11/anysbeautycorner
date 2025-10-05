// =================================================================
// SECTION: UI & HELPER FUNCTIONS
// =================================================================

function showToast(message, type = "success") {
    const toast = document.createElement("div");
    const icon = type === "success" ? "fas fa-check-circle" : "fas fa-exclamation-circle";
    const color = type === "success" ? "bg-green-500" : "bg-red-500";
    toast.className = `fixed bottom-24 right-4 ${color} text-white px-4 py-3 rounded-lg shadow-lg flex items-center z-50`;
    toast.innerHTML = `<i class="${icon} mr-2"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => { toast.remove() }, 3000);
};

function hideSocialMediaIcons() {
    document.getElementById('socialIcons')?.classList.add('hidden');
}

function hideGlobalLoadingSpinner() {
    const spinner = document.getElementById('global-loading-spinner');
    if (spinner) {
        spinner.classList.add('hidden');
    }
}

function openSidebar() {
    hideSocialMediaIcons();
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebar = document.getElementById('sidebar');
    if (sidebarOverlay) sidebarOverlay.classList.remove('hidden');
    if (sidebar) sidebar.classList.remove('-translate-x-full');
}

function closeSidebar() {
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebar = document.getElementById('sidebar');
    if (sidebarOverlay) sidebarOverlay.classList.add('hidden');
    if (sidebar) sidebar.classList.add('-translate-x-full');
}
function toggleSubMenuMobile(event) {
    event.stopPropagation();
    document.getElementById('subMenuMobile')?.classList.toggle('hidden');
    document.getElementById('arrowIcon')?.classList.toggle('rotate-180');
};

function handleSubMenuItemClick(category) {
    if (window.location.pathname.endsWith('/') || window.location.pathname.endsWith('index.html')) {
        window.filterProducts(category);
    } else {
        window.location.href = `index.html?filter=${category}`;
    }
    closeSidebar();
};
function toggleSubMenuDesktop() {
    hideSocialMediaIcons();
    document.getElementById('desktopSubMenuBar')?.classList.toggle('hidden');
    document.getElementById('desktopArrowIcon')?.classList.toggle('rotate-180');
};

function getScrollbarWidth() {
    const outer = document.createElement('div');
    outer.style.visibility = 'hidden';
    outer.style.overflow = 'scroll';
    document.body.appendChild(outer);
    const inner = document.createElement('div');
    outer.appendChild(inner);
    const scrollbarWidth = (outer.offsetWidth - inner.offsetWidth);
    outer.parentNode.removeChild(outer);
    return scrollbarWidth;
}

function openCartSidebar() {
    const scrollbarWidth = getScrollbarWidth();
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    document.body.classList.add('overflow-hidden');

    document.getElementById('cartSidebar').classList.remove('translate-x-full');
    // Hide social media button if it exists on the page
    const socialMediaButton = document.getElementById('socialShareButton');
    if (socialMediaButton) {
        socialMediaButton.classList.add('hidden');
    }
}
function closeCartSidebar() {
    document.body.style.paddingRight = '';
    document.body.classList.remove('overflow-hidden');

    document.getElementById('cartSidebar').classList.add('translate-x-full');
    // Show social media button if it exists on the page
    const socialMediaButton = document.getElementById('socialShareButton');
    if (socialMediaButton) {
        socialMediaButton.classList.remove('hidden');
    }
}

function focusMobileSearch() {
    document.getElementById('mobileSearchBar')?.classList.toggle('hidden');
    document.getElementById('searchInput')?.focus();
};

function setupSocialMediaButtons() {
    const shareButton = document.getElementById('socialShareButton');
    const socialIcons = document.getElementById('socialIcons');
    if (!shareButton || !socialIcons) return;

    shareButton.addEventListener('click', (event) => {
        event.stopPropagation();
        socialIcons.classList.toggle('hidden');
        // Ensure it's shown if it was hidden by another event
        if (!socialIcons.classList.contains('hidden')) {
            socialIcons.classList.remove('hidden');
        }
    });

    // Hide if clicked outside
    document.addEventListener('click', (event) => {
        if (!socialIcons.contains(event.target) && !shareButton.contains(event.target)) {
            socialIcons.classList.add('hidden');
        }
    });
}

export {
    showToast,
    hideSocialMediaIcons,
    hideGlobalLoadingSpinner,
    openSidebar,
    closeSidebar,
    toggleSubMenuMobile,
    handleSubMenuItemClick,
    toggleSubMenuDesktop,
    openCartSidebar,
    closeCartSidebar,
    focusMobileSearch,
    setupSocialMediaButtons
};