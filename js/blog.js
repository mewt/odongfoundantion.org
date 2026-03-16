/* ===================================
   ODONG Foundation - Blog (Headless WordPress)
   =================================== */

// ─────────────────────────────────────
//  CONFIG: Set this to your WordPress site URL.
//  Example: 'https://blog.odongfoundation.org'
//  Leave empty ('') to show a setup notice on the blog page.
// ─────────────────────────────────────
const WP_API_URL = 'http://localhost:3000';

const POSTS_PER_PAGE = 9;
let currentPage = 1;
let totalPages = 1;

// ─── Helpers ───────────────────────────────────────────────

function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function buildSkeletons(count) {
    const container = document.getElementById('blog-loading');
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
        container.innerHTML += `
            <div class="bg-white rounded-2xl overflow-hidden shadow-md">
                <div class="skeleton h-56 w-full"></div>
                <div class="p-6 space-y-3">
                    <div class="skeleton h-4 w-1/3"></div>
                    <div class="skeleton h-6 w-3/4"></div>
                    <div class="skeleton h-4 w-full"></div>
                    <div class="skeleton h-4 w-5/6"></div>
                    <div class="skeleton h-4 w-1/4 mt-4"></div>
                </div>
            </div>`;
    }
}

function showSection(id) {
    ['blog-loading', 'blog-error', 'blog-posts', 'blog-pagination'].forEach(s => {
        const el = document.getElementById(s);
        if (el) el.classList.add('hidden');
    });
    const target = document.getElementById(id);
    if (target) target.classList.remove('hidden');
}

// ─── Render Posts ──────────────────────────────────────────

function renderPosts(posts) {
    const container = document.getElementById('blog-posts');
    container.innerHTML = '';

    if (!posts.length) {
        container.innerHTML = `
            <div class="col-span-3 text-center py-16">
                <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i class="fas fa-newspaper text-3xl text-gray-300"></i>
                </div>
                <h3 class="text-2xl font-semibold text-dark mb-2">No Posts Yet</h3>
                <p class="text-gray-500">Check back soon for updates from ODONG Foundation!</p>
            </div>`;
    } else {
        posts.forEach(post => {
            const title = post.title?.rendered || 'Untitled';
            const excerpt = stripHtml(post.excerpt?.rendered || '').substring(0, 130) + '…';
            const date = formatDate(post.date);
            const link = `blog-post.html?id=${post.id}`;
            const thumbnail = post._embedded?.['wp:featuredmedia']?.[0]?.source_url || '';
            const category = post._embedded?.['wp:term']?.[0]?.[0]?.name || 'News';

            container.innerHTML += `
                <article class="blog-card bg-white rounded-2xl overflow-hidden shadow-md">
                    ${thumbnail
                        ? `<div class="overflow-hidden h-56 relative">
                               <img src="${thumbnail}" alt="${title}" class="w-full h-full object-cover transition-transform duration-700 hover:scale-110">
                           </div>`
                        : `<div class="h-56 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                               <i class="fas fa-newspaper text-5xl text-primary/30"></i>
                           </div>`}
                    <div class="p-6">
                        <div class="flex items-center gap-3 mb-3">
                            <span class="blog-tag">${category}</span>
                            <span class="text-gray-400 text-xs"><i class="far fa-calendar mr-1"></i>${date}</span>
                        </div>
                        <h2 class="text-xl font-bold text-dark mb-3 leading-snug hover:text-primary transition-colors duration-300">
                            <a href="${link}">${title}</a>
                        </h2>
                        <p class="text-gray-500 text-sm leading-relaxed mb-5">${excerpt}</p>
                         <a href="${link}"
                            class="inline-flex items-center text-primary font-bold text-sm hover:text-secondary transition-colors duration-300 uppercase tracking-wide group">
                             Read More <i class="fas fa-arrow-right ml-2 transform group-hover:translate-x-2 transition-transform duration-300"></i>
                         </a>
                    </div>
                </article>`;
        });
    }

    showSection('blog-posts');

    // Update pagination
    const paginationEl = document.getElementById('blog-pagination');
    const pageInfoEl = document.getElementById('page-info');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');

    if (totalPages > 1) {
        paginationEl.classList.remove('hidden');
        pageInfoEl.textContent = `Page ${currentPage} of ${totalPages}`;
        btnPrev.disabled = currentPage <= 1;
        btnNext.disabled = currentPage >= totalPages;
    } else {
        paginationEl.classList.add('hidden');
    }
}

// ─── Fetch Posts ───────────────────────────────────────────

async function loadPosts() {
    // Check if WP URL is configured
    if (!WP_API_URL) {
        document.getElementById('wp-config-notice').classList.remove('hidden');
        document.getElementById('blog-loading').classList.add('hidden');
        return;
    }

    buildSkeletons(POSTS_PER_PAGE);
    showSection('blog-loading');

    try {
        const response = await fetch(
            `${WP_API_URL}/wp-json/wp/v2/posts?per_page=${POSTS_PER_PAGE}&page=${currentPage}&_embed`,
            { headers: { 'Accept': 'application/json' } }
        );

        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }

        totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1', 10);
        const posts = await response.json();
        renderPosts(posts);

    } catch (err) {
        console.warn('Blog fetch error:', err);
        showSection('blog-error');
        const msgEl = document.getElementById('blog-error-msg');
        if (msgEl) msgEl.textContent = err.message;
    }
}

function changePage(direction) {
    const next = currentPage + direction;
    if (next < 1 || next > totalPages) return;
    currentPage = next;
    window.scrollTo({ top: document.getElementById('blog-section').offsetTop - 80, behavior: 'smooth' });
    loadPosts();
}

// ─── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', loadPosts);
