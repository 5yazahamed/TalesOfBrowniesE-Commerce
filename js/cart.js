// Cart page functionality

let menuConfig = null;

// Initialize cart page
document.addEventListener('DOMContentLoaded', () => {
    menuConfig = getMenuConfig();
    renderCart();
    setupEventListeners();
    updateCartBadge();
});

// Customer information storage
let customerInfo = null;

// Setup event listeners
function setupEventListeners() {
    // Clear cart button
    document.getElementById('clearCartBtn').addEventListener('click', clearCart);
    
    // Pay now button - show customer form first
    document.getElementById('payNowBtn').addEventListener('click', showCustomerForm);
    
    // Customer form
    document.getElementById('customerForm').addEventListener('submit', handleCustomerFormSubmit);
    document.getElementById('cancelCustomerForm').addEventListener('click', closeCustomerForm);
    document.getElementById('closeCustomerForm').addEventListener('click', closeCustomerForm);
    
    // Close order modal
    const closeModal = document.getElementById('closeModal');
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            document.getElementById('orderModal').style.display = 'none';
        });
    }
    
    // Cart icon
    const cartIcon = document.getElementById('cartIcon');
    if (cartIcon) {
        cartIcon.addEventListener('click', () => {
            window.location.href = 'cart.html';
        });
    }
}

// Show customer information form
function showCustomerForm() {
    const cart = getCart();
    
    if (cart.length === 0) {
        showToast('Your cart is empty', 'error');
        return;
    }
    
    document.getElementById('customerFormModal').style.display = 'flex';
    document.getElementById('customerForm').reset();
    customerInfo = null;
}

// Close customer form
function closeCustomerForm() {
    document.getElementById('customerFormModal').style.display = 'none';
}

// Handle customer form submission
function handleCustomerFormSubmit(e) {
    e.preventDefault();
    
    customerInfo = {
        name: document.getElementById('customerName').value.trim(),
        phone: document.getElementById('customerPhone').value.trim(),
        address: document.getElementById('customerAddress').value.trim()
    };
    
    // Validate
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    // Close customer form and show payment
    closeCustomerForm();
    showOrderSummary();
}

