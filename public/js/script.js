
document.addEventListener('DOMContentLoaded', () => {
    
    
    const timerElement = document.getElementById('countdown');
    if (timerElement) {
        
        let totalSeconds = 144 * 60 + 22;

        function updateTimer() {
            if (totalSeconds <= 0) return;
            
            totalSeconds--;
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            
            
            if (hours > 0) {
                timerElement.textContent = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            } else {
                timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }
        
        setInterval(updateTimer, 1000);
    }


    
    const qItems = document.querySelectorAll('.question-list:not(.locked) .q-item');
    qItems.forEach(item => {
        item.addEventListener('click', function() {
            
            qItems.forEach(q => {
                q.classList.remove('active');
                
                const iconContainer = q.querySelector('div:first-child');
                if (q.classList.contains('completed')) {
                    iconContainer.className = 'status-icon success';
                    iconContainer.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                } else {
                    iconContainer.className = 'status-icon empty';
                    iconContainer.innerHTML = '';
                }
            });
            
            
            this.classList.add('active');
            const iconContainer = this.querySelector('div:first-child');
            iconContainer.className = 'active-indicator';
            iconContainer.innerHTML = '';
        });
    });


    
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            
            btn.classList.add('active');
            const targetId = `tab-${btn.getAttribute('data-tab')}`;
            document.getElementById(targetId).classList.add('active');
        });
    });


    
    const codeEditor = document.getElementById('code-editor');
    const lineNumbers = document.getElementById('line-numbers');
    const charCount = document.getElementById('char-count');
    const submitBtn = document.getElementById('submit-code');
    
    const initialCode = codeEditor.value;

    function updateEditorStats() {
        
        const lines = codeEditor.value.split('\n').length;
        lineNumbers.innerHTML = Array(lines).fill(0).map((_, i) => i + 1).join('<br>');
        
        
        const chars = codeEditor.value.length;
        charCount.textContent = chars;
        
        
        if (codeEditor.value.trim() !== '' && codeEditor.value !== initialCode) {
            submitBtn.disabled = false;
        } else {
            submitBtn.disabled = true;
        }
    }

    
    codeEditor.addEventListener('scroll', () => {
        lineNumbers.scrollTop = codeEditor.scrollTop;
    });

    
    codeEditor.addEventListener('input', updateEditorStats);
    
    
    updateEditorStats();


    
    
    
    const resetBtn = document.getElementById('reset-code');
    resetBtn.addEventListener('click', () => {
        if(confirm('Are you sure you want to reset your code to the default state?')) {
            codeEditor.value = initialCode;
            updateEditorStats();
        }
    });

    
    const runBtn = document.getElementById('run-tests');
    runBtn.addEventListener('click', () => {
        const originalText = runBtn.innerHTML;
        runBtn.classList.add('loading');
        runBtn.innerHTML = '<svg class="icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg><span class="btn-text-inner">Running...</span>';
        
        
        setTimeout(() => {
            runBtn.classList.remove('loading');
            runBtn.innerHTML = originalText;
            
            
            const resultsTabBtn = document.querySelector('[data-tab="results"]');
            resultsTabBtn.click();
            
            
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

    
    codeEditor.addEventListener('keydown', (e) => {
        
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = codeEditor.selectionStart;
            const end = codeEditor.selectionEnd;
            codeEditor.value = codeEditor.value.substring(0, start) + '    ' + codeEditor.value.substring(end);
            codeEditor.selectionStart = codeEditor.selectionEnd = start + 4;
            updateEditorStats();
        }
        
        
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            runBtn.click();
        }
    });

    
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

    
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers.length > 0) {
        const statsObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const target = parseInt(el.getAttribute('data-target'));
                    let count = 0;
                    const duration = 2000; 
                    const increment = target / (duration / 16); 
                    
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
