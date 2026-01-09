// app.js - Thalexa Complete Implementation
class Thalexa {
    constructor() {
        this.state = {
            user: null,
            wallet: null,
            isAuthenticated: false,
            balances: {},
            products: [],
            notifications: [],
            network: 'mainnet',
            theme: 'dark'
        };

        // Configuration
        this.config = {
            supabaseUrl: 'https://your-project.supabase.co',
            supabaseKey: 'your-anon-key',
            suiNetwork: 'mainnet',
            suiRpcUrl: 'https://fullnode.mainnet.sui.io',
            contractAddress: '0xYOUR_CONTRACT_ADDRESS'
        };

        // Initialize
        this.init();
    }

    async init() {
        console.log('🚀 Thalexa Initializing...');

        try {
            // Load state from localStorage
            this.loadState();

            // Initialize theme
            this.initTheme();

            // Initialize Supabase
            await this.initSupabase();

            // Initialize Sui
            await this.initSui();

            // Initialize wallet connection
            await this.initWallet();

            // Initialize navigation
            this.initNavigation();

            // Load initial page
            await this.loadPage(window.location.hash.replace('#', '') || 'home');

            // Hide loading screen
            setTimeout(() => {
                document.getElementById('loading').style.opacity = '0';
                setTimeout(() => {
                    document.getElementById('loading').style.display = 'none';
                }, 300);
            }, 500);

            console.log('✅ Thalexa Ready');

        } catch (error) {
            console.error('Initialization error:', error);
            this.showToast('Failed to initialize app', 'error');
        }
    }

    loadState() {
        try {
            const savedState = localStorage.getItem('thalexa_state');
            if (savedState) {
                const state = JSON.parse(savedState);
                this.state = { ...this.state, ...state };
            }
        } catch (error) {
            console.error('Failed to load state:', error);
        }
    }

    saveState() {
        try {
            localStorage.setItem('thalexa_state', JSON.stringify(this.state));
        } catch (error) {
            console.error('Failed to save state:', error);
        }
    }

    initTheme() {
        const savedTheme = localStorage.getItem('thalexa_theme') || 'dark';
        document.documentElement.setAttribute('data-bs-theme', savedTheme);
        this.state.theme = savedTheme;
    }

    async initSupabase() {
        try {
            // Initialize Supabase client
            this.supabase = supabase.createClient(
                this.config.supabaseUrl,
                this.config.supabaseKey
            );

            // Test connection
            const { data, error } = await this.supabase.from('users').select('count');
            if (error && !error.message.includes('does not exist')) {
                console.warn('Supabase connection test failed:', error.message);
            }

            console.log('✅ Supabase initialized');

        } catch (error) {
            console.error('Supabase initialization error:', error);
            this.supabase = null;
        }
    }

    async initSui() {
        try {
            // Initialize Sui connection
            this.provider = new sui.JsonRpcProvider(
                new sui.Connection({ fullnode: this.config.suiRpcUrl })
            );

            // Test connection
            await this.provider.getLatestCheckpointSequenceNumber();

            console.log('✅ Sui connection established');

        } catch (error) {
            console.error('Sui initialization error:', error);
            this.provider = null;
        }
    }

    async initWallet() {
        try {
            // Check for existing wallet connection
            const savedWallet = localStorage.getItem('thalexa_wallet');
            if (savedWallet) {
                this.state.wallet = JSON.parse(savedWallet);
            }

            // Initialize wallet kit
            this.initWalletKit();

        } catch (error) {
            console.error('Wallet initialization error:', error);
        }
    }

    initWalletKit() {
        // Create wallet connect button
        const walletContainer = document.getElementById('walletConnect');
        if (!walletContainer) return;

        walletContainer.innerHTML = `
            <button class="btn btn-primary" id="connectWalletBtn" onclick="Thalexa.connectWallet()">
                <i class="fas fa-wallet me-2"></i>Connect Wallet
            </button>
        `;
    }

