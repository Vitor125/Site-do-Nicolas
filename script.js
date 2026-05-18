const API_URL = window.MANEIRIN_API_URL || 'http://127.0.0.1:8000/api';
const WHATSAPP_PHONE = '5521980453636';

function escapeHtml(value = '') {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function buildWhatsappUrl(message) {
    return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
}

function formatDateBR(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

function formatTime(timeStr) {
    return String(timeStr || '').slice(0, 5);
}

function safeExternalUrl(value) {
    try {
        const url = new URL(value);
        if (url.protocol === 'http:' || url.protocol === 'https:') {
            return url.href;
        }
    } catch (error) {
        return '#';
    }

    return '#';
}

function setupMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const header = document.querySelector('.header');

    if (!hamburger || !navLinks || !header) return;

    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');

        const icon = hamburger.querySelector('i');
        const isOpen = navLinks.classList.contains('active');
        icon.classList.toggle('fa-bars', !isOpen);
        icon.classList.toggle('fa-times', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : 'auto';
        header.style.background = isOpen ? 'rgba(17, 24, 39, 1)' : 'rgba(17, 24, 39, 0.85)';
    });

    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            const icon = hamburger.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
            document.body.style.overflow = 'auto';
        });
    });
}

function setupScrollHeader() {
    const header = document.querySelector('.header');
    if (!header) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.background = 'rgba(17, 24, 39, 0.98)';
            header.style.boxShadow = '0 4px 20px rgba(0,0,0,0.5)';
        } else {
            header.style.background = 'rgba(17, 24, 39, 0.85)';
            header.style.boxShadow = 'none';
        }
    });
}

function setupAnimations() {
    const fadeElements = document.querySelectorAll('.about-text, .about-image, .product-card, .info-item, .section-desc, .disclaimer, .slot-card');

    fadeElements.forEach(el => el.classList.add('fade-in'));

    const observer = new IntersectionObserver((entries, currentObserver) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                currentObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    fadeElements.forEach(el => observer.observe(el));

    const heroContent = document.querySelector('.hero-content, .agenda-hero .container');
    if (heroContent) {
        heroContent.classList.add('fade-in');
        setTimeout(() => heroContent.classList.add('visible'), 100);
    }
}

function setupWhatsappLinks() {
    document.querySelectorAll('[data-whatsapp-message]').forEach(link => {
        const message = link.getAttribute('data-whatsapp-message') || 'Olá! Gostaria de entrar em contato com o Maneirin Studio.';
        link.setAttribute('href', buildWhatsappUrl(message));
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener');
    });
}

function renderProducts(products) {
    const grid = document.querySelector('.products-grid');
    if (!grid) return;

    if (!products.length) {
        grid.innerHTML = '<p class="empty-message">Nenhum produto cadastrado ainda.</p>';
        return;
    }

    grid.innerHTML = products.map(product => {
        const name = escapeHtml(product.name);
        const description = escapeHtml(product.description || '');
        const imageUrl = escapeHtml(product.image_url || '');
        const productUrl = escapeHtml(safeExternalUrl(product.affiliate_link));

        return `
            <article class="product-card fade-in">
                <div class="product-img">
                    ${imageUrl
                        ? `<img src="${imageUrl}" alt="${name}" loading="lazy" onerror="this.remove();">`
                        : '<i class="fas fa-box-open"></i>'}
                </div>
                <h3>${name}</h3>
                ${description ? `<p>${description}</p>` : '<p>Produto recomendado pelo Maneirin Studio.</p>'}
                <a href="${productUrl}" class="btn btn-secondary" target="_blank" rel="noopener">Ver Produto</a>
            </article>
        `;
    }).join('');

    setupAnimations();
}

async function fetchProducts() {
    const grid = document.querySelector('.products-grid');
    if (!grid) return;

    try {
        const response = await fetch(`${API_URL}/products`);
        if (!response.ok) throw new Error('Falha ao carregar produtos');
        const products = await response.json();
        renderProducts(products);
    } catch (error) {
        console.error(error);
        grid.innerHTML = '<p class="empty-message">Não foi possível carregar os produtos agora.</p>';
    }
}

function renderSchedules(schedules) {
    const list = document.getElementById('agendaList');
    if (!list) return;

    if (!schedules.length) {
        list.innerHTML = '<div class="no-slots">Nenhum horário disponível no momento.</div>';
        return;
    }

    const groupedSchedules = schedules.reduce((groups, schedule) => {
        const key = schedule.date;
        if (!groups[key]) groups[key] = [];
        groups[key].push(schedule);
        return groups;
    }, {});

    list.innerHTML = Object.entries(groupedSchedules).map(([date, slots]) => `
        <section class="date-group">
            <h2 class="date-title"><i class="far fa-calendar-alt"></i> ${formatDateBR(date)}</h2>
            <div class="slots-grid">
                ${slots.map(slot => {
                    const barber = escapeHtml(slot.barber_name);
                    const time = formatTime(slot.time);
                    const message = `Olá! Vim pelo site do Maneirin Studio e gostaria de agendar um horário com ${slot.barber_name} no dia ${formatDateBR(slot.date)} às ${time}.`;

                    return `
                        <article class="slot-card fade-in">
                            <span class="slot-time">${time}</span>
                            <span class="slot-barber">Com ${barber}</span>
                            <a href="${buildWhatsappUrl(message)}" class="btn btn-primary" target="_blank" rel="noopener">
                                Agendar
                            </a>
                        </article>
                    `;
                }).join('')}
            </div>
        </section>
    `).join('');

    setupAnimations();
}

async function fetchSchedules() {
    const list = document.getElementById('agendaList');
    if (!list) return;

    try {
        const response = await fetch(`${API_URL}/schedules`);
        if (!response.ok) throw new Error('Falha ao carregar horários');
        const schedules = await response.json();
        renderSchedules(schedules);
    } catch (error) {
        console.error(error);
        list.innerHTML = '<div class="no-slots">Não foi possível carregar a agenda agora.</div>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setupMobileMenu();
    setupScrollHeader();
    setupWhatsappLinks();
    setupAnimations();
    fetchProducts();
    fetchSchedules();
});