// Render cart items
function renderCart() {
    const cart = getCart();
    const cartItems = document.getElementById('cartItems');
    const cartActions = document.getElementById('cartActions');
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        cartActions.style.display = 'none';
        return;
    }
    
    cartActions.style.display = 'block';
    cartItems.innerHTML = '';
    
    let grandTotal = 0;
    
    cart.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <img src="${item.image}" alt="${item.sizeLabel}" onerror="this.src='https://via.placeholder.com/100x100?text=Brownie'">
            <div class="item-info">
                <h4>${item.sizeLabel} Brownie</h4>
                <p class="base-price">Base: ${formatCurrency(item.basePrice)}</p>
                ${item.toppings.length > 0 ? `
                    <div class="toppings-list">
                        <strong>Toppings:</strong>
                        ${item.toppings.map(t => `<span>${t.name} (${formatCurrency(t.price)})</span>`).join(', ')}
                    </div>
                ` : '<p>No toppings</p>'}
            </div>
            <div class="item-controls">
                <div class="quantity-controls">
                    <button class="qty-btn" data-id="${item.id}" data-action="decrease">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="qty-btn" data-id="${item.id}" data-action="increase">+</button>
                </div>
                <p class="item-total">${formatCurrency(item.total)}</p>
                <button class="btn-delete-item" data-id="${item.id}" title="Delete item">
                    <span class="delete-icon">🗑️</span> Delete
                </button>
            </div>
        `;
        
        // Quantity controls
        const decreaseBtn = cartItem.querySelector('[data-action="decrease"]');
        const increaseBtn = cartItem.querySelector('[data-action="increase"]');
        
        decreaseBtn.addEventListener('click', () => updateQuantity(item.id, -1));
        increaseBtn.addEventListener('click', () => updateQuantity(item.id, 1));
        
        // Delete button
        const deleteBtn = cartItem.querySelector('.btn-delete-item');
        deleteBtn.addEventListener('click', () => removeFromCart(item.id));
        
        cartItems.appendChild(cartItem);
        grandTotal += item.total;
    });
    
    document.getElementById('grandTotal').textContent = formatCurrency(grandTotal);
}

// Update quantity
function updateQuantity(itemId, change) {
    const cart = getCart();
    const item = cart.find(i => i.id === itemId);
    
    if (!item) return;
    
    item.quantity += change;
    
    if (item.quantity < 1) {
        removeFromCart(itemId);
        return;
    }
    
    item.total = calculateItemTotal(item.basePrice, item.toppings, item.quantity);
    saveCart(cart);
    renderCart();
    updateCartBadge();
    showToast('Cart updated', 'success');
}

// Remove item from cart
function removeFromCart(itemId) {
    const cart = getCart();
    const filteredCart = cart.filter(item => item.id !== itemId);
    saveCart(filteredCart);
    renderCart();
    updateCartBadge();
    showToast('Item removed from cart', 'success');
}

// Clear cart
function clearCart() {
    if (confirm('Are you sure you want to clear your cart?')) {
        saveCart([]);
        renderCart();
        updateCartBadge();
        showToast('Cart cleared', 'success');
    }
}

// Show order summary and generate QR code
function showOrderSummary() {
    const cart = getCart();
    
    if (cart.length === 0) {
        showToast('Your cart is empty', 'error');
        return;
    }
    
    // Check if customer info is available
    if (!customerInfo) {
        showCustomerForm();
        return;
    }
    
    const orderId = generateOrderId();
    const now = new Date();
    const date = now.toLocaleDateString('en-IN');
    const time = now.toLocaleTimeString('en-IN');
    
    let total = 0;
    let itemCount = 0;
    let toppingCount = 0;
    
    const orderDetails = document.getElementById('orderDetails');
    orderDetails.innerHTML = `
        <div class="order-header">
            <h3>Order ID: ${orderId}</h3>
            <p>Date: ${date} | Time: ${time}</p>
            <div class="customer-info-summary">
                <p><strong>Name:</strong> ${customerInfo.name}</p>
                <p><strong>Phone:</strong> ${customerInfo.phone}</p>
                <p><strong>Address:</strong> ${customerInfo.address}</p>
            </div>
        </div>
        <div class="order-items">
            <h4>Items:</h4>
            <ul>
    `;
    
    cart.forEach(item => {
        itemCount += item.quantity;
        toppingCount += item.toppings.length * item.quantity;
        total += item.total;
        
        orderDetails.innerHTML += `
            <li>
                <strong>${item.sizeLabel} Brownie</strong> x${item.quantity}
                <br>Base: ${formatCurrency(item.basePrice)}
                ${item.toppings.length > 0 ? `<br>Toppings: ${item.toppings.map(t => `${t.name} (${formatCurrency(t.price)})`).join(', ')}` : ''}
                <br><strong>Total: ${formatCurrency(item.total)}</strong>
            </li>
        `;
    });
    
    orderDetails.innerHTML += `
            </ul>
        </div>
        <div class="order-total">
            <p><strong>Grand Total: ${formatCurrency(total)}</strong></p>
        </div>
    `;
    
    // Display UPI QR code image - Sameer Sameer
    const qrContainer = document.getElementById('qrCodeContainer');
    // Try multiple possible image paths and formats
    const qrImagePaths = [
        'images/upi-qr-code.jpg',
        'images/upi-qr-code.png',
        'images/upi-qr-code.jpeg',
        './images/upi-qr-code.jpg',
        './images/upi-qr-code.png'
    ];
    
    qrContainer.innerHTML = `
        <h4>Scan to Pay via UPI</h4>
        <p style="margin-bottom: 1rem; color: #666;">Order ID: <strong>${orderId}</strong></p>
        <div class="qr-code-wrapper" id="qrWrapper">
            <img src="${qrImagePaths[0]}" alt="UPI QR Code - Sameer Sameer" id="upiQrCode" class="qr-code-image" 
                 onerror="tryNextQRImage(this)">
        </div>
        <p style="margin-top: 1rem; font-size: 0.9rem; color: #666;">Scan to pay with any UPI app</p>
        <p style="margin-top: 0.5rem; font-size: 0.9rem; color: var(--text-color);"><strong>Amount: ${formatCurrency(total)}</strong></p>
        <button class="btn-primary" id="paymentDoneBtn" style="margin-top: 1.5rem; width: 100%;">I've Completed the Payment</button>
    `;
    
    // Store image paths for fallback
    window.qrImagePaths = qrImagePaths;
    window.currentQRIndex = 0;
    
    // Check if image loads
    const qrImage = document.getElementById('upiQrCode');
    if (qrImage) {
        qrImage.onload = function() {
            console.log('QR code image loaded successfully');
        };
    }
    
    // Hide WhatsApp link initially
    document.getElementById('whatsappLinkContainer').style.display = 'none';
    
    // Show modal
    document.getElementById('orderModal').style.display = 'flex';
    
    // Add event listener for payment done button
    const paymentDoneBtn = document.getElementById('paymentDoneBtn');
    if (paymentDoneBtn) {
        // When clicked, ask for confirmation before sending message and recording sale
        paymentDoneBtn.addEventListener('click', confirmAndSend);
    }
    
    // Store cart data and metadata for WhatsApp link (before clearing)
    window.currentOrderCart = JSON.parse(JSON.stringify(cart));
    window.currentOrderMeta = { orderId, date, time, itemCount, toppingCount, total };
}

// Show WhatsApp link after payment
function showWhatsAppLink(openDirect = false) {
    // Use stored cart data (before clearing)
    const cart = window.currentOrderCart || getCart();
    const orderId = document.querySelector('.order-header h3').textContent.replace('Order ID: ', '');
    
    // Build order summary text
    let orderText = `Order ID: ${orderId}\n\n`;
    orderText += `Customer Details:\n`;
    // Use the global customerInfo captured during checkout (safe access)
    const custName = (typeof customerInfo !== 'undefined' && customerInfo && customerInfo.name) ? customerInfo.name : '';
    const custPhone = (typeof customerInfo !== 'undefined' && customerInfo && customerInfo.phone) ? customerInfo.phone : '';
    const custAddress = (typeof customerInfo !== 'undefined' && customerInfo && customerInfo.address) ? customerInfo.address : '';

    orderText += `Name: ${custName}\n`;
    orderText += `Phone: ${custPhone}\n`;
    orderText += `Address: ${custAddress}\n\n`;
    orderText += `Order Items:\n`;
    
    cart.forEach((item, index) => {
        orderText += `${index + 1}. ${item.sizeLabel} Brownie x${item.quantity}\n`;
        if (item.toppings.length > 0) {
            orderText += `   Toppings: ${item.toppings.map(t => t.name).join(', ')}\n`;
        }
        orderText += `   Price: ${formatCurrency(item.total)}\n\n`;
    });
    
    const total = cart.reduce((sum, item) => sum + item.total, 0);
    orderText += `Total Amount: ${formatCurrency(total)}`;
    
    // Encode message for URL
    const encodedMessage = encodeURIComponent(orderText);
    // Use WhatsApp web API link directed to the shop number so the dynamic message is preserved.
    // Replace the number below if you want messages to go to a different WhatsApp number.
    const shopNumber = '917904101599'; // in international format without + or spaces
    const whatsappLink = `https://api.whatsapp.com/send?phone=${shopNumber}&text=${encodedMessage}`;

    // If caller requested direct open, open the link in a new tab/window and close modal
    if (openDirect) {
        try {
            window.open(whatsappLink, '_blank');
        } catch (err) {
            // Fallback to setting location if open fails
            window.location.href = whatsappLink;
        }

        // Close order modal and clear cart (user already redirected)
        const orderModal = document.getElementById('orderModal');
        if (orderModal) orderModal.style.display = 'none';

        saveCart([]);
        renderCart();
        updateCartBadge();

        return; // don't render the fallback UI when redirecting directly
    }
    
    // Show WhatsApp link container
    const whatsappContainer = document.getElementById('whatsappLinkContainer');
    whatsappContainer.style.display = 'block';
    whatsappContainer.innerHTML = `
        <div class="whatsapp-link-box">
            <h4>📱 Contact Us on WhatsApp</h4>
            <p style="margin-bottom: 1rem; color: #666;">Click the link below to send your order details:</p>
            <a href="${whatsappLink}" target="_blank" class="whatsapp-link-btn">
                <span class="whatsapp-icon">💬</span>
                Open WhatsApp
            </a>
            <p style="margin-top: 1rem; font-size: 0.85rem; color: #666;">Or copy this link:</p>
            <div class="link-copy-box">
                <input type="text" value="${whatsappLink}" id="whatsappLinkInput" readonly>
                <button class="btn-copy-link" id="copyLinkBtn">Copy</button>
            </div>
        </div>
    `;
    
    // Add copy button event listener
    const copyBtn = document.getElementById('copyLinkBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', copyWhatsAppLink);
    }
    
    // Hide payment button
    const paymentDoneBtn = document.getElementById('paymentDoneBtn');
    if (paymentDoneBtn) {
        paymentDoneBtn.style.display = 'none';
    }
    
    // Scroll to WhatsApp link
    whatsappContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Clear cart after showing WhatsApp link
    saveCart([]);
    renderCart();
    updateCartBadge();
}

