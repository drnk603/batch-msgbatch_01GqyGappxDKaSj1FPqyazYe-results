(function() {
    'use strict';

    window.__app = window.__app || {};

    const CONFIG = {
        HEADER_HEIGHT: 80,
        ANIMATION_DURATION: 600,
        ANIMATION_EASING: 'cubic-bezier(0.4, 0, 0.2, 1)',
        DEBOUNCE_DELAY: 150,
        THROTTLE_DELAY: 100
    };

    const PATTERNS = {
        email: /^[^s@]+@[^s@]+.[^s@]+$/,
        phone: /^[ds+-()]{10,20}$/,
        name: /^[a-zA-ZÀ-ÿs-']{2,50}$/,
        message: /^.{10,}$/
    };

    const MESSAGES = {
        required: 'Dieses Feld ist erforderlich',
        invalidEmail: 'Bitte geben Sie eine gültige E-Mail-Adresse ein',
        invalidPhone: 'Bitte geben Sie eine gültige Telefonnummer ein',
        invalidName: 'Name muss 2-50 Zeichen lang sein',
        shortMessage: 'Nachricht muss mindestens 10 Zeichen enthalten',
        success: 'Ihre Nachricht wurde erfolgreich gesendet!',
        error: 'Fehler beim Senden. Bitte versuchen Sie es erneut.',
        sending: 'Wird gesendet...',
        privacyRequired: 'Bitte akzeptieren Sie die Datenschutzerklärung'
    };

    function debounce(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    function throttle(func, delay) {
        let lastCall = 0;
        return function(...args) {
            const now = Date.now();
            if (now - lastCall >= delay) {
                lastCall = now;
                func.apply(this, args);
            }
        };
    }

    class BurgerMenu {
        constructor() {
            this.toggle = document.querySelector('.navbar-toggler');
            this.collapse = document.querySelector('.navbar-collapse');
            this.nav = document.querySelector('header.navbar');
            this.body = document.body;
            this.links = document.querySelectorAll('.nav-link');
            
            if (!this.toggle || !this.collapse) return;
            
            this.init();
        }

        init() {
            this.toggle.addEventListener('click', () => this.handleToggle());
            this.links.forEach(link => {
                link.addEventListener('click', () => this.close());
            });
            
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen()) this.close();
            });

            document.addEventListener('click', (e) => {
                if (this.isOpen() && !this.nav.contains(e.target)) {
                    this.close();
                }
            });

            window.addEventListener('resize', throttle(() => {
                if (window.innerWidth >= 1024 && this.isOpen()) {
                    this.close();
                }
            }, CONFIG.THROTTLE_DELAY));
        }

        handleToggle() {
            this.isOpen() ? this.close() : this.open();
        }

        isOpen() {
            return this.collapse.classList.contains('show');
        }

        open() {
            this.collapse.style.height = 'calc(100vh - var(--header-h))';
            this.collapse.classList.add('show');
            this.toggle.setAttribute('aria-expanded', 'true');
            this.body.classList.add('u-no-scroll');
        }

        close() {
            this.collapse.classList.remove('show');
            this.toggle.setAttribute('aria-expanded', 'false');
            this.body.classList.remove('u-no-scroll');
            setTimeout(() => {
                this.collapse.style.height = '';
            }, 300);
        }
    }

    class SmoothScroll {
        constructor() {
            this.init();
        }

        init() {
            document.addEventListener('click', (e) => {
                const link = e.target.closest('a[href^="#"]');
                if (!link) return;

                const href = link.getAttribute('href');
                if (!href || href === '#' || href === '#!') return;

                const target = document.querySelector(href);
                if (!target) return;

                e.preventDefault();
                this.scrollTo(target);
            });
        }

        scrollTo(element) {
            const headerHeight = document.querySelector('header.navbar')?.offsetHeight || CONFIG.HEADER_HEIGHT;
            const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - headerHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    }

    class ScrollSpy {
        constructor() {
            this.sections = document.querySelectorAll('section[id]');
            this.navLinks = document.querySelectorAll('.nav-link');
            
            if (this.sections.length === 0) return;
            
            this.init();
        }

        init() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.setActiveLink(entry.target.id);
                    }
                });
            }, {
                rootMargin: '-20% 0px -70% 0px'
            });

            this.sections.forEach(section => observer.observe(section));
        }

        setActiveLink(id) {
            this.navLinks.forEach(link => {
                link.classList.remove('active');
                link.removeAttribute('aria-current');
                
                if (link.getAttribute('href') === `#${id}`) {
                    link.classList.add('active');
                    link.setAttribute('aria-current', 'page');
                }
            });
        }
    }

    class FormValidator {
        constructor(form) {
            this.form = form;
            this.fields = form.querySelectorAll('input, textarea, select');
            this.submitBtn = form.querySelector('button[type="submit"]');
            this.originalBtnText = this.submitBtn?.textContent || '';
            this.honeypot = this.createHoneypot();
            
            this.init();
        }

        createHoneypot() {
            const field = document.createElement('input');
            field.type = 'text';
            field.name = 'website';
            field.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;';
            field.tabIndex = -1;
            field.setAttribute('autocomplete', 'off');
            this.form.appendChild(field);
            return field;
        }

        init() {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
            
            this.fields.forEach(field => {
                field.addEventListener('blur', () => this.validateField(field));
                field.addEventListener('input', debounce(() => {
                    if (field.classList.contains('is-invalid')) {
                        this.validateField(field);
                    }
                }, CONFIG.DEBOUNCE_DELAY));
            });
        }

        validateField(field) {
            const value = field.value.trim();
            const type = field.type;
            const id = field.id;
            const required = field.hasAttribute('required');
            
            this.clearError(field);

            if (required && !value) {
                this.showError(field, MESSAGES.required);
                return false;
            }

            if (!value) return true;

            if (type === 'email' && !PATTERNS.email.test(value)) {
                this.showError(field, MESSAGES.invalidEmail);
                return false;
            }

            if (type === 'tel' && !PATTERNS.phone.test(value)) {
                this.showError(field, MESSAGES.invalidPhone);
                return false;
            }

            if ((id === 'firstName' || id === 'lastName' || id === 'name') && !PATTERNS.name.test(value)) {
                this.showError(field, MESSAGES.invalidName);
                return false;
            }

            if (id === 'message' && !PATTERNS.message.test(value)) {
                this.showError(field, MESSAGES.shortMessage);
                return false;
            }

            if (type === 'checkbox' && required && !field.checked) {
                this.showError(field, MESSAGES.privacyRequired);
                return false;
            }

            return true;
        }

        validateForm() {
            let isValid = true;
            
            this.fields.forEach(field => {
                if (!this.validateField(field)) {
                    isValid = false;
                }
            });

            return isValid;
        }

        showError(field, message) {
            field.classList.add('is-invalid');
            
            let errorEl = field.parentElement.querySelector('.invalid-feedback');
            if (!errorEl) {
                errorEl = document.createElement('div');
                errorEl.className = 'invalid-feedback';
                field.parentElement.appendChild(errorEl);
            }
            
            errorEl.textContent = message;
        }

        clearError(field) {
            field.classList.remove('is-invalid');
            const errorEl = field.parentElement.querySelector('.invalid-feedback');
            if (errorEl) {
                errorEl.textContent = '';
            }
        }

        handleSubmit(e) {
            e.preventDefault();

            if (this.honeypot.value) {
                return;
            }

            if (!this.validateForm()) {
                return;
            }

            if (!navigator.onLine) {
                window.__app.notify(MESSAGES.error, 'danger');
                return;
            }

            this.lockForm();

            setTimeout(() => {
                window.location.href = 'thank_you.html';
            }, 500);
        }

        lockForm() {
            if (this.submitBtn) {
                this.submitBtn.disabled = true;
                this.submitBtn.classList.add('is-loading');
                this.submitBtn.textContent = MESSAGES.sending;
            }
        }

        unlockForm() {
            if (this.submitBtn) {
                this.submitBtn.disabled = false;
                this.submitBtn.classList.remove('is-loading');
                this.submitBtn.textContent = this.originalBtnText;
            }
        }
    }

    class AnimationController {
        constructor() {
            this.animatedElements = new Set();
            this.init();
        }

        init() {
            this.setupIntersectionObserver();
            this.animateOnLoad();
            this.setupButtonAnimations();
            this.setupCardAnimations();
            this.setupImageAnimations();
        }

        setupIntersectionObserver() {
            const options = {
                root: null,
                rootMargin: '0px',
                threshold: 0.1
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !this.animatedElements.has(entry.target)) {
                        this.animatedElements.add(entry.target);
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }
                });
            }, options);

            document.querySelectorAll('.card, section, .hero-section, form').forEach(el => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(20px)';
                el.style.transition = `opacity ${CONFIG.ANIMATION_DURATION}ms ${CONFIG.ANIMATION_EASING}, transform ${CONFIG.ANIMATION_DURATION}ms ${CONFIG.ANIMATION_EASING}`;
                observer.observe(el);
            });
        }

        animateOnLoad() {
            document.querySelectorAll('img[loading="lazy"]').forEach(img => {
                img.style.opacity = '0';
                img.style.transform = 'scale(0.95)';
                img.style.transition = `opacity 600ms ease-out, transform 600ms ease-out`;

                img.addEventListener('load', () => {
                    img.style.opacity = '1';
                    img.style.transform = 'scale(1)';
                });
            });
        }

        setupButtonAnimations() {
            document.querySelectorAll('.btn, .c-button, a[class*="btn"]').forEach(btn => {
                btn.style.transition = 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)';
                
                btn.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-2px)';
                    this.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
                });

                btn.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(0)';
                    this.style.boxShadow = '';
                });

                btn.addEventListener('mousedown', function() {
                    this.style.transform = 'translateY(0) scale(0.98)';
                });

                btn.addEventListener('mouseup', function() {
                    this.style.transform = 'translateY(-2px) scale(1)';
                });
            });
        }

        setupCardAnimations() {
            document.querySelectorAll('.card, .c-card').forEach(card => {
                card.style.transition = 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)';
                
                card.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-8px)';
                    this.style.boxShadow = '0 16px 48px rgba(0, 0, 0, 0.15)';
                });

                card.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(0)';
                    this.style.boxShadow = '';
                });
            });
        }

        setupImageAnimations() {
            const images = document.querySelectorAll('.card-img-top, .ratio img');
            
            images.forEach(img => {
                img.style.transition = 'transform 400ms cubic-bezier(0.4, 0, 0.2, 1)';
                
                const parent = img.closest('.card, .ratio');
                if (parent) {
                    parent.addEventListener('mouseenter', () => {
                        img.style.transform = 'scale(1.05)';
                    });

                    parent.addEventListener('mouseleave', () => {
                        img.style.transform = 'scale(1)';
                    });
                }
            });
        }
    }

    class ScrollToTop {
        constructor() {
            this.button = this.createButton();
            this.init();
        }

        createButton() {
            const btn = document.createElement('button');
            btn.innerHTML = '↑';
            btn.className = 'scroll-to-top';
            btn.setAttribute('aria-label', 'Nach oben scrollen');
            btn.style.cssText = `
                position: fixed;
                bottom: 30px;
                right: 30px;
                width: 50px;
                height: 50px;
                background: var(--color-primary);
                color: white;
                border: none;
                border-radius: 50%;
                font-size: 24px;
                cursor: pointer;
                opacity: 0;
                transform: translateY(20px);
                transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
                z-index: 999;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
                pointer-events: none;
            `;
            document.body.appendChild(btn);
            return btn;
        }

        init() {
            window.addEventListener('scroll', throttle(() => {
                if (window.pageYOffset > 300) {
                    this.button.style.opacity = '1';
                    this.button.style.transform = 'translateY(0)';
                    this.button.style.pointerEvents = 'auto';
                } else {
                    this.button.style.opacity = '0';
                    this.button.style.transform = 'translateY(20px)';
                    this.button.style.pointerEvents = 'none';
                }
            }, CONFIG.THROTTLE_DELAY));

            this.button.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });

            this.button.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-3px)';
                this.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
            });

            this.button.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
            });
        }
    }

    class NotificationManager {
        constructor() {
            this.container = this.createContainer();
        }

        createContainer() {
            const container = document.createElement('div');
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                max-width: 350px;
            `;
            document.body.appendChild(container);
            return container;
        }

        notify(message, type = 'info') {
            const alert = document.createElement('div');
            alert.className = `alert alert-${type} alert-dismissible fade show`;
            alert.style.cssText = `
                padding: 16px 20px;
                border-radius: 12px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
                margin-bottom: 12px;
                animation: slideIn 300ms cubic-bezier(0.4, 0, 0.2, 1);
            `;
            alert.innerHTML = `
                ${message}
                <button type="button" class="btn-close" aria-label="Schließen"></button>
            `;

            const style = document.createElement('style');
            style.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);

            this.container.appendChild(alert);

            const closeBtn = alert.querySelector('.btn-close');
            closeBtn.addEventListener('click', () => this.close(alert));

            setTimeout(() => this.close(alert), 5000);
        }

        close(alert) {
            alert.style.animation = 'slideOut 300ms cubic-bezier(0.4, 0, 0.2, 1)';
            
            const style = document.createElement('style');
            style.textContent = `
                @keyframes slideOut {
                    to {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);

            setTimeout(() => {
                if (alert.parentNode) {
                    alert.parentNode.removeChild(alert);
                }
            }, 300);
        }
    }

    class ImageHandler {
        constructor() {
            this.init();
        }

        init() {
            document.querySelectorAll('img').forEach(img => {
                if (!img.classList.contains('img-fluid')) {
                    img.classList.add('img-fluid');
                }

                if (!img.hasAttribute('loading') && !img.hasAttribute('data-critical')) {
                    img.setAttribute('loading', 'lazy');
                }

                img.addEventListener('error', function() {
                    this.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='100%25' height='100%25' fill='%23f8f9fa'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='14' fill='%236c757d' text-anchor='middle' dy='.3em'%3EBild nicht verfügbar%3C/text%3E%3C/svg%3E`;
                });
            });
        }
    }

    window.__app.init = function() {
        new BurgerMenu();
        new SmoothScroll();
        new ScrollSpy();
        new AnimationController();
        new ScrollToTop();
        new ImageHandler();
        
        const notificationManager = new NotificationManager();
        window.__app.notify = (message, type) => notificationManager.notify(message, type);

        document.querySelectorAll('form').forEach(form => {
            new FormValidator(form);
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', window.__app.init);
    } else {
        window.__app.init();
    }

})();
