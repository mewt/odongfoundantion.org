/* ===================================
   ODONG Foundation - Main JavaScript
   =================================== */

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    
    // Mobile Navigation Toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            const isActive = this.classList.toggle('active');
            navLinks.classList.toggle('active');
            
            // When mobile menu is open, hamburger should be appropriate color
            const spans = this.querySelectorAll('span');
            if (isActive) {
                // When menu is open, use dark color for visibility on white mobile menu background
                spans.forEach(span => {
                    span.style.background = 'var(--dark-color)';
                });
            } else {
                // When closed, use current scroll state color
                const currentScroll = window.pageYOffset;
                const isScrolled = currentScroll > 100;
                spans.forEach(span => {
                    span.style.background = isScrolled ? 'var(--white)' : 'var(--dark-color)';
                });
            }
        });
    }
    
    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
            
            // Reset hamburger color based on scroll position
            const currentScroll = window.pageYOffset;
            const isScrolled = currentScroll > 100;
            const spans = hamburger.querySelectorAll('span');
            spans.forEach(span => {
                span.style.background = isScrolled ? 'var(--white)' : 'var(--dark-color)';
            });
        });
    });
    
    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    const navLinksItems = document.querySelectorAll('.nav-links a');
    const logo = document.querySelector('.logo');
    // const hamburger = document.querySelector('.hamburger'); // Already declared
    const donateButtons = document.querySelectorAll('.btn-donate');
    let lastScroll = 0;
    
    function updateNavbarColors(isScrolled) {
        if (isScrolled) {
            // Scrolled down - change to dark background with white text
            navbar.style.background = 'var(--dark-color)';
            navbar.style.backdropFilter = 'blur(10px)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.3)';
            
            // Change text color to white
            if (logo) logo.style.color = 'var(--white)';
            navLinksItems.forEach(link => {
                link.style.color = 'var(--white)';
            });
            
            // Change hamburger color to white
            if (hamburger) {
                const spans = hamburger.querySelectorAll('span');
                spans.forEach(span => {
                    span.style.background = 'var(--white)';
                });
            }
            
            // Update donate button for dark navbar
            donateButtons.forEach(button => {
                button.style.background = 'var(--primary-color)';
                button.style.color = 'var(--white) !important';
            });
        } else {
            // At top - change to white background with dark text (default)
            navbar.style.background = 'var(--white)';
            navbar.style.backdropFilter = 'none';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
            
            // Change text color to dark
            if (logo) logo.style.color = 'var(--dark-color)';
            navLinksItems.forEach(link => {
                link.style.color = 'var(--dark-color)';
            });
            
            // Change hamburger color to dark
            if (hamburger) {
                const spans = hamburger.querySelectorAll('span');
                spans.forEach(span => {
                    span.style.background = 'var(--dark-color)';
                });
            }
            
            // Update donate button for light navbar
            donateButtons.forEach(button => {
                button.style.background = 'var(--primary-color)';
                button.style.color = 'var(--white) !important';
            });
        }
    }
    
    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            updateNavbarColors(true);
        } else {
            updateNavbarColors(false);
        }
        
        lastScroll = currentScroll;
    });
    
    // Initialize navbar colors on page load (white background by default)
    updateNavbarColors(false);
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const offsetTop = target.offsetTop - 80;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
    
    // Counter animation function
    function animateCounter(counter) {
           // Get target value from data attribute
           const targetText = counter.getAttribute('data-target');
           if (!targetText) return;
           
           const target = parseInt(targetText);
           if (isNaN(target)) return;
           
           // Set initial value to 0
           counter.textContent = '0';
           
           // Start animation
           const duration = 2000; // 2 seconds
           const startTime = Date.now();
           const startValue = 0;
           
           const updateCounter = function() {
               const currentTime = Date.now();
               const elapsed = currentTime - startTime;
               const progress = Math.min(elapsed / duration, 1);
               
               // Easing function for smooth animation
               const easeOutQuart = 1 - Math.pow(1 - progress, 4);
               const currentValue = Math.floor(startValue + (target - startValue) * easeOutQuart);
               
               // Update counter text with formatting
               counter.textContent = currentValue.toLocaleString();
               
               if (progress < 1) {
                   requestAnimationFrame(updateCounter);
               } else {
                   // Ensure final value is exactly the target
                   counter.textContent = target.toLocaleString();
               }
           };
           
           // Start the animation
           updateCounter();
       }

       // Stats counter animation with IntersectionObserver
       function initStatsAnimation() {
           const counters = document.querySelectorAll('.stat-number[data-target]');
           if (counters.length === 0) {
               return;
           }
           
           if ('IntersectionObserver' in window) {
               const statsObserver = new IntersectionObserver((entries, observer) => {
                   entries.forEach(entry => {
                       if (entry.isIntersecting) {
                           // Stagger the animation of children in the same section
                           const allCounters = Array.from(entry.target.closest('.stats-grid').querySelectorAll('.stat-number'));
                           const index = allCounters.indexOf(entry.target);
                           
                           setTimeout(() => {
                               animateCounter(entry.target);
                           }, index * 200);
                           
                           // Stop observing once animation has started
                           observer.unobserve(entry.target);
                       }
                   });
               }, { threshold: 0.5 }); // Trigger when 50% visible
               
               counters.forEach(counter => {
                   // Ensure it starts at 0 visually before animation begins
                   counter.textContent = '0';
                   statsObserver.observe(counter);
               });
           } else {
               // Fallback for older browsers
               counters.forEach((counter, index) => {
                   setTimeout(() => {
                       animateCounter(counter);
                   }, index * 300);
               });
           }
       }
       
       // Initialize stats animation
       initStatsAnimation();
    
    // Form validation and submission
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const subject = document.getElementById('subject').value;
            const message = document.getElementById('message').value.trim();
            
            // Validate
            if (!name || !email || !subject || !message) {
                showNotification('Please fill in all required fields.', 'error');
                return;
            }
            
            if (!isValidEmail(email)) {
                showNotification('Please enter a valid email address.', 'error');
                return;
            }
            
            // Simulate form submission (replace with actual API call)
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;
            
            setTimeout(function() {
                showNotification('Thank you for your message! We will get back to you soon.', 'success');
                contactForm.reset();
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 1500);
        });
    }
    
    // Email validation
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // Notification function
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        const style = document.createElement('style');
        style.textContent = `
            .notification {
                position: fixed;
                top: 100px;
                right: 20px;
                padding: 15px 25px;
                border-radius: 10px;
                color: white;
                font-weight: 500;
                z-index: 9999;
                animation: slideIn 0.3s ease;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            }
            .notification.success {
                background: #10AC84;
            }
            .notification.error {
                background: #E74C3C;
            }
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        
        if (!document.querySelector('.notification-style')) {
            style.className = 'notification-style';
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        setTimeout(function() {
            notification.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(function() {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    // Copy to clipboard function (for donation page)
    window.copyToClipboard = function(elementId) {
        const text = document.getElementById(elementId).innerText;
        navigator.clipboard.writeText(text).then(function() {
            showNotification('Account number copied to clipboard!', 'success');
        }).catch(function(err) {
            showNotification('Failed to copy. Please copy manually.', 'error');
        });
    };
    

    
    // Active nav link based on current page
    const currentPage = window.location.pathname.split('/').pop() || 'index';
    document.querySelectorAll('.nav-links a').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === '/') || (currentPage === 'index.html' && href === '/')) {
            link.classList.add('active');
        }
    });
    
    // Lazy loading for images
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                    imageObserver.unobserve(img);
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
    
    // Donation button functionality
    document.querySelectorAll('.rh-donation-btn').forEach(button => {
        button.addEventListener('click', function() {
            // Redirect to contact page donation section
            window.location.href = 'contact#donate';
        });
    });
    
    // Add scroll to top button
    const scrollToTop = document.createElement('button');
    scrollToTop.className = 'scroll-to-top';
    scrollToTop.innerHTML = '<i class="fas fa-arrow-up"></i>';
    scrollToTop.setAttribute('aria-label', 'Scroll to top');
    document.body.appendChild(scrollToTop);
    
    const scrollStyle = document.createElement('style');
    scrollStyle.textContent = `
        .scroll-to-top {
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            color: white;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            z-index: 999;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        .scroll-to-top.visible {
            opacity: 1;
            visibility: visible;
        }
        .scroll-to-top:hover {
            transform: translateY(-5px);
            box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        }
        .scroll-to-top i {
            font-size: 1.2rem;
        }
    `;
    document.head.appendChild(scrollStyle);
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 500) {
            scrollToTop.classList.add('visible');
        } else {
            scrollToTop.classList.remove('visible');
        }
    });
    
    scrollToTop.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
});

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Utility function for throttling
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

console.log('ODONG Foundation website loaded successfully!');