// Confirm with user, record sale only if they confirm, then open WhatsApp
function confirmAndSend() {
    const meta = window.currentOrderMeta;
    const cart = window.currentOrderCart || getCart();

    if (!meta) {
        showToast('Order data missing. Please try again.', 'error');
        return;
    }

    const confirmMsg = `Open WhatsApp to send your order?\n\nOrder ID: ${meta.orderId}\nAmount: ${formatCurrency(meta.total)}`;
    if (confirm(confirmMsg)) {
        // Record sale now that user confirmed payment
        recordSale(meta.orderId, meta.date, meta.time, cart, meta.itemCount, meta.toppingCount, meta.total, customerInfo);

        // Open WhatsApp with prefilled message and clear cart
        showWhatsAppLink(true);
    } else {
        showToast('Payment confirmation canceled', 'info');
    }
}

// Try next QR image path if current one fails
function tryNextQRImage(imgElement) {
    // Only initialize if qrImagePaths is missing or currentQRIndex is undefined
    if (!window.qrImagePaths || typeof window.currentQRIndex === 'undefined') {
        window.qrImagePaths = ['images/upi-qr-code.jpg', 'images/upi-qr-code.png', 'images/upi-qr-code.jpeg'];
        window.currentQRIndex = 0;
    }
    
    window.currentQRIndex++;
    
    if (window.currentQRIndex < window.qrImagePaths.length) {
        // Try next image path
        imgElement.src = window.qrImagePaths[window.currentQRIndex];
    } else {
        // All paths failed, show error message
        handleQRImageError(imgElement);
    }
}

