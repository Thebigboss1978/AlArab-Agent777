// Configuration
const CONFIG = {
    API_BASE_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:5000/api' 
        : '/api',
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
    TYPING_DELAY: 1000 // 1 second
};

// Global State
let toursData = [];
let currentSearchTerm = '';
let isLoading = false;
let chatHistory = [];

// Initialize App when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 العرّاب App initialized');
    initializeApp();
});

// Initialize Application
async function initializeApp() {
    try {
        showLoading(true);
        await loadTours();
        setupEventListeners();
        hideLoading();
        showSuccessToast('تم تحميل الجولات بنجاح! 🎉');
    } catch (error) {
        console.error('❌ Error initializing app:', error);
        hideLoading();
        showErrorToast('حدث خطأ في تحميل البيانات. يرجى إعادة تحميل الصفحة.');
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }

    // Chat input enter key
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', handleChatKeyPress);
    }

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^=\"#\"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// Load Tours from API
async function loadTours() {
    try {
        console.log('🔄 Loading tours from API...');
        
        const response = await fetch(`${CONFIG.API_BASE_URL}/tours`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.tours || !Array.isArray(data.tours)) {
            throw new Error('Invalid tours data received');
        }
        
        toursData = data.tours;
        console.log(`✅ Loaded ${toursData.length} tours`);
        
        renderTours(toursData);
        
    } catch (error) {
        console.error('❌ Error loading tours:', error);
        showErrorToast('فشل في تحميل الجولات. تأكد من اتصال الإنترنت.');
        
        // Show fallback message
        const container = document.getElementById('toursContainer');
        if (container) {
            container.innerHTML = `
                <div class=\"error-state\">
                    <i class=\"fas fa-exclamation-triangle\"></i>
                    <h3>خطأ في تحميل البيانات</h3>
                    <p>لا يمكن الوصول إلى بيانات الجولات حالياً.</p>
                    <button onclick=\"loadTours()\" class=\"btn btn-primary\">
                        <i class=\"fas fa-refresh\"></i>
                        إعادة المحاولة
                    </button>
                </div>
            `;
        }
    }
}

// Render Tours in Grid
function renderTours(tours) {
    const container = document.getElementById('toursContainer');
    const noResults = document.getElementById('noResults');
    
    if (!container) return;
    
    if (!tours || tours.length === 0) {
        container.innerHTML = '';
        if (noResults) noResults.style.display = 'block';
        return;
    }
    
    if (noResults) noResults.style.display = 'none';
    
    container.innerHTML = tours.map(tour => createTourCard(tour)).join('');
}

// Create Tour Card HTML
function createTourCard(tour) {
    const {
        Name = 'جولة سياحية',
        Description = 'وصف غير متاح',
        Price = 'يرجى الاستفسار',
        Duration = 'غير محدد',
        Phone = '',
        Location = 'القاهرة',
        WhatsAppLink = ''
    } = tour;
    
    // Create WhatsApp link if not provided
    const whatsappLink = WhatsAppLink || (Phone ? 
        `https://wa.me/${Phone.replace(/\\D/g, '')}?text=${encodeURIComponent(`استفسار عن جولة: ${Name}`)}` 
        : '#'
    );
    
    return `
        <div class=\"tour-card\" onclick=\"handleTourClick('${tour._id || ''}')\" role=\"button\" tabindex=\"0\">
            <div class=\"tour-card-header\">
                <div class=\"tour-image-placeholder\">
                    <i class=\"fas fa-mountain\"></i>
                </div>
                <div class=\"tour-price\">
                    <span class=\"price-label\">السعر</span>
                    <span class=\"price-value\">${Price}</span>
                </div>
            </div>
            
            <div class=\"tour-card-content\">
                <h3 class=\"tour-title\">${Name}</h3>
                <p class=\"tour-description\">${Description}</p>
                
                <div class=\"tour-details\">
                    <div class=\"tour-detail\">
                        <i class=\"fas fa-clock\"></i>
                        <span>${Duration}</span>
                    </div>
                    <div class=\"tour-detail\">
                        <i class=\"fas fa-map-marker-alt\"></i>
                        <span>${Location}</span>
                    </div>
                </div>
            </div>
            
            <div class=\"tour-card-actions\">
                <a href=\"${whatsappLink}\" 
                   target=\"_blank\" 
                   class=\"btn btn-whatsapp\"
                   onclick=\"event.stopPropagation(); trackWhatsAppClick('${Name}');\">
                    <i class=\"fab fa-whatsapp\"></i>
                    احجز عبر واتساب
                </a>
                <button onclick=\"event.stopPropagation(); askAboutTour('${Name}');\" 
                        class=\"btn btn-secondary\">
                    <i class=\"fas fa-question-circle\"></i>
                    اسأل عن الجولة
                </button>
            </div>
        </div>
    `;
}

// Handle Tour Card Click
function handleTourClick(tourId) {
    console.log('🎯 Tour clicked:', tourId);
    // Could implement tour detail modal here
}

