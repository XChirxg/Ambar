// Ambar Tool JS - Header and Navigation Components with Firebase Integration

// Firebase integration - will be initialized by individual pages
let firebaseAuth = null;
let firebaseDb = null;
let currentFirebaseUser = null;

// Initialize global game state if not exists - UPDATED LOGIC
if (!window.GameState) {
    window.GameState = {
        coins: 0,
        stars: 0,
        hearts: 0,
        
        // Initialize from localStorage
        init() {
            this.coins = parseInt(localStorage.getItem('coins')) || 0;
            this.stars = parseInt(localStorage.getItem('stars')) || 0;
            this.hearts = parseInt(localStorage.getItem('hearts')) || 0;
        },
        
        async updateCoins(amount) {
            this.coins = Math.max(0, this.coins + amount);
            localStorage.setItem('coins', this.coins.toString());
            AmbarHeader.refresh();
            
            window.dispatchEvent(new CustomEvent('coinsUpdated', {
                detail: { coins: this.coins, change: amount }
            }));
        },
        
        async updateStars(amount) {
            this.stars = Math.max(0, this.stars + amount);
            localStorage.setItem('stars', this.stars.toString());
            AmbarHeader.refresh();
        },
        
        async updateHearts(amount) {
            this.hearts = Math.max(0, this.hearts + amount);
            localStorage.setItem('hearts', this.hearts.toString());
            AmbarHeader.refresh();
        }
    };
    
    // Initialize GameState with localStorage values
    window.GameState.init();
}