// Handle QR code image error
function handleQRImageError(imgElement) {
    const wrapper = imgElement.parentElement;
    if (wrapper && !wrapper.querySelector('.qr-error-message')) {
        wrapper.innerHTML = `
            <div class="qr-error-message">
                <p style="color: var(--error-color); font-weight: bold; margin-bottom: 0.5rem; font-size: 1.1rem;">⚠️ QR Code Image Not Found</p>
                <p style="color: #666; font-size: 0.9rem; margin-bottom: 1rem; line-height: 1.6;">
                    Please add your UPI QR code image to the <strong>images</strong> folder with one of these names:<br>
                    • <code>upi-qr-code.jpg</code><br>
                    • <code>upi-qr-code.png</code><br>
                    • <code>upi-qr-code.jpeg</code>
                </p>
                <div style="background: #f5f5f5; padding: 2rem; border-radius: 8px; border: 2px dashed #ccc; margin-top: 1rem;">
                    <p style="color: #666; margin-bottom: 0.5rem; font-weight: 500;">Placeholder for QR Code</p>
                    <div style="width: 250px; height: 250px; margin: 0 auto; background: #fff; border: 2px solid #ddd; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                        <span style="font-size: 4rem;">📱</span>
                    </div>
                    <p style="color: #999; font-size: 0.85rem; margin-top: 1rem;">Your QR code will appear here once the image is added</p>
                </div>
            </div>
        `;
    }
}

// Copy WhatsApp link function
function copyWhatsAppLink() {
    const linkInput = document.getElementById('whatsappLinkInput');
    if (!linkInput) return;
    
    linkInput.select();
    linkInput.setSelectionRange(0, 99999); // For mobile devices
    
    try {
        document.execCommand('copy');
        showToast('Link copied to clipboard!', 'success');
    } catch (err) {
        // Fallback for modern browsers
        navigator.clipboard.writeText(linkInput.value).then(() => {
            showToast('Link copied to clipboard!', 'success');
        }).catch(() => {
            showToast('Failed to copy link', 'error');
        });
    }
}

// Record sale to localStorage
function recordSale(orderId, date, time, items, itemCount, toppingCount, total, customerInfo = null) {
    const sales = getSales();
    
    sales.push({
        orderId: orderId,
        date: date,
        time: time,
        customerInfo: customerInfo || null,
        items: items.map(item => ({
            size: item.sizeLabel,
            basePrice: item.basePrice,
            toppings: item.toppings,
            quantity: item.quantity,
            total: item.total
        })),
        itemCount: itemCount,
        toppingCount: toppingCount,
        total: total
    });
    
    saveSales(sales);
    showToast('Order recorded successfully!', 'success');
}

