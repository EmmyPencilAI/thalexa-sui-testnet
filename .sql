-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (zkLogin users)
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sui_address VARCHAR(66) UNIQUE,
    email VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    provider VARCHAR(50),
    zk_proof JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions
CREATE TABLE sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products registry
CREATE TABLE products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id VARCHAR(100) UNIQUE,
    sui_object_id VARCHAR(66) UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    manufacturer VARCHAR(255),
    sku VARCHAR(100),
    production_date DATE,
    price DECIMAL(18, 9),
    metadata JSONB DEFAULT '{}',
    qr_code TEXT,
    verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product verifications
CREATE TABLE verifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    verifier_address VARCHAR(66),
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tx_digest VARCHAR(255),
    location JSONB,
    metadata JSONB DEFAULT '{}'
);

-- Transactions history
CREATE TABLE transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tx_digest VARCHAR(255) UNIQUE,
    type VARCHAR(50),
    amount DECIMAL(18, 9),
    token VARCHAR(50),
    from_address VARCHAR(66),
    to_address VARCHAR(66),
    status VARCHAR(50),
    network VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User notifications
CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50),
    title VARCHAR(255),
    message TEXT,
    read BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Currency pairs and rates
CREATE TABLE currency_rates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    base_currency VARCHAR(10),
    quote_currency VARCHAR(10),
    rate DECIMAL(18, 9),
    source VARCHAR(50),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_sui_address ON users(sui_address);
CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_products_product_id ON products(product_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_tx_digest ON transactions(tx_digest);
CREATE INDEX idx_verifications_product_id ON verifications(product_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);

-- RLS (Row Level Security) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE currency_rates ENABLE ROW LEVEL SECURITY;

-- Policies for users (users can only see their own data)
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Public read for products (for verification)
CREATE POLICY "Public can view products" ON products
    FOR SELECT USING (TRUE);

-- Users can only manage their own products
CREATE POLICY "Users can manage own products" ON products
    FOR ALL USING (auth.uid() = user_id);

-- Similar policies for other tables...