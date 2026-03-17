/* ===================================
   ODONG Foundation - Single Blog Post
   =================================== */

console.log('blog-post.js loaded!');

// ─────────────────────────────────────
//  CONFIG: Same as blog.js
// ─────────────────────────────────────
const WP_API_URL = 'https://blog.odongfoundation.org';
console.log('WP_API_URL set to:', WP_API_URL);

// ─── Helpers ───────────────────────────────────────────────

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

function updateMetaTags(post) {
    const title = post.title?.rendered || 'Blog Post - ODONG Foundation';
    const excerpt = stripHtml(post.excerpt?.rendered || 'Blog post from ODONG Foundation');
    const featuredImage = post._embedded?.['wp:featuredmedia']?.[0]?.source_url || '';
    const currentUrl = window.location.href;
    
    // Update document title
    document.title = `${title} - ODONG Foundation Blog`;
    
    // Update canonical URL
    const canonicalLink = document.getElementById('canonical-url');
    if (canonicalLink) {
        // Build canonical URL with production domain + current path
        const canonicalUrl = 'https://odongfoundation.org' + window.location.pathname;
        canonicalLink.href = canonicalUrl;
        console.log('Canonical URL set to:', canonicalUrl);
    }
    
    // Update meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
    }
    metaDesc.content = excerpt.substring(0, 160);
    
    // Update Open Graph tags
    const ogTags = {
        'og:title': title,
        'og:description': excerpt.substring(0, 200),
        'og:url': currentUrl,
        'og:image': featuredImage
    };
    
    Object.entries(ogTags).forEach(([property, content]) => {
        if (content) {
            let tag = document.querySelector(`meta[property="${property}"]`);
            if (!tag) {
                tag = document.createElement('meta');
                tag.setAttribute('property', property);
                document.head.appendChild(tag);
            }
            tag.content = content;
        }
    });
    
    // Update Twitter cards
    const twitterTags = {
        'twitter:title': title,
        'twitter:description': excerpt.substring(0, 200),
        'twitter:image': featuredImage
    };
    
    Object.entries(twitterTags).forEach(([name, content]) => {
        if (content) {
            let tag = document.querySelector(`meta[name="${name}"]`);
            if (!tag) {
                tag = document.createElement('meta');
                tag.name = name;
                document.head.appendChild(tag);
            }
            tag.content = content;
        }
    });
}

function showSection(id) {
    ['loading-state', 'blog-post-content', 'error-state'].forEach(sectionId => {
        const el = document.getElementById(sectionId);
        if (el) el.classList.add('hidden');
    });
    
    const target = document.getElementById(id);
    if (target) target.classList.remove('hidden');
}

// ─── Render Post ───────────────────────────────────────────

function renderPost(post) {
    // Update meta tags for SEO
    updateMetaTags(post);
    
    // Update featured image
    const featuredImage = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;
    const featuredImageEl = document.getElementById('featured-image');
    
    if (featuredImage && featuredImageEl) {
        featuredImageEl.style.backgroundImage = `url('${featuredImage}')`;
        featuredImageEl.style.backgroundSize = 'cover';
        featuredImageEl.style.backgroundPosition = 'center';
    }
    
    // Update post info
    document.getElementById('post-title').textContent = post.title?.rendered || 'Untitled';
    document.getElementById('post-date').innerHTML += formatDate(post.date);
    document.getElementById('post-author').textContent = post._embedded?.author?.[0]?.name || 'ODONG Foundation';
    
    // Update category
    const categoryEl = document.getElementById('post-category');
    const category = post._embedded?.['wp:term']?.[0]?.[0]?.name;
    if (category && categoryEl) {
        categoryEl.textContent = category;
    }
    
    // Update content
    const contentEl = document.getElementById('post-content');
    if (contentEl && post.content?.rendered) {
        contentEl.innerHTML = post.content.rendered;
        
        // Add responsive classes to images in content
        contentEl.querySelectorAll('img').forEach(img => {
            img.classList.add('max-w-full', 'h-auto', 'rounded-xl', 'my-8');
        });
        
        // Style headings
        contentEl.querySelectorAll('h2').forEach(h2 => {
            h2.classList.add('text-3xl', 'font-bold', 'mt-10', 'mb-4', 'text-dark');
        });
        
        contentEl.querySelectorAll('h3').forEach(h3 => {
            h3.classList.add('text-2xl', 'font-semibold', 'mt-8', 'mb-3', 'text-dark');
        });
        
        // Style paragraphs
        contentEl.querySelectorAll('p').forEach(p => {
            p.classList.add('text-gray-700', 'leading-relaxed', 'mb-6');
        });
        
        // Style lists
        contentEl.querySelectorAll('ul, ol').forEach(list => {
            list.classList.add('pl-6', 'mb-6');
        });
        
        contentEl.querySelectorAll('li').forEach(li => {
            li.classList.add('mb-2');
        });
        
        // Style blockquotes
        contentEl.querySelectorAll('blockquote').forEach(blockquote => {
            blockquote.classList.add('border-l-4', 'border-primary', 'pl-6', 'my-8', 'italic', 'text-gray-600');
        });
    }
    
    showSection('blog-post-content');
}