// Ambar Header Component - UPDATED CURRENCY LOGIC
window.AmbarHeader = (function() {
    let config = {
        showCurrencies: ['coins', 'stars', 'hearts'],
        showSettings: false,
        showBackButton: false
    };

    // Currency definitions
    const currencyDefinitions = {
        coins: {
            icon: 'fas fa-coins',
            className: 'currency-coins',
            storageKey: 'coins',
            defaultValue: 0,
            label: 'Coins'
        },
        stars: {
            icon: 'fas fa-star',
            className: 'currency-stars',
            storageKey: 'stars',
            defaultValue: 0,
            label: 'Stars'
        },
        hearts: {
            icon: 'fas fa-heart',
            className: 'currency-hearts',
            storageKey: 'hearts',
            defaultValue: 0,
            label: 'Hearts'
        },
        luck: {
            icon: 'fas fa-clover',
            className: 'currency-luck',
            storageKey: 'luck',
            defaultValue: 0,
            label: 'Luck',
            suffix: '%',
            formatter: (value) => Math.round(value)
        },
        level: {
            icon: 'fas fa-trophy',
            className: 'currency-level',
            storageKey: 'level',
            defaultValue: 1,
            label: 'Level',
            prefix: 'Lv.'
        },
        marks: {
            icon: 'fas fa-brain',
            className: 'currency-marks',
            storageKey: 'knowledgeMarks',
            defaultValue: 0,
            label: 'Marks'
        }
    };

    function getCurrencyValue(currencyType) {
        const def = currencyDefinitions[currencyType];
        if (!def) return 0;

        // Always get from localStorage first
        let storedValue = localStorage.getItem(def.storageKey);
        if (storedValue === null) {
            storedValue = def.defaultValue;
            localStorage.setItem(def.storageKey, storedValue.toString());
        }
        storedValue = parseFloat(storedValue);

        return def.formatter ? def.formatter(storedValue) : Math.floor(storedValue);
    }

    async function setCurrencyValue(currencyType, value) {
        const def = currencyDefinitions[currencyType];
        if (!def) return;

        // Update localStorage immediately
        localStorage.setItem(def.storageKey, value.toString());
        
        // Update GameState if it exists
        if (window.GameState && window.GameState[currencyType] !== undefined) {
            window.GameState[currencyType] = value;
        }

        updateDisplay();

        window.dispatchEvent(new CustomEvent('currencyUpdated', {
            detail: { type: currencyType, value: value }
        }));
    }

    function formatCurrencyDisplay(currencyType, value) {
        const def = currencyDefinitions[currencyType];
        let displayValue = value;
        
        if (value >= 1000000) {
            displayValue = (value / 1000000).toFixed(1) + 'M';
        } else if (value >= 1000) {
            displayValue = (value / 1000).toFixed(1) + 'K';
        } else {
            displayValue = value.toString();
        }
        
        if (def.prefix) displayValue = def.prefix + displayValue;
        if (def.suffix) displayValue = displayValue + def.suffix;
        
        return displayValue;
    }

    function createCurrencyItem(currencyType) {
        const def = currencyDefinitions[currencyType];
        const value = getCurrencyValue(currencyType);
        const displayValue = formatCurrencyDisplay(currencyType, value);
        
        return `
            <div class="currency-item ${def.className} show" 
                 onclick="AmbarHeader.openCurrencyScreen('${currencyType}')"
                 data-currency="${currencyType}"
                 title="${def.label}: ${value}">
                <i class="${def.icon} currency-icon"></i>
                <span class="currency-value">${displayValue}</span>
            </div>
        `;
    }

    function updateDisplay() {
        const currencyBar = document.getElementById('currencyBar');
        if (!currencyBar) return;
        
        let html = '';
        
        // Add currency items
        config.showCurrencies.forEach(currencyType => {
            html += createCurrencyItem(currencyType);
        });
        
        currencyBar.innerHTML = html;
        
        // Update settings button visibility
        updateSettingsVisibility();
    }

    function updateBackButtonVisibility() {
        const backBtn = document.getElementById('backBtn');
        const logo = document.getElementById('ambarLogo');
        
        if (backBtn && logo) {
            if (config.showBackButton) {
                backBtn.classList.add('show');
                logo.classList.add('shifted');
            } else {
                backBtn.classList.remove('show');
                logo.classList.remove('shifted');
            }
        }
    }

    function updateSettingsVisibility() {
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            if (config.showSettings) {
                settingsBtn.classList.add('show');
            } else {
                settingsBtn.classList.remove('show');
            }
        }
    }

    function animateUpdate(currencyType) {
        const element = document.querySelector(`[data-currency="${currencyType}"]`);
        if (element) {
            element.classList.add('updated');
            setTimeout(() => {
                element.classList.remove('updated');
            }, 800);
        }
    }

    // Public API
    return {
        init: function(userConfig = {}) {
            config = { ...config, ...userConfig };
            this.render();
            updateDisplay();
            updateBackButtonVisibility();
            updateSettingsVisibility();
        },

        render: function() {
            // Create header HTML if it doesn't exist
            let header = document.getElementById('ambarHeader');
            if (!header) {
                header = document.createElement('div');
                header.id = 'ambarHeader';
                header.className = 'ambar-header';
                document.body.insertBefore(header, document.body.firstChild);
            }

            header.innerHTML = `
                <div class="header-left">
                    <button class="back-btn" id="backBtn" onclick="AmbarHeader.goBack()">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <div class="ambar-logo" id="ambarLogo" onclick="AmbarHeader.navigateHome()">Ambar</div>
                </div>
                <div class="currency-bar" id="currencyBar">
                    <!-- Currency items will be populated by JavaScript -->
                </div>
                <button class="settings-btn" id="settingsBtn" onclick="AmbarHeader.openSettings()">
                    <i class="fas fa-cog"></i>
                </button>
            `;
        },

        showBackButton: function() {
            config.showBackButton = true;
            updateBackButtonVisibility();
        },

        hideBackButton: function() {
            config.showBackButton = false;
            updateBackButtonVisibility();
        },

        showSettings: function() {
            config.showSettings = true;
            updateSettingsVisibility();
        },

        hideSettings: function() {
            config.showSettings = false;
            updateSettingsVisibility();
        },

        updateCurrency: async function(currencyType, change) {
            const currentValue = getCurrencyValue(currencyType);
            const newValue = Math.max(0, currentValue + change);
            await setCurrencyValue(currencyType, newValue);
            animateUpdate(currencyType);
        },

        setCurrency: async function(currencyType, value) {
            await setCurrencyValue(currencyType, Math.max(0, value));
            animateUpdate(currencyType);
        },

        getCurrency: function(currencyType) {
            return getCurrencyValue(currencyType);
        },

        refresh: function() {
            updateDisplay();
            updateBackButtonVisibility();
            updateSettingsVisibility();
        },

        // Set Firebase references (called by pages that use Firebase)
        setFirebase: function(auth, db, user) {
            firebaseAuth = auth;
            firebaseDb = db;
            currentFirebaseUser = user;
        },

        // Navigation handlers (can be customized)
        navigateHome: function() {
            window.location.href = 'home.html';
        },

        goBack: function() {
            window.history.back();
        },

        openCurrencyScreen: function(currencyType) {
            window.location.href = 'achievement.html';
        },

        openSettings: function() {
            window.location.href = 'settings.html';
        }
    };
})();

