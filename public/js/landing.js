document.addEventListener('DOMContentLoaded', () => {

    // --- Scroll Reveal Logic ---
    const revealElements = document.querySelectorAll('.reveal');
    if (revealElements.length > 0) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, { threshold: 0.1 });

        revealElements.forEach(el => revealObserver.observe(el));
    }

    // --- Stat Number Counter Animation ---
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers.length > 0) {
        const statsObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const target = parseInt(el.getAttribute('data-target'));
                    let count = 0;
                    const duration = 2000; // 2 seconds
                    const increment = target / (duration / 16); // ~60fps
                    
                    const updateCount = () => {
                        count += increment;
                        if (count < target) {
                            el.innerText = Math.ceil(count);
                            requestAnimationFrame(updateCount);
                        } else {
                            el.innerText = target;
                        }
                    };
                    updateCount();
                    observer.unobserve(el);
                }
            });
        }, { threshold: 0.5 });

        statNumbers.forEach(stat => statsObserver.observe(stat));
    }

});
