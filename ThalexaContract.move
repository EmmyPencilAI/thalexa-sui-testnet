module thalexa::thalexa_contract {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::url::{Self, Url};
    use sui::event;
    use sui::dynamic_field;
    
    // Errors
    const ENotOwner: u64 = 0;
    const EProductExists: u64 = 1;
    const EProductNotFound: u64 = 2;
    const EInvalidPrice: u64 = 3;
    
    // Structs
    struct Product has key, store {
        id: UID,
        product_id: String,
        name: String,
        description: String,
        manufacturer: String,
        sku: String,
        production_date: u64,
        price: u64,
        metadata: vector<u8>,
        qr_code: Url,
        owner: address,
        verified: bool,
        created_at: u64,
        updated_at: u64
    }
    
    struct ProductRegistry has key {
        id: UID,
        products: dynamic_field<String, ID>,
        product_count: u64
    }
    
    struct ProductCreated has copy, drop {
        product_id: String,
        owner: address,
        created_at: u64,
        price: u64
    }
    
    struct ProductVerified has copy, drop {
        product_id: String,
        verifier: address,
        verified_at: u64
    }
    
    struct ProductTransferred has copy, drop {
        product_id: String,
        from: address,
        to: address,
        transferred_at: u64,
        price: u64
    }
    
    // Initialization
    fun init(ctx: &mut TxContext) {
        let registry = ProductRegistry {
            id: object::new(ctx),
            products: dynamic_field::new(ctx),
            product_count: 0
        };
        
        transfer::share_object(registry);
        
        event::emit(ProductCreated {
            product_id: b"REGISTRY_INIT",
            owner: tx_context::sender(ctx),
            created_at: tx_context::epoch(ctx),
            price: 0
        });
    }
    
    // Register a new product
    public entry fun register_product(
        registry: &mut ProductRegistry,
        product_id: String,
        name: String,
        description: String,
        manufacturer: String,
        sku: String,
        production_date: u64,
        price: u64,
        metadata: vector<u8>,
        qr_code: Url,
        ctx: &mut TxContext
    ) {
        assert!(!exists(registry, copy product_id), EProductExists);
        assert!(price <= 1000000000000, EInvalidPrice); // Max 1M SUI
        
        let product = Product {
            id: object::new(ctx),
            product_id: copy product_id,
            name,
            description,
            manufacturer,
            sku,
            production_date,
            price,
            metadata,
            qr_code,
            owner: tx_context::sender(ctx),
            verified: true,
            created_at: tx_context::epoch(ctx),
            updated_at: tx_context::epoch(ctx)
        };
        
        dynamic_field::add(&mut registry.products, product_id, object::id(&product));
        registry.product_count = registry.product_count + 1;
        
        transfer::transfer(product, tx_context::sender(ctx));
        
        event::emit(ProductCreated {
            product_id,
            owner: tx_context::sender(ctx),
            created_at: tx_context::epoch(ctx),
            price
        });
    }
    
    // Verify a product
    public entry fun verify_product(
        registry: &ProductRegistry,
        product_id: String
    ) {
        assert!(exists(registry, product_id), EProductNotFound);
        
        event::emit(ProductVerified {
            product_id,
            verifier: @0x0, // System verifier
            verified_at: sui::clock::timestamp_ms()
        });
    }
    
    // Transfer product ownership
    public entry fun transfer_product(
        product: &mut Product,
        to: address,
        ctx: &mut TxContext
    ) {
        assert!(product.owner == tx_context::sender(ctx), ENotOwner);
        
        let old_owner = product.owner;
        product.owner = to;
        product.updated_at = tx_context::epoch(ctx);
        
        transfer::transfer(product, to);
        
        event::emit(ProductTransferred {
            product_id: product.product_id,
            from: old_owner,
            to,
            transferred_at: tx_context::epoch(ctx),
            price: product.price
        });
    }
    
    // Get product info
    public fun get_product(
        registry: &ProductRegistry,
        product_id: String
    ): &Product {
        assert!(exists(registry, product_id), EProductNotFound);
        let product_id_obj = dynamic_field::borrow<ID>(&registry.products, product_id);
        let product: &Product = object::borrow(*product_id_obj);
        product
    }
    
    // Check if product exists
    fun exists(registry: &ProductRegistry, product_id: String): bool {
        dynamic_field::exists_(&registry.products, product_id)
    }
    
    // Get total product count
    public fun get_product_count(registry: &ProductRegistry): u64 {
        registry.product_count
    }
}