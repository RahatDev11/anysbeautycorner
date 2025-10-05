import { showToast } from './ui-utilities.js';

export function initializeNewsletter() {
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        const emailInput = newsletterForm.querySelector('#newsletterEmail');
        const submitBtn = newsletterForm.querySelector('button[type="submit"]');
        const messageDiv = document.getElementById('newsletterMessage');
        const buttonText = submitBtn ? submitBtn.querySelector('.button-text') : null;

        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = emailInput.value.trim();
            if (email && /\S+@\S+\.\S+/.test(email)) {
                if (submitBtn) submitBtn.disabled = true;
                if (buttonText) buttonText.classList.add('hidden');
                if (messageDiv) messageDiv.textContent = '';

                setTimeout(() => {
                    const isSuccess = Math.random() > 0.2; // Simulate success/failure
                    if (messageDiv) {
                        messageDiv.textContent = isSuccess ? 'ধন্যবাদ! সাবস্ক্রিপশন সফল হয়েছে।' : 'সাবস্ক্রাইব করতে সমস্যা হয়েছে।';
                        messageDiv.className = `text-xs mt-2 h-4 ${isSuccess ? 'text-green-400' : 'text-red-400'}`;
                    }
                    if (isSuccess) newsletterForm.reset();
                    if (submitBtn) submitBtn.disabled = false;
                    if (buttonText) buttonText.classList.remove('hidden');
                    setTimeout(() => { if (messageDiv) messageDiv.textContent = ''; }, 5000);
                }, 1200);
            } else {
                if (messageDiv) {
                    messageDiv.textContent = 'সঠিক ইমেইল ঠিকানা দিন।';
                    messageDiv.className = 'text-xs mt-2 h-4 text-red-400';
                }
                setTimeout(() => { if (messageDiv) messageDiv.textContent = ''; }, 3000);
            }
        });
    }
}
