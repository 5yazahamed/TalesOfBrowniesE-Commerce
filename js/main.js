// Main page functionality - product selection and click-to-add

let selectedSize = null;
let selectedToppings = [];
let menuConfig = null;

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    menuConfig = getMenuConfig();
    renderSizeCards();
    setupEventListeners();
    updateCartBadge();
    loadBillingSidebar();
});

// Render size selection cards
function renderSizeCards() {
    const sizeCardsContainer = document.getElementById('sizeCards');
    sizeCardsContainer.innerHTML = '';
    
    const sizes = Object.keys(menuConfig.sizes).sort((a, b) => a - b);
    
    sizes.forEach(size => {
        const sizeData = menuConfig.sizes[size];
        const sizeLabel = size === '1000' ? '1KG' : `${size}g`;
        
        const card = document.createElement('div');
        card.className = 'size-card';
        card.dataset.size = size;
        const imageUrl = sizeData.image || 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=400&fit=crop&q=80';
        card.innerHTML = `
            <img src="${imageUrl}" alt="${sizeLabel} Brownie" onerror="this.src='https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=400&fit=crop&q=80'">
            <h4>${sizeLabel}</h4>
            <p class="price">${formatCurrency(sizeData.price)}</p>
        `;
        
        card.addEventListener('click', () => selectSize(size));
        sizeCardsContainer.appendChild(card);
    });
}

// Select size
function selectSize(size) {
    selectedSize = size;
    selectedToppings = [];
    
    // Update active state
    document.querySelectorAll('.size-card').forEach(card => {
        card.classList.remove('active');
    });
    document.querySelector(`[data-size="${size}"]`).classList.add('active');
    
    const sizeData = menuConfig.sizes[size];
    const sizeLabel = size === '1000' ? '1KG' : `${size}g`;
    
    // Show/hide topping selection based on size
    const toppingSelection = document.getElementById('toppingSelection');
    const bulkOrderMessage = document.getElementById('bulkOrderMessage');
    
    if (size === '750' || size === '1000') {
        // Bulk order - show contact message
        toppingSelection.style.display = 'none';
        bulkOrderMessage.style.display = 'block';
        updateSelectedProduct();
    } else {
        // Regular order - show toppings
        toppingSelection.style.display = 'block';
        bulkOrderMessage.style.display = 'none';
        renderToppings();
    }
    
    updateSelectedProduct();
}

// Render toppings
function renderToppings() {
    const toppingGrid = document.getElementById('toppingGrid');
    toppingGrid.innerHTML = '';
    
    const toppings = Object.keys(menuConfig.toppings);
    const size = parseInt(selectedSize);
    
    toppings.forEach(toppingName => {
        const toppingData = menuConfig.toppings[toppingName];
        const price = toppingData[size] || 0;
        
        const toppingCard = document.createElement('div');
        toppingCard.className = 'topping-card';
        toppingCard.dataset.topping = toppingName;
        
        const isSelected = selectedToppings.find(t => t.name === toppingName);
        if (isSelected) {
            toppingCard.classList.add('selected');
        }
        
        const imageUrl = toppingData.image || 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=200&h=200&fit=crop&q=80';
        toppingCard.innerHTML = `
            <img src="${imageUrl}" alt="${toppingName} Brownie" onerror="this.src='https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=200&h=200&fit=crop&q=80'">
            <h5>${toppingName}</h5>
            <p class="price">${formatCurrency(price)}</p>
            <button class="topping-toggle ${isSelected ? 'selected' : ''}" data-topping="${toppingName}">
                ${isSelected ? 'Selected' : 'Select'}
            </button>
        `;
        
        const toggleBtn = toppingCard.querySelector('.topping-toggle');
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleTopping(toppingName, price);
        });
        
        toppingGrid.appendChild(toppingCard);
    });
}

// Toggle topping selection - Only ONE topping allowed
function toggleTopping(toppingName, price) {
    const index = selectedToppings.findIndex(t => t.name === toppingName);
    
    if (index > -1) {
        // Remove if already selected
        selectedToppings.splice(index, 1);
    } else {
        // Clear all and add only this one (single selection)
        selectedToppings = [{ name: toppingName, price: price }];
    }
    
    renderToppings();
    updateSelectedProduct();
}