// ─── Fetch Post ───────────────────────────────────────────

async function loadPost() {
    console.log('=== loadPost started ===');
    console.log('Current URL:', window.location.href);
    console.log('WP_API_URL:', WP_API_URL);
    
    // Show loading state
    showSection('loading-state');
    console.log('Loading state shown');
    
    // Get post slug from URL path (e.g., /blog-post/hello-world)
    const pathSegments = window.location.pathname.split('/');
    console.log('Path segments:', pathSegments);
    
    // Filter out empty strings and get the last segment (the slug)
    const validSegments = pathSegments.filter(s => s.length > 0);
    console.log('Valid segments:', validSegments);
    
    // The slug should be the last segment after 'blog-post'
    const postSlug = validSegments.length > 1 ? validSegments[validSegments.length - 1] : null;
    console.log('Extracted slug:', postSlug);
    
    if (!postSlug || postSlug === 'blog-post') {
        console.error('Invalid slug:', postSlug);
        showError('No post slug specified in URL');
        return;
    }
    
    // Check if WP URL is configured
    if (!WP_API_URL) {
        showError('WordPress API URL not configured');
        return;
    }
    
    try {
        // Fetch post by slug instead of ID
        const apiUrl = `${WP_API_URL}/wp-json/wp/v2/posts?slug=${postSlug}&_embed`;
        console.log('Fetching from:', apiUrl);
        
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        console.log('Starting fetch...');
        const response = await fetch(
            apiUrl,
            { 
                method: 'GET',
                headers: { 
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                mode: 'cors',
                signal: controller.signal
            }
        );
        console.log('Fetch completed');
        
        clearTimeout(timeoutId);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Post not found');
            }
            throw new Error(`Server responded with ${response.status}`);
        }
        
        const posts = await response.json();
        console.log('Posts received:', posts.length, 'posts');
        
        // When fetching by slug, API returns an array
        if (!posts || posts.length === 0) {
            throw new Error('Post not found');
        }
        
        console.log('Rendering post:', posts[0].title?.rendered);
        renderPost(posts[0]);
        
    } catch (err) {
        if (err.name === 'AbortError') {
            console.error('Request timed out after 10 seconds');
            showError('Request timed out. Please check your connection.');
        } else {
            console.error('Blog post fetch error:', err);
            showError(err.message || 'Failed to load post');
        }
    }
    
    console.log('=== loadPost completed ===');
}

function showError(message) {
    const errorMsgEl = document.getElementById('error-message');
    if (errorMsgEl) {
        errorMsgEl.textContent = message;
    }
    showSection('error-state');
}

// ─── Init ──────────────────────────────────────────────────
console.log('Script loaded, adding DOMContentLoaded listener');
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded fired');
    loadPost().catch(err => {
        console.error('Unhandled error in loadPost:', err);
        showError('Unexpected error: ' + err.message);
    });
});