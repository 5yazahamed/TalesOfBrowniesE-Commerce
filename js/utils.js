// Utility functions for localStorage and common operations

// Get cart from localStorage
function getCart() {
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : [];
}

// Save cart to localStorage
function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Get sales from localStorage
function getSales() {
    const sales = localStorage.getItem('sales');
    return sales ? JSON.parse(sales) : [];
}

// Save sales to localStorage
function saveSales(sales) {
    localStorage.setItem('sales', JSON.stringify(sales));
}

// Get menu config from localStorage
function getMenuConfig() {
    const config = localStorage.getItem('menuConfig');
    if (config) {
        return JSON.parse(config);
    }
    // Return default menu config
    return getDefaultMenuConfig();
}

// Save menu config to localStorage
function saveMenuConfig(config) {
    localStorage.setItem('menuConfig', JSON.stringify(config));
}

// Get default menu configuration with different images for each topping
function getDefaultMenuConfig() {
    // Category images - keep first one, change others
    const brownie250g = 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=400&fit=crop&q=80';
    const brownie500g = 'https://images.unsplash.com/photo-1607920591413-4ec007e70023?w=400&h=400&fit=crop&q=80';
    const brownie750g = 'https://images.unsplash.com/photo-1606312619070-d48b4bc98fb8?w=400&h=400&fit=crop&q=80';
    const brownie1kg = 'https://images.unsplash.com/photo-1606312619070-d48b4bc98fb8?w=400&h=400&fit=crop&q=80';
    
    // Different images for each topping
    return {
        sizes: {
            250: { price: 249, image: brownie250g },
            500: { price: 499, image: brownie500g },
            750: { price: 749, image: brownie750g },
            1000: { price: 999, image: brownie1kg }
        },
        toppings: {
            'Dark Chocolate': { 250: 30, 500: 60, image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=200&h=200&fit=crop&q=80' },
            'White Chocolate': { 250: 35, 500: 70, image: 'https://images.unsplash.com/photo-1606312619070-d48b4bc98fb8?w=200&h=200&fit=crop&q=80' },
            'Milk Chocolate': { 250: 35, 500: 70, image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=200&h=200&fit=crop&q=80' },
            'Double Chocolate': { 250: 45, 500: 90, image: 'https://images.unsplash.com/photo-1606312619070-d48b4bc98fb8?w=200&h=200&fit=crop&q=80' },
            'Triple Chocolate': { 250: 45, 500: 90, image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=200&h=200&fit=crop&q=80' },
            'Mixed Nuts': { 250: 35, 500: 70, image: 'https://images.unsplash.com/photo-1607920591413-4ec007e70023?w=200&h=200&fit=crop&q=80' },
            'Walnuts': { 250: 60, 500: 120, image: 'https://images.unsplash.com/photo-1607920591413-4ec007e70023?w=200&h=200&fit=crop&q=80' },
            'Almonds': { 250: 30, 500: 60, image: 'https://images.unsplash.com/photo-1607920591413-4ec007e70023?w=200&h=200&fit=crop&q=80' },
            'Oreo': { 250: 20, 500: 40, image: 'https://images.unsplash.com/photo-1606312619070-d48b4bc98fb8?w=200&h=200&fit=crop&q=80' },
            'Nutella': { 250: 60, 500: 120, image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=200&h=200&fit=crop&q=80' },
            'Biscoff': { 250: 60, 500: 120, image: 'https://images.unsplash.com/photo-1606312619070-d48b4bc98fb8?w=200&h=200&fit=crop&q=80' },
            'Hazelnut': { 250: 55, 500: 110, image: 'https://images.unsplash.com/photo-1607920591413-4ec007e70023?w=200&h=200&fit=crop&q=80' }
        }
    };
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Generate order ID
function generateOrderId() {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, '');
    const time = now.toTimeString().slice(0, 8).replace(/:/g, '');
    return `TOB-${date}-${time}`;
}

// Format currency
function formatCurrency(amount) {
    return `Rs. ${amount.toLocaleString('en-IN')}`;
}

// Update cart badge
function updateCartBadge() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const badge = document.getElementById('cartBadge');
    if (badge) {
        badge.textContent = totalItems;
        badge.style.display = totalItems > 0 ? 'block' : 'none';
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.style.display = 'block';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// Calculate item total
function calculateItemTotal(basePrice, toppings, quantity) {
    const toppingsTotal = toppings.reduce((sum, topping) => sum + topping.price, 0);
    return (basePrice + toppingsTotal) * quantity;
}

// Initialize cart badge on page load
document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
});

