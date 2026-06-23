// script.js
document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Timer Countdown ---
    const timerElement = document.getElementById('countdown');
    if (timerElement) {
        // Start from 144:22
        let totalSeconds = 144 * 60 + 22;

        function updateTimer() {
            if (totalSeconds <= 0) return;
            
            totalSeconds--;
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            
            // Format depending on if hours > 0
            if (hours > 0) {
                timerElement.textContent = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            } else {
                timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }
        
        setInterval(updateTimer, 1000);
    }


    // --- 2. Sidebar Highlighting ---
    const qItems = document.querySelectorAll('.question-list:not(.locked) .q-item');
    qItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all
            qItems.forEach(q => {
                q.classList.remove('active');
                // Manage the indicator icon
                const iconContainer = q.querySelector('div:first-child');
                if (q.classList.contains('completed')) {
                    iconContainer.className = 'status-icon success';
                    iconContainer.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                } else {
                    iconContainer.className = 'status-icon empty';
                    iconContainer.innerHTML = '';
                }
            });
            
            // Add active class to clicked
            this.classList.add('active');
            const iconContainer = this.querySelector('div:first-child');
            iconContainer.className = 'active-indicator';
            iconContainer.innerHTML = '';
        });
    });


    // --- 3. Center Panel Tabs ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from all tabs
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active to clicked
            btn.classList.add('active');
            const targetId = `tab-${btn.getAttribute('data-tab')}`;
            document.getElementById(targetId).classList.add('active');
        });
    });


    // --- 4. Code Editor Line Numbers & Character Count ---
    const codeEditor = document.getElementById('code-editor');
    const lineNumbers = document.getElementById('line-numbers');
    const charCount = document.getElementById('char-count');
    const submitBtn = document.getElementById('submit-code');
    
    const initialCode = codeEditor.value;

    function updateEditorStats() {
        // Line numbers
        const lines = codeEditor.value.split('\n').length;
        lineNumbers.innerHTML = Array(lines).fill(0).map((_, i) => i + 1).join('<br>');
        
        // Character count
        const chars = codeEditor.value.length;
        charCount.textContent = chars;
        
        // Enable submit if code changed and not empty
        if (codeEditor.value.trim() !== '' && codeEditor.value !== initialCode) {
            submitBtn.disabled = false;
        } else {
            submitBtn.disabled = true;
        }
    }

    // Sync scroll between textarea and line numbers
    codeEditor.addEventListener('scroll', () => {
        lineNumbers.scrollTop = codeEditor.scrollTop;
    });

    // Update on input
    codeEditor.addEventListener('input', updateEditorStats);
    
    // Initialize stats
    updateEditorStats();


    // --- 5. Action Buttons ---
    
    // Reset Code
    const resetBtn = document.getElementById('reset-code');
    resetBtn.addEventListener('click', () => {
        if(confirm('Are you sure you want to reset your code to the default state?')) {
            codeEditor.value = initialCode;
            updateEditorStats();
        }
    });

    // Run Tests
    const runBtn = document.getElementById('run-tests');
    runBtn.addEventListener('click', () => {
        const originalText = runBtn.innerHTML;
        runBtn.classList.add('loading');
        runBtn.innerHTML = '<svg class="icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg><span class="btn-text-inner">Running...</span>';
        
        // Simulate loading
        setTimeout(() => {
            runBtn.classList.remove('loading');
            runBtn.innerHTML = originalText;
            
            // Switch to Results tab
            const resultsTabBtn = document.querySelector('[data-tab="results"]');
            resultsTabBtn.click();
            
            // Show fake success result
            const resultsContent = document.getElementById('tab-results');
            resultsContent.innerHTML = `
                <div style="padding: 20px; color: var(--accent-green);">
                    <h3 style="margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        Accepted
                    </h3>
                    <p style="color: var(--text-muted); font-size: 13px;">Runtime: 2 ms, faster than 85.34% of Java online submissions.</p>
                </div>
            `;
        }, 1500);
    });

    // Keyboard shortcut (Ctrl + Enter to run)
    codeEditor.addEventListener('keydown', (e) => {
        // Tab support for textarea
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = codeEditor.selectionStart;
            const end = codeEditor.selectionEnd;
            codeEditor.value = codeEditor.value.substring(0, start) + '    ' + codeEditor.value.substring(end);
            codeEditor.selectionStart = codeEditor.selectionEnd = start + 4;
            updateEditorStats();
        }
        
        // Ctrl+Enter to run tests
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            runBtn.click();
        }
    });

    // --- 6. Scroll Reveal Logic (Landing Page) ---
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

    // --- 7. Stat Number Counter Animation (Landing Page) ---
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