    initNavigation() {
        // Setup hash change listener
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.replace('#', '');
            this.loadPage(hash);
        });

        // Setup periodic updates
        setInterval(() => this.updateBalances(), 30000);
        setInterval(() => this.checkNotifications(), 60000);
    }

    async loadPage(page) {
        console.log(`Loading page: ${page}`);

        const container = document.getElementById('pageContent');
        if (!container) return;

        // Update active nav
        this.updateActiveNav(page);

        // Load page content
        let html = '';

        switch (page) {
            case 'home':
                html = await this.renderHome();
                break;
            case 'dashboard':
                if (!this.state.isAuthenticated) {
                    this.showToast('Please connect wallet first', 'warning');
                    this.loadPage('home');
                    return;
                }
                html = await this.renderDashboard();
                break;
            case 'wallet':
                html = await this.renderWallet();
                break;
            case 'products':
                html = await this.renderProducts();
                break;
            case 'verify':
                html = await this.renderVerify();
                break;
            case 'settings':
                html = await this.renderSettings();
                break;
            default:
                html = await this.renderHome();
        }

        container.innerHTML = html;

        // Initialize page-specific scripts
        setTimeout(() => this.initPageScripts(page), 100);
    }

    updateActiveNav(page) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${page}`) {
                link.classList.add('active');
            }
        });
    }

    async renderHome() {
        return `
            <div class="page-content">
                <!-- Hero Section -->
                <section class="py-5 text-center">
                    <div class="row justify-content-center">
                        <div class="col-lg-8">
                            <h1 class="display-4 fw-bold mb-4">
                                The Blockchain <span class="text-primary">Truth Layer</span>
                            </h1>
                            <p class="lead mb-4">
                                Thalexa provides enterprise-grade product verification and authentication 
                                on the Sui Blockchain. Trust without compromise.
                            </p>
                            <div class="d-grid gap-2 d-md-flex justify-content-center">
                                <button class="btn btn-primary btn-lg px-4 me-md-2" onclick="Thalexa.connectWallet()">
                                    <i class="fas fa-wallet me-2"></i>Connect Wallet
                                </button>
                                <button class="btn btn-outline-light btn-lg px-4" onclick="Thalexa.loadPage('verify')">
                                    <i class="fas fa-qrcode me-2"></i>Verify Product
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
                
                <!-- Features -->
                <section class="py-5">
                    <div class="row g-4">
                        <div class="col-md-4">
                            <div class="card h-100">
                                <div class="card-body text-center p-4">
                                    <div class="mb-3">
                                        <i class="fas fa-shield-alt fa-3x text-primary"></i>
                                    </div>
                                    <h4 class="card-title">zkLogin Security</h4>
                                    <p class="card-text">
                                        Zero-knowledge authentication with maximum privacy and security.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card h-100">
                                <div class="card-body text-center p-4">
                                    <div class="mb-3">
                                        <i class="fas fa-bolt fa-3x text-primary"></i>
                                    </div>
                                    <h4 class="card-title">Instant Verification</h4>
                                    <p class="card-text">
                                        Scan QR codes to instantly verify product authenticity.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card h-100">
                                <div class="card-body text-center p-4">
                                    <div class="mb-3">
                                        <i class="fas fa-wallet fa-3x text-primary"></i>
                                    </div>
                                    <h4 class="card-title">Built-in Wallet</h4>
                                    <p class="card-text">
                                        Secure wallet for SUI and tokens with MetaMask-style interface.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                
                <!-- Stats -->
                <section class="py-5">
                    <div class="row text-center">
                        <div class="col-md-3">
                            <h2 class="fw-bold">10K+</h2>
                            <p class="text-muted">Products Verified</p>
                        </div>
                        <div class="col-md-3">
                            <h2 class="fw-bold">99.9%</h2>
                            <p class="text-muted">Authenticity Rate</p>
                        </div>
                        <div class="col-md-3">
                            <h2 class="fw-bold">$1M+</h2>
                            <p class="text-muted">Transactions</p>
                        </div>
                        <div class="col-md-3">
                            <h2 class="fw-bold">100+</h2>
                            <p class="text-muted">Enterprise Clients</p>
                        </div>
                    </div>
                </section>
            </div>
        `;
    }

    async renderDashboard() {
        return `
            <div class="page-content">
                <h2 class="mb-4">Dashboard</h2>
                
                <!-- Stats Cards -->
                <div class="row mb-4">
                    <div class="col-md-3 mb-3">
                        <div class="card">
                            <div class="card-body">
                                <h6 class="text-muted mb-2">Total Balance</h6>
                                <h3 id="totalBalance">$0.00</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3 mb-3">
                        <div class="card">
                            <div class="card-body">
                                <h6 class="text-muted mb-2">Products</h6>
                                <h3 id="productCount">0</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3 mb-3">
                        <div class="card">
                            <div class="card-body">
                                <h6 class="text-muted mb-2">Verifications</h6>
                                <h3 id="verificationCount">0</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3 mb-3">
                        <div class="card">
                            <div class="card-body">
                                <h6 class="text-muted mb-2">Network</h6>
                                <div class="d-flex align-items-center">
                                    <span class="connection-status connected me-2"></span>
                                    <span>Sui Mainnet</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Quick Actions -->
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0">Quick Actions</h5>
                    </div>
                    <div class="card-body">
                        <div class="row g-2">
                            <div class="col-md-3">
                                <button class="btn btn-outline-light w-100" onclick="Thalexa.showProductModal()">
                                    <i class="fas fa-plus-circle me-2"></i>Add Product
                                </button>
                            </div>
                            <div class="col-md-3">
                                <button class="btn btn-outline-light w-100" onclick="Thalexa.showSendModal()">
                                    <i class="fas fa-paper-plane me-2"></i>Send
                                </button>
                            </div>
                            <div class="col-md-3">
                                <button class="btn btn-outline-light w-100" onclick="Thalexa.showReceiveModal()">
                                    <i class="fas fa-qrcode me-2"></i>Receive
                                </button>
                            </div>
                            <div class="col-md-3">
                                <button class="btn btn-outline-light w-100" onclick="Thalexa.loadPage('verify')">
                                    <i class="fas fa-shield-alt me-2"></i>Verify
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Recent Products -->
                <div class="row">
                    <div class="col-md-7 mb-4">
                        <div class="card h-100">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">Recent Products</h5>
                                <a href="#products" class="btn btn-sm btn-primary" onclick="Thalexa.loadPage('products')">
                                    View All
                                </a>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table">
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th>Status</th>
                                                <th>Created</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody id="recentProducts">
                                            <tr>
                                                <td colspan="4" class="text-center py-4">
                                                    <i class="fas fa-cube fa-2x text-muted mb-2"></i>
                                                    <p class="text-muted mb-0">No products yet</p>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Recent Transactions -->
                    <div class="col-md-5 mb-4">
                        <div class="card h-100">
                            <div class="card-header">
                                <h5 class="mb-0">Recent Transactions</h5>
                            </div>
                            <div class="card-body">
                                <div class="list-group list-group-flush" id="recentTransactions">
                                    <div class="list-group-item">
                                        <div class="d-flex justify-content-between">
                                            <div>
                                                <div class="fw-bold">Received SUI</div>
                                                <small class="text-muted">From: 0x1234...5678</small>
                                            </div>
                                            <div class="text-end">
                                                <div class="text-success">+10.5 SUI</div>
                                                <small class="text-muted">2 hours ago</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async renderWallet() {
        return `
            <div class="page-content">
                <h2 class="mb-4">Wallet</h2>
                
                <!-- Wallet Card -->
                <div class="card wallet-card mb-4">
                    <div class="card-body">
                        <div class="row align-items-center">
                            <div class="col-md-8">
                                <h6 class="mb-2">Total Balance</h6>
                                <h1 class="wallet-balance" id="walletTotalBalance">$0.00</h1>
                                <div class="d-flex align-items-center gap-3">
                                    <span class="text-light">
                                        <i class="fas fa-circle text-success me-1"></i>
                                        Sui Mainnet
                                    </span>
                                    <span class="text-light">
                                        Address: <span id="walletAddress">Not connected</span>
                                    </span>
                                </div>
                            </div>
                            <div class="col-md-4 text-end">
                                <button class="btn btn-light me-2" onclick="Thalexa.showSendModal()">
                                    Send
                                </button>
                                <button class="btn btn-outline-light" onclick="Thalexa.showReceiveModal()">
                                    Receive
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Token Balances -->
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0">Token Balances</h5>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Token</th>
                                        <th>Balance</th>
                                        <th>Value</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody id="tokenBalances">
                                    <tr>
                                        <td>
                                            <div class="d-flex align-items-center">
                                                <div class="avatar bg-primary rounded-circle p-2 me-3">
                                                    <i class="fas fa-coins"></i>
                                                </div>
                                                <div>
                                                    <div class="fw-bold">SUI</div>
                                                    <small class="text-muted">Sui Native Token</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td>0.00</td>
                                        <td>$0.00</td>
                                        <td>
                                            <button class="btn btn-sm btn-outline-primary" onclick="Thalexa.showSendModal()">
                                                Send
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                
                <!-- Transaction History -->
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Transaction History</h5>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Type</th>
                                        <th>Amount</th>
                                        <th>To/From</th>
                                        <th>Date</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody id="transactionHistory">
                                    <tr>
                                        <td colspan="5" class="text-center py-4">
                                            <p class="text-muted mb-0">No transactions yet</p>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async renderProducts() {
        return `
            <div class="page-content">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2>Product Registry</h2>
                    <button class="btn btn-primary" onclick="Thalexa.showProductModal()">
                        <i class="fas fa-plus-circle me-2"></i>Register Product
                    </button>
                </div>
                
                <!-- Products Grid -->
                <div class="row" id="productsGrid">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-body text-center py-5">
                                <i class="fas fa-cube fa-3x text-muted mb-3"></i>
                                <h4>No Products Registered</h4>
                                <p class="text-muted mb-4">Start by registering your first product</p>
                                <button class="btn btn-primary" onclick="Thalexa.showProductModal()">
                                    Register First Product
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async renderVerify() {
        return `
            <div class="page-content">
                <div class="row justify-content-center">
                    <div class="col-lg-8">
                        <div class="card">
                            <div class="card-header text-center">
                                <h3 class="mb-0">Verify Product Authenticity</h3>
                                <p class="text-muted mb-0">Scan QR code to verify on Sui Blockchain</p>
                            </div>
                            <div class="card-body">
                                <!-- QR Scanner -->
                                <div class="text-center mb-4">
                                    <div class="qr-container mb-3">
                                        <div id="qrCode"></div>
                                    </div>
                                    <p class="text-muted">Scan Thalexa product QR code</p>
                                    
                                    <div class="input-group mb-3">
                                        <input type="text" class="form-control" id="productIdInput" 
                                               placeholder="Or enter product ID manually">
                                        <button class="btn btn-primary" onclick="Thalexa.verifyProduct()">
                                            Verify
                                        </button>
                                    </div>
                                </div>
                                
                                <!-- Verification Result -->
                                <div id="verificationResult" style="display: none;">
                                    <div class="card">
                                        <div class="card-body">
                                            <div class="d-flex justify-content-between align-items-start mb-3">
                                                <div>
                                                    <h4 id="productTitle" class="mb-1">Product Name</h4>
                                                    <p id="productId" class="text-muted mb-0"></p>
                                                </div>
                                                <span class="badge bg-success" id="verificationBadge">Verified</span>
                                            </div>
                                            
                                            <div class="row mb-3">
                                                <div class="col-md-6">
                                                    <small class="text-muted">Manufacturer</small>
                                                    <div id="productManufacturer"></div>
                                                </div>
                                                <div class="col-md-6">
                                                    <small class="text-muted">Production Date</small>
                                                    <div id="productDate"></div>
                                                </div>
                                            </div>
                                            
                                            <div class="mb-3">
                                                <small class="text-muted">Description</small>
                                                <div id="productDescription"></div>
                                            </div>
                                            
                                            <div class="row">
                                                <div class="col-md-6">
                                                    <small class="text-muted">Registered On</small>
                                                    <div id="registrationDate"></div>
                                                </div>
                                                <div class="col-md-6">
                                                    <small class="text-muted">Blockchain</small>
                                                    <div>
                                                        <i class="fas fa-link me-1"></i>
                                                        <span>Sui Mainnet</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async renderSettings() {
        return `
            <div class="page-content">
                <h2 class="mb-4">Settings</h2>
                
                <div class="card">
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Network</label>
                                    <select class="form-select" id="networkSelect">
                                        <option value="mainnet">Sui Mainnet</option>
                                        <option value="testnet">Sui Testnet</option>
                                        <option value="devnet">Sui Devnet</option>
                                    </select>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Currency</label>
                                    <select class="form-select" id="currencySelect">
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                        <option value="GBP">GBP</option>
                                        <option value="SUI">SUI</option>
                                    </select>
                                </div>
                                
                                <div class="form-check form-switch mb-3">
                                    <input class="form-check-input" type="checkbox" id="notificationsSwitch" checked>
                                    <label class="form-check-label" for="notificationsSwitch">
                                        Enable notifications
                                    </label>
                                </div>
                                
                                <div class="form-check form-switch mb-3">
                                    <input class="form-check-input" type="checkbox" id="autoLockSwitch" checked>
                                    <label class="form-check-label" for="autoLockSwitch">
                                        Auto-lock wallet (5 min)
                                    </label>
                                </div>
                            </div>
                            
                            <div class="col-md-6">
                                <div class="mb-4">
                                    <h5>Wallet Management</h5>
                                    <div class="d-grid gap-2">
                                        <button class="btn btn-outline-danger" onclick="Thalexa.showSeedModal()">
                                            <i class="fas fa-key me-2"></i>Show Recovery Phrase
                                        </button>
                                        <button class="btn btn-outline-warning" onclick="Thalexa.showImportModal()">
                                            <i class="fas fa-file-import me-2"></i>Import Wallet
                                        </button>
                                        <button class="btn btn-outline-primary" onclick="Thalexa.createNewWallet()">
                                            <i class="fas fa-plus-circle me-2"></i>Create New Wallet
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <h5>Security</h5>
                                    <button class="btn btn-outline-secondary w-100 mb-2" onclick="Thalexa.clearSessions()">
                                        Clear All Sessions
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mt-4">
                            <button class="btn btn-primary" onclick="Thalexa.saveSettings()">
                                Save Settings
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async initPageScripts(page) {
        switch (page) {
            case 'dashboard':
                await this.updateDashboard();
                break;
            case 'wallet':
                await this.updateWallet();
                break;
            case 'verify':
                this.initQRScanner();
                break;
            case 'settings':
                this.initSettings();
                break;
        }
    }

    async updateDashboard() {
        // Update balances
        const totalBalance = document.getElementById('totalBalance');
        if (totalBalance) {
            const balance = await this.getTotalBalance();
            totalBalance.textContent = `$${balance.toFixed(2)}`;
        }

        // Update product count
        const productCount = document.getElementById('productCount');
        if (productCount) {
            productCount.textContent = this.state.products.length;
        }
    }

    async updateWallet() {
        // Update wallet address
        const walletAddress = document.getElementById('walletAddress');
        if (walletAddress && this.state.wallet) {
            walletAddress.textContent = this.formatAddress(this.state.wallet.address);
        }

        // Update total balance
        const walletTotalBalance = document.getElementById('walletTotalBalance');
        if (walletTotalBalance) {
            const balance = await this.getTotalBalance();
            walletTotalBalance.textContent = `$${balance.toFixed(2)}`;
        }
    }

    async getTotalBalance() {
        // Mock balance for now
        return this.state.balances.SUI ? this.state.balances.SUI * 1.5 : 0;
    }

    // Wallet Methods
    static async connectWallet() {
        try {
            // Show wallet selection modal
            Thalexa.showWalletModal();
        } catch (error) {
            console.error('Wallet connection error:', error);
            Thalexa.showToast('Failed to connect wallet', 'error');
        }
    }

    static showWalletModal() {
        const modals = document.getElementById('modalsContainer');
        modals.innerHTML = `
            <div class="modal fade" id="walletModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Connect Wallet</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="d-grid gap-2">
                                <button class="btn btn-outline-light btn-lg text-start" onclick="Thalexa.connectSuiWallet()">
                                    <i class="fab fa-google me-3"></i>
                                    <div>
                                        <div class="fw-bold">Google (zkLogin)</div>
                                        <small class="text-muted">Recommended for new users</small>
                                    </div>
                                </button>
                                
                                <button class="btn btn-outline-light btn-lg text-start" onclick="Thalexa.connectSuiWalletExtension()">
                                    <i class="fas fa-wallet me-3"></i>
                                    <div>
                                        <div class="fw-bold">Sui Wallet</div>
                                        <small class="text-muted">Browser extension</small>
                                    </div>
                                </button>
                                
                                <button class="btn btn-outline-light btn-lg text-start" onclick="Thalexa.connectWithEmail()">
                                    <i class="fas fa-envelope me-3"></i>
                                    <div>
                                        <div class="fw-bold">Email</div>
                                        <small class="text-muted">Magic link authentication</small>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const modal = new bootstrap.Modal(document.getElementById('walletModal'));
        modal.show();
    }

    static async connectSuiWallet() {
        // Mock zkLogin connection
        Thalexa.instance.showToast('Connecting with Google...', 'info');

        setTimeout(() => {
            // Simulate successful connection
            Thalexa.instance.state.user = {
                id: 'user_' + Math.random().toString(36).substr(2, 9),
                email: 'user@example.com',
                name: 'Google User',
                provider: 'google'
            };

            Thalexa.instance.state.wallet = {
                address: '0x' + Math.random().toString(16).substr(2, 40),
                provider: 'zkLogin',
                connected: true
            };

            Thalexa.instance.state.isAuthenticated = true;
            Thalexa.instance.saveState();

            // Update UI
            Thalexa.instance.updateUserUI();

            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('walletModal'));
            if (modal) modal.hide();

            Thalexa.instance.showToast('Successfully connected!', 'success');

            // Load dashboard
            Thalexa.instance.loadPage('dashboard');

        }, 1500);
    }

    static async connectSuiWalletExtension() {
        try {
            // Check if Sui wallet is installed
            if (typeof window.suiWallet === 'undefined') {
                Thalexa.instance.showToast('Please install Sui Wallet extension', 'warning');
                window.open('https://chrome.google.com/webstore/detail/sui-wallet/opcgpfpikagdllpmehafcpipfilcbmhj', '_blank');
                return;
            }

            // Request connection
            const accounts = await window.suiWallet.requestPermissions();
            if (accounts && accounts.length > 0) {
                Thalexa.instance.state.wallet = {
                    address: accounts[0],
                    provider: 'Sui Wallet',
                    connected: true
                };

                Thalexa.instance.state.isAuthenticated = true;
                Thalexa.instance.saveState();

                Thalexa.instance.updateUserUI();

                const modal = bootstrap.Modal.getInstance(document.getElementById('walletModal'));
                if (modal) modal.hide();

                Thalexa.instance.showToast('Sui Wallet connected!', 'success');
                Thalexa.instance.loadPage('dashboard');
            }
        } catch (error) {
            console.error('Sui wallet error:', error);
            Thalexa.instance.showToast('Failed to connect Sui wallet', 'error');
        }
    }

    static async connectWithEmail() {
        const modals = document.getElementById('modalsContainer');
        modals.innerHTML = `
            <div class="modal fade" id="emailModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Connect with Email</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Email Address</label>
                                <input type="email" class="form-control" id="emailInput" 
                                       placeholder="name@example.com">
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" onclick="Thalexa.sendMagicLink()">
                                Send Magic Link
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const modal = new bootstrap.Modal(document.getElementById('emailModal'));
        modal.show();
    }

    static async sendMagicLink() {
        const email = document.getElementById('emailInput')?.value;
        if (!email || !email.includes('@')) {
            Thalexa.instance.showToast('Please enter a valid email', 'error');
            return;
        }

        Thalexa.instance.showToast('Sending magic link...', 'info');

        setTimeout(() => {
            // Simulate magic link
            Thalexa.instance.state.user = {
                id: 'user_' + Math.random().toString(36).substr(2, 9),
                email: email,
                name: email.split('@')[0],
                provider: 'email'
            };

            Thalexa.instance.state.wallet = {
                address: '0x' + Math.random().toString(16).substr(2, 40),
                provider: 'magic_link',
                connected: true
            };

            Thalexa.instance.state.isAuthenticated = true;
            Thalexa.instance.saveState();

            const modal = bootstrap.Modal.getInstance(document.getElementById('emailModal'));
            if (modal) modal.hide();

            Thalexa.instance.updateUserUI();
            Thalexa.instance.showToast('Check your email for the magic link!', 'success');
            Thalexa.instance.loadPage('dashboard');
        }, 2000);
    }

    updateUserUI() {
        // Update wallet button
        const walletBtn = document.getElementById('connectWalletBtn');
        const userMenu = document.getElementById('userMenu');
        const userEmail = document.getElementById('userEmail');

        if (this.state.isAuthenticated && this.state.user) {
            if (walletBtn) walletBtn.style.display = 'none';
            if (userMenu) userMenu.style.display = 'block';
            if (userEmail && this.state.user.email) {
                userEmail.textContent = this.state.user.email;
            }
        } else {
            if (walletBtn) walletBtn.style.display = 'block';
            if (userMenu) userMenu.style.display = 'none';
        }
    }

    // Product Methods
    static showProductModal() {
        if (!Thalexa.instance.state.isAuthenticated) {
            Thalexa.instance.showToast('Please connect wallet first', 'warning');
            Thalexa.connectWallet();
            return;
        }

        const modals = document.getElementById('modalsContainer');
        modals.innerHTML = `
            <div class="modal fade" id="productModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Register New Product</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="productForm">
                                <div class="mb-3">
                                    <label class="form-label">Product Name *</label>
                                    <input type="text" class="form-control" id="productName" required>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Description *</label>
                                    <textarea class="form-control" id="productDescription" rows="3" required></textarea>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label class="form-label">Manufacturer</label>
                                        <input type="text" class="form-control" id="productManufacturer">
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">SKU / Product ID</label>
                                        <input type="text" class="form-control" id="productSku">
                                    </div>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label class="form-label">Production Date</label>
                                        <input type="date" class="form-control" id="productDate">
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Price (SUI)</label>
                                        <input type="number" class="form-control" id="productPrice" step="0.001">
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Metadata (JSON optional)</label>
                                    <textarea class="form-control" id="productMetadata" rows="2" 
                                              placeholder='{"batch": "A123", "location": "Factory 1"}'></textarea>
                                </div>
                                
                                <div class="alert alert-info">
                                    <i class="fas fa-info-circle me-2"></i>
                                    Product will be registered on Sui blockchain with a unique QR code.
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" onclick="Thalexa.registerProduct()">
                                Register on Blockchain
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const modal = new bootstrap.Modal(document.getElementById('productModal'));
        modal.show();
    }

    static async registerProduct() {
        try {
            const productData = {
                name: document.getElementById('productName').value,
                description: document.getElementById('productDescription').value,
                manufacturer: document.getElementById('productManufacturer').value,
                sku: document.getElementById('productSku').value,
                productionDate: document.getElementById('productDate').value,
                price: parseFloat(document.getElementById('productPrice').value) || 0,
                metadata: document.getElementById('productMetadata').value
            };

            if (!productData.name || !productData.description) {
                Thalexa.instance.showToast('Please fill in required fields', 'error');
                return;
            }

            Thalexa.instance.showToast('Registering product on blockchain...', 'info');

            // Simulate blockchain registration
            setTimeout(() => {
                const productId = 'prod_' + Math.random().toString(36).substr(2, 9);
                const product = {
                    id: productId,
                    ...productData,
                    created: new Date().toISOString(),
                    owner: Thalexa.instance.state.wallet?.address,
                    contractAddress: '0x' + Math.random().toString(16).substr(2, 40),
                    verified: true,
                    qrCode: `https://thalexa.com/verify/${productId}`
                };

                // Add to state
                Thalexa.instance.state.products.push(product);
                Thalexa.instance.saveState();

                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
                if (modal) modal.hide();

                // Show success
                Thalexa.instance.showToast('Product registered successfully!', 'success');

                // Generate QR code
                Thalexa.instance.generateProductQR(product);

                // Reload products page if active
                if (window.location.hash === '#products') {
                    Thalexa.instance.loadPage('products');
                }

            }, 2000);

        } catch (error) {
            console.error('Product registration error:', error);
            Thalexa.instance.showToast('Failed to register product', 'error');
        }
    }

    generateProductQR(product) {
        // Generate QR code for product
        const qrData = JSON.stringify({
            productId: product.id,
            contractAddress: product.contractAddress,
            verifyUrl: product.qrCode
        });

        console.log('QR Code data:', qrData);
        Thalexa.instance.showToast('QR code generated for product!', 'success');
    }

    // Verification Methods
    initQRScanner() {
        // Initialize QR code display
        const qrContainer = document.getElementById('qrCode');
        if (qrContainer) {
            qrContainer.innerHTML = `
                <div class="text-center">
                    <i class="fas fa-qrcode fa-4x text-muted mb-3"></i>
                    <p class="text-muted">Scanner ready</p>
                </div>
            `;
        }
    }

    static async verifyProduct() {
        const productId = document.getElementById('productIdInput')?.value.trim();
        if (!productId) {
            Thalexa.instance.showToast('Please enter product ID', 'error');
            return;
        }

        Thalexa.instance.showToast('Verifying product...', 'info');

        // Simulate verification
        setTimeout(() => {
            const mockProduct = {
                id: productId,
                name: 'Verified Product',
                description: 'This product has been verified on the Sui blockchain',
                manufacturer: 'Example Manufacturer',
                productionDate: '2024-01-15',
                created: '2024-01-15',
                verified: true
            };

            Thalexa.instance.displayVerificationResult(mockProduct);
            Thalexa.instance.showToast('Product verified successfully!', 'success');
        }, 1500);
    }

    displayVerificationResult(product) {
        const resultDiv = document.getElementById('verificationResult');
        if (!resultDiv) return;

        resultDiv.style.display = 'block';

        document.getElementById('productTitle').textContent = product.name;
        document.getElementById('productId').textContent = `ID: ${product.id}`;
        document.getElementById('productManufacturer').textContent = product.manufacturer;
        document.getElementById('productDate').textContent = product.productionDate;
        document.getElementById('productDescription').textContent = product.description;
        document.getElementById('registrationDate').textContent = product.created;

        const badge = document.getElementById('verificationBadge');
        badge.className = 'badge ' + (product.verified ? 'bg-success' : 'bg-danger');
        badge.textContent = product.verified ? 'Verified ✓' : 'Invalid';
    }

    // Send/Receive Methods
    static showSendModal() {
        if (!Thalexa.instance.state.isAuthenticated) {
            Thalexa.instance.showToast('Please connect wallet first', 'warning');
            return;
        }

        const modals = document.getElementById('modalsContainer');
        modals.innerHTML = `
            <div class="modal fade" id="sendModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Send Payment</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Recipient Address</label>
                                <input type="text" class="form-control" id="recipientAddress" 
                                       placeholder="0x... or .sui alias">
                            </div>
                            
                            <div class="row mb-3">
                                <div class="col-8">
                                    <label class="form-label">Amount</label>
                                    <input type="number" class="form-control" id="sendAmount" 
                                           step="0.001" placeholder="0.00">
                                </div>
                                <div class="col-4">
                                    <label class="form-label">Token</label>
                                    <select class="form-select" id="sendToken">
                                        <option value="SUI">SUI</option>
                                        <option value="USDC">USDC</option>
                                        <option value="USDT">USDT</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Currency Pair</label>
                                <select class="form-select" id="currencyPair">
                                    <option value="SUI/USD">SUI/USD</option>
                                    <option value="SUI/EUR">SUI/EUR</option>
                                    <option value="SUI/GBP">SUI/GBP</option>
                                    <option value="SUI/BTC">SUI/BTC</option>
                                </select>
                            </div>
                            
                            <div class="transaction-details">
                                <div class="detail-item">
                                    <span>Network Fee</span>
                                    <span>0.001 SUI</span>
                                </div>
                                <div class="detail-item">
                                    <span>Total</span>
                                    <span id="sendTotal">0 SUI</span>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" onclick="Thalexa.sendPayment()">
                                Send Payment
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const modal = new bootstrap.Modal(document.getElementById('sendModal'));
        modal.show();
    }

    static showReceiveModal() {
        if (!Thalexa.instance.state.isAuthenticated) {
            Thalexa.instance.showToast('Please connect wallet first', 'warning');
            return;
        }

        const modals = document.getElementById('modalsContainer');
        modals.innerHTML = `
            <div class="modal fade" id="receiveModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Receive Assets</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body text-center">
                            <div class="qr-container mb-3" id="receiveQr">
                                <!-- QR will be generated here -->
                            </div>
                            
                            <div class="input-group mb-3">
                                <input type="text" class="form-control" id="addressDisplay" 
                                       value="${Thalexa.instance.state.wallet?.address || 'Not connected'}" readonly>
                                <button class="btn btn-outline-secondary" type="button" onclick="Thalexa.copyAddress()">
                                    <i class="fas fa-copy"></i>
                                </button>
                            </div>
                            
                            <div class="d-grid gap-2">
                                <button class="btn btn-outline-primary" onclick="Thalexa.shareAddress()">
                                    <i class="fas fa-share-alt me-2"></i>Share Address
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const modal = new bootstrap.Modal(document.getElementById('receiveModal'));
        modal.show();

        // Generate QR code
        if (Thalexa.instance.state.wallet?.address) {
            setTimeout(() => {
                const qrContainer = document.getElementById('receiveQr');
                if (qrContainer) {
                    qrContainer.innerHTML = '';
                    new QRCode(qrContainer, {
                        text: Thalexa.instance.state.wallet.address,
                        width: 200,
                        height: 200
                    });
                }
            }, 100);
        }
    }

    static async sendPayment() {
        const recipient = document.getElementById('recipientAddress')?.value;
        const amount = parseFloat(document.getElementById('sendAmount')?.value);
        const token = document.getElementById('sendToken')?.value;

        if (!recipient || !amount || amount <= 0) {
            Thalexa.instance.showToast('Please enter valid amount and recipient', 'error');
            return;
        }

        Thalexa.instance.showToast('Sending payment...', 'info');

        // Simulate transaction
        setTimeout(() => {
            const modal = bootstrap.Modal.getInstance(document.getElementById('sendModal'));
            if (modal) modal.hide();

            Thalexa.instance.showToast(`Sent ${amount} ${token} successfully!`, 'success');

            // Add notification
            Thalexa.instance.addNotification({
                type: 'transaction',
                title: 'Payment Sent',
                message: `Sent ${amount} ${token} to ${recipient.substring(0, 12)}...`,
                timestamp: Date.now()
            });
        }, 2000);
    }

    // Utility Methods
    formatAddress(address, length = 6) {
        if (!address) return 'Not connected';
        if (address.length <= length * 2) return address;
        return `${address.substring(0, length)}...${address.substring(address.length - length)}`;
    }

    addNotification(notification) {
        this.state.notifications.unshift({
            ...notification,
            id: Date.now(),
            read: false
        });

        // Update badge
        this.updateNotificationBadge();
        this.saveState();
    }

    updateNotificationBadge() {
        const unreadCount = this.state.notifications.filter(n => !n.read).length;
        // Update badge in UI if exists
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toastId = 'toast-' + Date.now();

        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };

        const toast = document.createElement('div');
        toast.className = `toast`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="toast-header">
                <i class="fas fa-${icons[type]} text-${type} me-2"></i>
                <strong class="me-auto">Thalexa</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        `;

        container.appendChild(toast);

        const bsToast = new bootstrap.Toast(toast, {
            autohide: true,
            delay: 3000
        });
        bsToast.show();

        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    static copyAddress() {
        const address = Thalexa.instance.state.wallet?.address;
        if (address) {
            navigator.clipboard.writeText(address).then(() => {
                Thalexa.instance.showToast('Address copied to clipboard', 'success');
            });
        }
    }

    static shareAddress() {
        const address = Thalexa.instance.state.wallet?.address;
        if (address && navigator.share) {
            navigator.share({
                title: 'My Thalexa Wallet',
                text: `Send crypto to: ${address}`,
                url: window.location.href
            });
        }
    }

    static toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-bs-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-bs-theme', newTheme);
        localStorage.setItem('thalexa_theme', newTheme);
        Thalexa.instance.state.theme = newTheme;
    }

    static logout() {
        if (confirm('Are you sure you want to logout?')) {
            Thalexa.instance.state.isAuthenticated = false;
            Thalexa.instance.state.user = null;
            Thalexa.instance.state.wallet = null;
            Thalexa.instance.saveState();

            Thalexa.instance.updateUserUI();
            Thalexa.instance.showToast('Logged out successfully', 'info');
            Thalexa.instance.loadPage('home');
        }
    }

    // Settings Methods
    initSettings() {
        // Load current settings
        const networkSelect = document.getElementById('networkSelect');
        const currencySelect = document.getElementById('currencySelect');

        if (networkSelect) networkSelect.value = this.state.network;
        if (currencySelect) currencySelect.value = this.state.currency || 'USD';
    }

    static saveSettings() {
        const network = document.getElementById('networkSelect')?.value;
        const currency = document.getElementById('currencySelect')?.value;

        if (network) Thalexa.instance.state.network = network;
        if (currency) Thalexa.instance.state.currency = currency;

        Thalexa.instance.saveState();
        Thalexa.instance.showToast('Settings saved successfully', 'success');
    }

    static showSeedModal() {
        const modals = document.getElementById('modalsContainer');
        modals.innerHTML = `
            <div class="modal fade" id="seedModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">⚠️ Recovery Phrase</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-danger">
                                <i class="fas fa-exclamation-triangle me-2"></i>
                                Never share your recovery phrase! Anyone with these words can steal your assets.
                            </div>
                            <div class="seed-phrase p-3 bg-dark rounded text-center">
                                <code>mock recovery phrase for demonstration purposes only</code>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const modal = new bootstrap.Modal(document.getElementById('seedModal'));
        modal.show();
    }

    static showImportModal() {
        const modals = document.getElementById('modalsContainer');
        modals.innerHTML = `
            <div class="modal fade" id="importModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Import Wallet</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Enter 12-word recovery phrase:</label>
                                <textarea class="form-control" id="seedPhrase" rows="3" 
                                          placeholder="word1 word2 word3 ... word12"></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" onclick="Thalexa.importWallet()">
                                Import Wallet
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const modal = new bootstrap.Modal(document.getElementById('importModal'));
        modal.show();
    }

    static importWallet() {
        const phrase = document.getElementById('seedPhrase')?.value.trim();
        if (!phrase || phrase.split(' ').length !== 12) {
            Thalexa.instance.showToast('Please enter a valid 12-word phrase', 'error');
            return;
        }

        Thalexa.instance.showToast('Importing wallet...', 'info');

        setTimeout(() => {
            Thalexa.instance.state.wallet = {
                address: '0x' + Math.random().toString(16).substr(2, 40),
                provider: 'imported',
                connected: true
            };

            Thalexa.instance.state.isAuthenticated = true;
            Thalexa.instance.saveState();

            const modal = bootstrap.Modal.getInstance(document.getElementById('importModal'));
            if (modal) modal.hide();

            Thalexa.instance.updateUserUI();
            Thalexa.instance.showToast('Wallet imported successfully!', 'success');
            Thalexa.instance.loadPage('dashboard');
        }, 1500);
    }

    static createNewWallet() {
        Thalexa.instance.showToast('Creating new wallet...', 'info');

        setTimeout(() => {
            Thalexa.instance.state.wallet = {
                address: '0x' + Math.random().toString(16).substr(2, 40),
                provider: 'new',
                connected: true
            };

            Thalexa.instance.state.isAuthenticated = true;
            Thalexa.instance.saveState();

            Thalexa.instance.updateUserUI();
            Thalexa.instance.showToast('New wallet created!', 'success');
            Thalexa.instance.loadPage('dashboard');
        }, 1000);
    }

    static clearSessions() {
        if (confirm('Are you sure you want to clear all sessions?')) {
            localStorage.clear();
            location.reload();
        }
    }

    async updateBalances() {
        if (!this.state.wallet?.address) return;

        try {
            // Fetch balances from Sui
            const balances = await this.provider.getAllBalances({
                owner: this.state.wallet.address
            });

            this.state.balances = {};

            for (const balance of balances) {
                if (balance.coinType === '0x2::sui::SUI') {
                    this.state.balances.SUI = parseInt(balance.totalBalance) / 1e9;
                }
            }

            this.saveState();

        } catch (error) {
            console.error('Balance update failed:', error);
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Create global instance
    window.Thalexa = new Thalexa();
    Thalexa.instance = window.Thalexa;

    // Make methods globally available
    window.loadPage = (page) => Thalexa.loadPage(page);
    window.toggleTheme = () => Thalexa.toggleTheme();
    window.logout = () => Thalexa.logout();
});

// Handle hash changes
window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '');
    if (Thalexa && Thalexa.instance) {
        Thalexa.instance.loadPage(hash);
    }
});