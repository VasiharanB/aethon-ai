document.addEventListener('DOMContentLoaded', () => {

    
    const canvas = document.getElementById('bg-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        window.addEventListener('resize', () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        });

        const particles = [];
        const auroraOrbs = [];
        
        const mouse = { x: null, y: null, radius: 220 };

        window.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
            
            document.body.style.setProperty('--mouse-x', `${e.clientX}px`);
            document.body.style.setProperty('--mouse-y', `${e.clientY}px`);
        });

        window.addEventListener('mouseleave', () => {
            mouse.x = null;
            mouse.y = null;
        });

        
        class AuroraOrb {
            constructor(color1, color2, radius) {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.12; 
                this.vy = (Math.random() - 0.5) * 0.12;
                this.radius = radius;
                this.color1 = color1;
                this.color2 = color2;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                
                if (this.x < -this.radius) this.x = width + this.radius;
                if (this.x > width + this.radius) this.x = -this.radius;
                if (this.y < -this.radius) this.y = height + this.radius;
                if (this.y > height + this.radius) this.y = -this.radius;
            }

            draw() {
                const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
                grad.addColorStop(0, this.color1);
                grad.addColorStop(1, this.color2);
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = grad;
                ctx.fill();
            }
        }

        
        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.4;
                this.vy = (Math.random() - 0.5) * 0.4;
                this.radius = Math.random() * 2.2 + 1.2;
                this.color = Math.random() > 0.5 ? 'rgba(96, 165, 250, 0.45)' : 'rgba(168, 85, 247, 0.45)'; 
                this.mouseScale = 1;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                
                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;

                
                if (mouse.x !== null && mouse.y !== null) {
                    const dx = mouse.x - this.x;
                    const dy = mouse.y - this.y;
                    const distance = Math.hypot(dx, dy);
                    if (distance < mouse.radius) {
                        const force = (mouse.radius - distance) / mouse.radius;
                        
                        this.x += (dx / distance) * force * 1.1;
                        this.y += (dy / distance) * force * 1.1;
                        this.mouseScale = 1 + force * 1.6; 
                    } else {
                        this.mouseScale = 1;
                    }
                } else {
                    this.mouseScale = 1;
                }
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius * this.mouseScale, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                
                
                if (this.mouseScale > 1.3) {
                    ctx.save();
                    ctx.shadowBlur = 8;
                    ctx.shadowColor = 'rgba(96, 165, 250, 0.8)';
                    ctx.fill();
                    ctx.restore();
                } else {
                    ctx.fill();
                }
            }
        }

        
        auroraOrbs.push(new AuroraOrb('rgba(124, 58, 237, 0.15)', 'rgba(124, 58, 237, 0)', 380)); 
        auroraOrbs.push(new AuroraOrb('rgba(6, 182, 212, 0.12)', 'rgba(6, 182, 212, 0)', 420));   
        auroraOrbs.push(new AuroraOrb('rgba(219, 39, 119, 0.1)', 'rgba(219, 39, 119, 0)', 350));  
        auroraOrbs.push(new AuroraOrb('rgba(59, 130, 246, 0.08)', 'rgba(59, 130, 246, 0)', 480));  

        
        const particleCount = Math.min(75, Math.floor((width * height) / 25000));
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }

        function animate() {
            ctx.clearRect(0, 0, width, height);

            
            for (let i = 0; i < auroraOrbs.length; i++) {
                auroraOrbs[i].update();
                auroraOrbs[i].draw();
            }

            
            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();
            }

            
            ctx.lineWidth = 0.5;
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.hypot(dx, dy);
                    if (dist < 140) {
                        
                        let mouseGlow = 0;
                        if (mouse.x !== null && mouse.y !== null) {
                            const midX = (particles[i].x + particles[j].x) / 2;
                            const midY = (particles[i].y + particles[j].y) / 2;
                            const mDist = Math.hypot(mouse.x - midX, mouse.y - midY);
                            if (mDist < 180) {
                                mouseGlow = ((180 - mDist) / 180) * 0.18;
                            }
                        }
                        const alpha = ((140 - dist) / 140) * 0.14 + mouseGlow;
                        ctx.strokeStyle = `rgba(168, 85, 247, ${alpha})`;
                        ctx.lineWidth = alpha * 2.2;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }

            requestAnimationFrame(animate);
        }

        animate();
    }

    
    const revealElements = document.querySelectorAll('.reveal');
    if (revealElements.length > 0) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, { threshold: 0.12 });

        revealElements.forEach(el => revealObserver.observe(el));
    }

    
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers.length > 0) {
        const statsObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const targetAttr = el.getAttribute('data-target');
                    const numMatch = targetAttr.match(/[\d.]+/);
                    const target = numMatch ? parseFloat(numMatch[0]) : 0;
                    const suffix = targetAttr.replace(/[\d.]+/g, ''); 
                    
                    let count = 0;
                    const duration = 2000; 
                    const startTime = performance.now();
                    
                    const animateCount = (timestamp) => {
                        const progress = Math.min((timestamp - startTime) / duration, 1);
                        const currentValue = progress * target;
                        
                        
                        if (target % 1 === 0) {
                            el.innerText = Math.floor(currentValue) + suffix;
                        } else {
                            el.innerText = currentValue.toFixed(1) + suffix;
                        }
                        
                        if (progress < 1) {
                            requestAnimationFrame(animateCount);
                        } else {
                            el.innerText = targetAttr; 
                        }
                    };
                    requestAnimationFrame(animateCount);
                    observer.unobserve(el);
                }
            });
        }, { threshold: 0.5 });

        statNumbers.forEach(stat => statsObserver.observe(stat));
    }

    // Dynamic navbar scroll class toggling
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 40) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

});