// Update selected product preview
function updateSelectedProduct() {
    const selectedProduct = document.getElementById('selectedProduct');
    
    if (!selectedSize) {
        selectedProduct.style.display = 'none';
        return;
    }
    
    selectedProduct.style.display = 'block';
    
    const sizeData = menuConfig.sizes[selectedSize];
    const sizeLabel = selectedSize === '1000' ? '1KG' : `${selectedSize}g`;
    const basePrice = sizeData.price;
    
    document.getElementById('selectedProductImage').src = sizeData.image;
    document.getElementById('selectedSize').textContent = sizeLabel;
    
    if (selectedToppings.length > 0) {
        document.getElementById('selectedToppings').textContent = 
            selectedToppings.map(t => t.name).join(', ');
    } else {
        document.getElementById('selectedToppings').textContent = 'No toppings selected';
    }
    
    const total = calculateItemTotal(basePrice, selectedToppings, 1);
    document.getElementById('selectedPrice').textContent = formatCurrency(total);
}

// Setup event listeners
function setupEventListeners() {
    // Add to cart button
    document.getElementById('addToCartBtn').addEventListener('click', addToCart);
    
    // Cart icon click
    const cartIcon = document.getElementById('cartIcon');
    if (cartIcon) {
        cartIcon.addEventListener('click', () => {
            window.location.href = 'cart.html';
        });
    }
    
    // Close sidebar
    const closeSidebar = document.getElementById('closeSidebar');
    if (closeSidebar) {
        closeSidebar.addEventListener('click', () => {
            document.getElementById('billingSidebar').classList.remove('open');
        });
    }
}

// Add item to cart
function addToCart() {
    if (!selectedSize) {
        showToast('Please select a size', 'error');
        return;
    }
    
    const sizeData = menuConfig.sizes[selectedSize];
    const sizeLabel = selectedSize === '1000' ? '1KG' : `${selectedSize}g`;
    const basePrice = sizeData.price;
    
    // For bulk orders (750g/1KG), allow without toppings
    if ((selectedSize === '750' || selectedSize === '1000') && selectedToppings.length === 0) {
        // This is fine for bulk orders
    } else if (selectedSize !== '750' && selectedSize !== '1000' && selectedToppings.length === 0) {
        showToast('Please select one topping for this size', 'error');
        return;
    }
    
    const cart = getCart();
    const item = {
        id: generateId(),
        size: parseInt(selectedSize),
        sizeLabel: sizeLabel,
        basePrice: basePrice,
        image: sizeData.image,
        toppings: [...selectedToppings],
        quantity: 1,
        total: calculateItemTotal(basePrice, selectedToppings, 1)
    };
    
    cart.push(item);
    saveCart(cart);
    
    showToast('Item added to cart!', 'success');
    updateCartBadge();
    loadBillingSidebar();
    
    // Open billing sidebar
    document.getElementById('billingSidebar').classList.add('open');
    
    // Reset selection
    selectedSize = null;
    selectedToppings = [];
    document.getElementById('selectedProduct').style.display = 'none';
    document.getElementById('toppingSelection').style.display = 'none';
    document.getElementById('bulkOrderMessage').style.display = 'none';
    document.querySelectorAll('.size-card').forEach(card => {
        card.classList.remove('active');
    });
}

// Load billing sidebar
function loadBillingSidebar() {
    const cart = getCart();
    const cartItemsList = document.getElementById('cartItemsList');
    
    if (cart.length === 0) {
        cartItemsList.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        document.getElementById('cartTotal').textContent = formatCurrency(0);
        return;
    }
    
    cartItemsList.innerHTML = '';
    let total = 0;
    
    cart.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item-sidebar';
        cartItem.innerHTML = `
            <img src="${item.image}" alt="${item.sizeLabel}" onerror="this.src='https://via.placeholder.com/50x50?text=Brownie'">
            <div class="item-details">
                <h5>${item.sizeLabel}</h5>
                <p class="toppings">${item.toppings.length > 0 ? item.toppings.map(t => t.name).join(', ') : 'No toppings'}</p>
                <p class="price">${formatCurrency(item.total)}</p>
            </div>
            <button class="delete-item" data-id="${item.id}">&times;</button>
        `;
        
        const deleteBtn = cartItem.querySelector('.delete-item');
        deleteBtn.addEventListener('click', () => {
            removeFromCart(item.id);
        });
        
        cartItemsList.appendChild(cartItem);
        total += item.total;
    });
    
    document.getElementById('cartTotal').textContent = formatCurrency(total);
}

// Remove item from cart
function removeFromCart(itemId) {
    const cart = getCart();
    const filteredCart = cart.filter(item => item.id !== itemId);
    saveCart(filteredCart);
    updateCartBadge();
    loadBillingSidebar();
    showToast('Item removed from cart', 'success');
}