// Track WhatsApp clicks for analytics
function trackWhatsAppClick(tourName) {
    console.log('📱 WhatsApp click:', tourName);
    showSuccessToast(`جاري توجيهك لواتساب للاستفسار عن: ${tourName}`);
}

// Search functionality
function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearBtn');
    
    if (!searchInput) return;
    
    currentSearchTerm = searchInput.value.trim().toLowerCase();
    
    // Show/hide clear button
    if (clearBtn) {
        clearBtn.style.display = currentSearchTerm ? 'block' : 'none';
    }
    
    if (currentSearchTerm === '') {
        renderTours(toursData);
        return;
    }
    
    // Filter tours based on search term
    const filteredTours = toursData.filter(tour => {
        const searchFields = [
            tour.Name || '',
            tour.Description || '',
            tour.Location || '',
            tour.Duration || ''
        ].join(' ').toLowerCase();
        
        return searchFields.includes(currentSearchTerm);
    });
    
    renderTours(filteredTours);
    
    console.log(`🔍 Search: \"${currentSearchTerm}\" - ${filteredTours.length} results`);
}

// Clear search
function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearBtn');
    
    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.style.display = 'none';
    
    currentSearchTerm = '';
    renderTours(toursData);
}

// Chat functionality
async function sendChatMessage() {
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    
    if (!chatInput || !chatInput.value.trim()) {
        showErrorToast('يرجى كتابة رسالة أولاً');
        return;
    }
    
    const message = chatInput.value.trim();
    chatInput.value = '';
    
    // Disable send button during request
    if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<i class=\"fas fa-spinner fa-spin\"></i>';
    }
    
    try {
        // Add user message to chat
        addChatMessage(message, 'user');
        
        // Send to API
        const response = await fetch(`${CONFIG.API_BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                message: message,
                user_id: generateUserId()
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Add bot response with typing delay
        setTimeout(() => {
            addChatMessage(data.reply || 'عذراً، لم أستطع فهم رسالتك', 'bot');
        }, CONFIG.TYPING_DELAY);
        
        console.log('💬 Chat message sent successfully');
        
    } catch (error) {
        console.error('❌ Error sending chat message:', error);
        addChatMessage('عذراً، حدث خطأ تقني. يرجى المحاولة مرة أخرى أو التواصل مباشرة عبر واتساب.', 'bot');
        showErrorToast('فشل في إرسال الرسالة');
    } finally {
        // Re-enable send button
        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<i class=\"fas fa-paper-plane\"></i>';
        }
    }
}

// Handle chat input key press
function handleChatKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendChatMessage();
    }
}

// Add message to chat
function addChatMessage(message, sender) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const messageEl = document.createElement('div');
    messageEl.className = `message ${sender}-message`;
    
    const isBot = sender === 'bot';
    const avatar = isBot ? '<i class=\"fas fa-robot\"></i>' : '<i class=\"fas fa-user\"></i>';
    const senderName = isBot ? 'مساعد العرّاب' : 'أنت';
    
    messageEl.innerHTML = `
        <div class=\"message-content\">
            <div class=\"message-avatar\">
                ${avatar}
            </div>
            <div class=\"message-text\">
                <strong>${senderName}:</strong>
                ${message}
            </div>
            <div class=\"message-time\">
                ${new Date().toLocaleTimeString('ar-EG', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                })}
            </div>
        </div>
    `;
    
    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Save to chat history
    chatHistory.push({ message, sender, timestamp: Date.now() });
}

// Ask about specific tour in chat
function askAboutTour(tourName) {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.value = `أريد معلومات أكثر عن جولة: ${tourName}`;
        scrollToSection('chat');
        chatInput.focus();
    }
}

// Utility Functions
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

function generateUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 9);
}

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

// Loading state management
function showLoading(show = true) {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = show ? 'flex' : 'none';
    }
}

function hideLoading() {
    showLoading(false);
}

// Toast notifications
function showSuccessToast(message) {
    showToast(message, 'success');
}

function showErrorToast(message) {
    showToast(message, 'error');
}

function showToast(message, type) {
    const toastId = type === 'success' ? 'successToast' : 'errorToast';
    const messageId = type === 'success' ? 'successMessage' : 'errorMessage';
    
    const toast = document.getElementById(toastId);
    const messageEl = document.getElementById(messageId);
    
    if (toast && messageEl) {
        messageEl.textContent = message;
        toast.classList.add('show');
        
        // Auto hide after 5 seconds
        setTimeout(() => hideToast(), 5000);
    }
}

function hideToast() {
    document.querySelectorAll('.toast').forEach(toast => {
        toast.classList.remove('show');
    });
}

// Error handling for fetch requests
window.addEventListener('unhandledrejection', function(event) {
    console.error('❌ Unhandled promise rejection:', event.reason);
    showErrorToast('حدث خطأ غير متوقع');
});

// Service Worker registration (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        // Uncomment to enable service worker
        // navigator.serviceWorker.register('/sw.js')
        //     .then(registration => console.log('SW registered'))
        //     .catch(error => console.log('SW registration failed'));
    });
}

console.log('✅ العرّاب Script loaded successfully');