// Bottom Navigation Component
window.AmbarNavigation = (function() {
    let currentPage = 'home';

    function createNavigation() {
        let nav = document.getElementById('bottomNav');
        if (!nav) {
            nav = document.createElement('div');
            nav.id = 'bottomNav';
            nav.className = 'bottom-nav';
            document.body.appendChild(nav);
        }

        nav.innerHTML = `
            <button class="nav-btn" onclick="AmbarNavigation.navigateTo('home')" data-page="home">
                <i class="fas fa-home"></i>
                <span>Home</span>
            </button>
            <button class="nav-btn" onclick="AmbarNavigation.navigateTo('games')" data-page="games">
                <i class="fas fa-gamepad"></i>
                <span>Games</span>
            </button>
            <button class="nav-btn" onclick="AmbarNavigation.navigateTo('store')" data-page="store">
                <i class="fas fa-store"></i>
                <span>Store</span>
            </button>
            <button class="nav-btn" onclick="AmbarNavigation.navigateTo('profile')" data-page="profile">
                <i class="fas fa-user"></i>
                <span>Profile</span>
            </button>
        `;
    }

    function updateActiveButton() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.page === currentPage) {
                btn.classList.add('active');
            }
        });
    }

    return {
        init: function(activePage = 'home') {
            currentPage = activePage;
            createNavigation();
            updateActiveButton();
        },

        setActivePage: function(page) {
            currentPage = page;
            updateActiveButton();
        },

        navigateTo: function(screen) {
            currentPage = screen;
            updateActiveButton();

            const pages = {
                'home': 'home.html',
                'games': 'game.html',
                'store': 'store.html',
                'profile': 'profile.html'
            };

            if (pages[screen]) {
                window.location.href = pages[screen];
            }
        }
    };
})();

// Background Particles Component
window.AmbarParticles = (function() {
    return {
        init: function() {
            // Check if particles already exist
            if (document.querySelector('.bg-particles')) return;

            const particlesContainer = document.createElement('div');
            particlesContainer.className = 'bg-particles';
            
            // Create 5 particles
            for (let i = 0; i < 5; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particlesContainer.appendChild(particle);
            }
            
            // Insert at the beginning of body
            document.body.insertBefore(particlesContainer, document.body.firstChild);
        }
    };
})();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize particles
    AmbarParticles.init();
    
    // Determine current page from filename or a data attribute
    const currentPath = window.location.pathname;
    let currentPage = 'home';
    
    if (currentPath.includes('game')) currentPage = 'games';
    else if (currentPath.includes('store')) currentPage = 'store';
    else if (currentPath.includes('profile')) currentPage = 'profile';
    
    // Initialize navigation
    AmbarNavigation.init(currentPage);
    
    // Initialize header with default config (can be overridden)
        AmbarHeader.init({
            showCurrencies: ['coins', 'stars', 'hearts'],
            showSettings: true,   // ✅ Enable the settings button
            showBackButton: false
        });

});

// Utility function to add ripple effects
function addRippleEffect(element, event) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(2);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
    
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// Add ripple effects to clickable elements
document.addEventListener('click', function(e) {
    if (e.target.closest('.nav-btn') || e.target.closest('.currency-item')) {
        const element = e.target.closest('.nav-btn, .currency-item');
        addRippleEffect(element, e);
    }
});