// =================================================================
// SECTION: FOOTER MANAGEMENT
// =================================================================

function toggleFooterMenu(event) {
    const header = event.currentTarget;
    const ul = header.nextElementSibling;
    const icon = header.querySelector('.fas');

    if (ul && icon) {
        ul.classList.toggle('hidden');
        icon.classList.toggle('rotate-180');
    }
}

export { toggleFooterMenu };