// =================================================================
// SECTION: UI & DISPLAY LOGIC (HOME PAGE)
// =================================================================

import { database, ref, onValue } from '../modules/firebase-config.js';
import { loadProducts, displayProductsAsCards, initializeProductSlider, filterProducts, showLoadingSpinner } from '../modules/product-manager.js';

let eventSlider;

async function displayEvents() {
    return new Promise(resolve => {
        const wrapper = document.getElementById('event-slider-wrapper');
        if (!wrapper) {
            resolve();
            return;
        }
        onValue(ref(database, 'events'), (snapshot) => {
            const activeEvents = [];
            if (snapshot.exists()) {
                snapshot.forEach(child => { if (child.val().isActive) activeEvents.push(child.val()); });
            }
            wrapper.innerHTML = activeEvents.length > 0
                ? activeEvents.slice(0, 3).map(event => event.imageUrl
                    ? `<div class="swiper-slide rounded-lg shadow-lg bg-cover bg-center" style="height: 160px; background-image: url(${event.imageUrl});"><div class="w-full h-full bg-black bg-opacity-50 rounded-lg p-6 flex flex-col justify-center items-center text-center text-white"><h3 class="text-xl font-bold">${event.title || ''}</h3><p class="mt-1">${event.description || ''}</p></div></div>`
                    : `<div class="swiper-slide bg-white p-6 flex flex-col justify-center items-center text-center rounded-lg shadow-lg" style="height: 160px;"><h3 class="text-xl font-bold text-lipstick-dark">${event.title || ''}</h3><p class="text-gray-600 mt-1">${event.description || ''}</p></div>`
                ).join('')
                : '<div class="swiper-slide text-center p-6 bg-white rounded-lg">কোনো নতুন ইভেন্ট নেই।</div>';

            if (typeof Swiper !== 'undefined') {
                if (eventSlider) eventSlider.destroy(true, true);
                eventSlider = new Swiper('.event-slider', { loop: activeEvents.length > 1, autoplay: { delay: 3500 }, pagination: { el: '.swiper-pagination', clickable: true } });
            }
            resolve(); // Resolve the promise after events are displayed
        }, { onlyOnce: true }); // Listen only once
    });
}

async function initHomePage(products) {
    showLoadingSpinner(); // This is for productList spinner, not global
    const urlParams = new URLSearchParams(window.location.search);
    const filterCategory = urlParams.get('filter');
    if (filterCategory) {
        filterProducts(filterCategory);
    } else {
        displayProductsAsCards(products);
    }
    const sliderProducts = products.filter(p => p.isInSlider).sort((a, b) => (a.sliderOrder || 99) - (b.sliderOrder || 99));
    initializeProductSlider(sliderProducts);
    await displayEvents();
}

export {
    initHomePage,
    displayEvents // Export if needed elsewhere, otherwise can be internal
};