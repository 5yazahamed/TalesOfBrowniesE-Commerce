// Admin panel functionality

let menuConfig = null;
let editingSize = null;
let editingTopping = null;

// Admin credentials (client-side). Username and password are fixed per request.
const ADMIN_USERNAME = 'Tales of brownies';
const ADMIN_PASSWORD = 'TOB12345';

// Initialize - check auth then init admin UI
document.addEventListener('DOMContentLoaded', () => {
    const loggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';
    setupLoginFlow(loggedIn);
});

function setupLoginFlow(loggedIn) {
    // Setup login modal handlers
    const loginModal = document.getElementById('adminLoginModal');
    const loginForm = document.getElementById('adminLoginForm');
    const logoutBtn = document.getElementById('logoutBtn');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const u = document.getElementById('adminUsername').value.trim();
            const p = document.getElementById('adminPassword').value;
            if (u === ADMIN_USERNAME && p === ADMIN_PASSWORD) {
                sessionStorage.setItem('adminLoggedIn', 'true');
                if (loginModal) loginModal.style.display = 'none';
                showToast('Logged in as admin', 'success');
                initAdmin();
            } else {
                // Replace login form with a clear message and link to home
                const loginModalBody = document.querySelector('#adminLoginModal .modal-body');
                if (loginModalBody) {
                    loginModalBody.innerHTML = `
                        <p style="color: var(--error-color); font-weight: bold; font-size: 1rem;">PASSWORD INCORRECT. if you want to buy our products go to <a href=\"index.html\">HOME</a></p>
                        <div class="form-actions" style="margin-top:1rem;">
                            <button id="adminDismissBtn" class="btn-secondary">Close</button>
                        </div>
                    `;
                    const dismiss = document.getElementById('adminDismissBtn');
                    if (dismiss) {
                        dismiss.addEventListener('click', () => {
                            const loginModal = document.getElementById('adminLoginModal');
                            if (loginModal) loginModal.style.display = 'none';
                        });
                    }
                }
                // Also show a toast for visibility
                showToast('PASSWORD INCORRECT. if you want to buy our products go to HOME', 'error');
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('adminLoggedIn');
            showToast('Logged out', 'info');
            // reload page to show login modal
            window.location.reload();
        });
    }

    if (loggedIn) {
        if (loginModal) loginModal.style.display = 'none';
        initAdmin();
    } else {
        if (loginModal) loginModal.style.display = 'flex';
        // Hide admin content until logged in
        document.querySelectorAll('.admin-section, .admin-tabs, #sizeModal, #toppingModal').forEach(el => {
            if (el && el.style) el.style.display = 'none';
        });
        if (logoutBtn) logoutBtn.style.display = 'none';
    }
}

// Called once authenticated
function initAdmin() {
    menuConfig = getMenuConfig();
    setupTabs();
    renderSalesReport();
    renderMenuItems();
    setupEventListeners();
    // show admin areas
    document.querySelectorAll('.admin-section, .admin-tabs').forEach(el => { if (el) el.style.display = ''; });
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
}

// Setup tab switching
function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const salesTab = document.getElementById('salesTab');
    const menuTab = document.getElementById('menuTab');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            if (btn.dataset.tab === 'sales') {
                salesTab.style.display = 'block';
                menuTab.style.display = 'none';
                renderSalesReport();
            } else {
                salesTab.style.display = 'none';
                menuTab.style.display = 'block';
                renderMenuItems();
            }
        });
    });
}

// Setup event listeners
function setupEventListeners() {
    // Add size button
    document.getElementById('addSizeBtn').addEventListener('click', () => {
        editingSize = null;
        openSizeModal();
    });
    
    // Add topping button
    document.getElementById('addToppingBtn').addEventListener('click', () => {
        editingTopping = null;
        openToppingModal();
    });
    
    // Save menu button
    document.getElementById('saveMenuBtn').addEventListener('click', saveMenu);
    
    // Reset menu button
    document.getElementById('resetMenuBtn').addEventListener('click', resetMenu);
    
    // Reset filter button
    document.getElementById('resetFilterBtn').addEventListener('click', () => {
        document.getElementById('monthFilter').value = '';
        document.getElementById('yearFilter').value = '';
        renderSalesReport();
    });
    
    // Filter change
    document.getElementById('monthFilter').addEventListener('change', renderSalesReport);
    document.getElementById('yearFilter').addEventListener('change', renderSalesReport);
    
    // Modal close buttons
    document.getElementById('closeSizeModal').addEventListener('click', closeSizeModal);
    document.getElementById('closeToppingModal').addEventListener('click', closeToppingModal);
    document.getElementById('cancelSizeBtn').addEventListener('click', closeSizeModal);
    document.getElementById('cancelToppingBtn').addEventListener('click', closeToppingModal);
    
    // Form submissions
    document.getElementById('sizeForm').addEventListener('submit', handleSizeSubmit);
    document.getElementById('toppingForm').addEventListener('submit', handleToppingSubmit);
}

// Render sales report
function renderSalesReport() {
    const sales = getSales();
    const monthFilter = document.getElementById('monthFilter').value;
    const yearFilter = document.getElementById('yearFilter').value;
    
    // Populate filter options
    populateFilters(sales);
    
    // Filter sales
    let filteredSales = sales;
    if (monthFilter) {
        filteredSales = filteredSales.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate.getMonth() + 1 === parseInt(monthFilter);
        });
    }
    if (yearFilter) {
        filteredSales = filteredSales.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate.getFullYear() === parseInt(yearFilter);
        });
    }
    
    // Calculate stats
    const totalSales = filteredSales.length;
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalBrownies = filteredSales.reduce((sum, sale) => sum + sale.itemCount, 0);
    const totalToppings = filteredSales.reduce((sum, sale) => sum + sale.toppingCount, 0);
    
    // Update stats
    document.getElementById('totalSalesCount').textContent = totalSales;
    document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);
    document.getElementById('totalBrowniesSold').textContent = totalBrownies;
    document.getElementById('totalToppingsSold').textContent = totalToppings;
    
    // Render table
    const tableBody = document.getElementById('salesTableBody');
    if (filteredSales.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="no-data">No sales data available</td></tr>';
        return;
    }
    
    tableBody.innerHTML = '';
    filteredSales.forEach(sale => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${sale.date}</td>
            <td>${sale.orderId}</td>
            <td>${sale.itemCount} brownies, ${sale.toppingCount} toppings</td>
            <td>${formatCurrency(sale.total)}</td>
            <td><button class="btn-danger btn-sm" data-order-id="${sale.orderId}">Delete</button></td>
        `;
        
        const deleteBtn = row.querySelector('.btn-danger');
        deleteBtn.addEventListener('click', () => deleteSale(sale.orderId));
        
        tableBody.appendChild(row);
    });
}

// Populate filter options
function populateFilters(sales) {
    const months = new Set();
    const years = new Set();
    
    sales.forEach(sale => {
        const date = new Date(sale.date);
        months.add(date.getMonth() + 1);
        years.add(date.getFullYear());
    });
    
    const monthSelect = document.getElementById('monthFilter');
    const yearSelect = document.getElementById('yearFilter');
    
    // Populate months
    const monthOptions = Array.from(months).sort((a, b) => a - b);
    monthSelect.innerHTML = '<option value="">All Months</option>';
    monthOptions.forEach(month => {
        const option = document.createElement('option');
        option.value = month;
        option.textContent = new Date(2000, month - 1).toLocaleString('default', { month: 'long' });
        monthSelect.appendChild(option);
    });
    
    // Populate years
    const yearOptions = Array.from(years).sort((a, b) => b - a);
    yearSelect.innerHTML = '<option value="">All Years</option>';
    yearOptions.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    });
}

// Delete sale
function deleteSale(orderId) {
    if (confirm('Are you sure you want to delete this sale record?')) {
        const sales = getSales();
        const filteredSales = sales.filter(sale => sale.orderId !== orderId);
        saveSales(filteredSales);
        renderSalesReport();
        showToast('Sale record deleted', 'success');
    }
}

// Render menu items
function renderMenuItems() {
    renderSizes();
    renderToppings();
}

// Render sizes
function renderSizes() {
    const sizeItems = document.getElementById('sizeItems');
    sizeItems.innerHTML = '';
    
    const sizes = Object.keys(menuConfig.sizes).sort((a, b) => a - b);
    
    sizes.forEach(size => {
        const sizeData = menuConfig.sizes[size];
        const sizeLabel = size === '1000' ? '1KG' : `${size}g`;
        
        const item = document.createElement('div');
        item.className = 'menu-item';
        item.innerHTML = `
            <img src="${sizeData.image}" alt="${sizeLabel}" onerror="this.src='https://via.placeholder.com/100x100?text=Brownie'">
            <div class="item-info">
                <h4>${sizeLabel}</h4>
                <p>Price: ${formatCurrency(sizeData.price)}</p>
                <p class="image-url">Image: ${sizeData.image}</p>
            </div>
            <div class="item-actions">
                <button class="btn-primary btn-sm" data-size="${size}" data-action="edit-size">Edit</button>
                <button class="btn-danger btn-sm" data-size="${size}" data-action="delete-size">Delete</button>
            </div>
        `;
        
        const editBtn = item.querySelector('[data-action="edit-size"]');
        const deleteBtn = item.querySelector('[data-action="delete-size"]');
        
        editBtn.addEventListener('click', () => editSize(size));
        deleteBtn.addEventListener('click', () => deleteSize(size));
        
        sizeItems.appendChild(item);
    });
}

// Render toppings
function renderToppings() {
    const toppingItems = document.getElementById('toppingItems');
    toppingItems.innerHTML = '';
    
    const toppings = Object.keys(menuConfig.toppings);
    
    toppings.forEach(toppingName => {
        const toppingData = menuConfig.toppings[toppingName];
        
        const item = document.createElement('div');
        item.className = 'menu-item';
        item.innerHTML = `
            <div class="item-info">
                <h4>${toppingName}</h4>
                <p>250g: ${formatCurrency(toppingData[250] || 0)} | 500g: ${formatCurrency(toppingData[500] || 0)}</p>
                ${toppingData.image ? `<p class="image-url">Image: ${toppingData.image}</p>` : ''}
            </div>
            <div class="item-actions">
                <button class="btn-primary btn-sm" data-topping="${toppingName}" data-action="edit-topping">Edit</button>
                <button class="btn-danger btn-sm" data-topping="${toppingName}" data-action="delete-topping">Delete</button>
            </div>
        `;
        
        const editBtn = item.querySelector('[data-action="edit-topping"]');
        const deleteBtn = item.querySelector('[data-action="delete-topping"]');
        
        editBtn.addEventListener('click', () => editTopping(toppingName));
        deleteBtn.addEventListener('click', () => deleteTopping(toppingName));
        
        toppingItems.appendChild(item);
    });
}

// Open size modal
function openSizeModal() {
    const modal = document.getElementById('sizeModal');
    const title = document.getElementById('sizeModalTitle');
    const form = document.getElementById('sizeForm');
    
    if (editingSize) {
        title.textContent = 'Edit Size';
        const sizeData = menuConfig.sizes[editingSize];
        document.getElementById('sizeInput').value = editingSize;
        document.getElementById('sizePriceInput').value = sizeData.price;
        document.getElementById('sizeImageInput').value = sizeData.image;
        document.getElementById('sizeInput').disabled = true;
    } else {
        title.textContent = 'Add New Size';
        form.reset();
        document.getElementById('sizeInput').disabled = false;
    }
    
    modal.style.display = 'flex';
}

// Close size modal
function closeSizeModal() {
    document.getElementById('sizeModal').style.display = 'none';
    editingSize = null;
}

// Handle size form submit
function handleSizeSubmit(e) {
    e.preventDefault();
    
    const size = document.getElementById('sizeInput').value;
    const price = parseFloat(document.getElementById('sizePriceInput').value);
    const image = document.getElementById('sizeImageInput').value || `images/brownie-${size}g.jpg`;
    
    if (editingSize) {
        // Update existing
        menuConfig.sizes[editingSize].price = price;
        menuConfig.sizes[editingSize].image = image;
    } else {
        // Add new
        menuConfig.sizes[size] = { price: price, image: image };
    }
    
    saveMenuConfig(menuConfig);
    renderMenuItems();
    closeSizeModal();
    showToast('Size saved successfully', 'success');
}

// Edit size
function editSize(size) {
    editingSize = size;
    openSizeModal();
}

// Delete size
function deleteSize(size) {
    if (confirm(`Are you sure you want to delete ${size === '1000' ? '1KG' : size + 'g'} size?`)) {
        delete menuConfig.sizes[size];
        saveMenuConfig(menuConfig);
        renderMenuItems();
        showToast('Size deleted', 'success');
    }
}

// Open topping modal
function openToppingModal() {
    const modal = document.getElementById('toppingModal');
    const title = document.getElementById('toppingModalTitle');
    const form = document.getElementById('toppingForm');
    
    if (editingTopping) {
        title.textContent = 'Edit Topping';
        const toppingData = menuConfig.toppings[editingTopping];
        document.getElementById('toppingNameInput').value = editingTopping;
        document.getElementById('toppingPrice250Input').value = toppingData[250] || 0;
        document.getElementById('toppingPrice500Input').value = toppingData[500] || 0;
        document.getElementById('toppingImageInput').value = toppingData.image || '';
        document.getElementById('toppingNameInput').disabled = true;
    } else {
        title.textContent = 'Add New Topping';
        form.reset();
        document.getElementById('toppingNameInput').disabled = false;
    }
    
    modal.style.display = 'flex';
}

// Close topping modal
function closeToppingModal() {
    document.getElementById('toppingModal').style.display = 'none';
    editingTopping = null;
}

// Handle topping form submit
function handleToppingSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('toppingNameInput').value;
    const price250 = parseFloat(document.getElementById('toppingPrice250Input').value);
    const price500 = parseFloat(document.getElementById('toppingPrice500Input').value);
    const image = document.getElementById('toppingImageInput').value || '';
    
    if (editingTopping) {
        // Update existing
        menuConfig.toppings[editingTopping][250] = price250;
        menuConfig.toppings[editingTopping][500] = price500;
        menuConfig.toppings[editingTopping].image = image;
    } else {
        // Add new
        menuConfig.toppings[name] = {
            250: price250,
            500: price500,
            image: image
        };
    }
    
    saveMenuConfig(menuConfig);
    renderMenuItems();
    closeToppingModal();
    showToast('Topping saved successfully', 'success');
}

// Edit topping
function editTopping(toppingName) {
    editingTopping = toppingName;
    openToppingModal();
}

// Delete topping
function deleteTopping(toppingName) {
    if (confirm(`Are you sure you want to delete ${toppingName}?`)) {
        delete menuConfig.toppings[toppingName];
        saveMenuConfig(menuConfig);
        renderMenuItems();
        showToast('Topping deleted', 'success');
    }
}

// Save menu
function saveMenu() {
    saveMenuConfig(menuConfig);
    showToast('Menu saved successfully!', 'success');
}

// Reset menu to defaults
function resetMenu() {
    if (confirm('Are you sure you want to reset the menu to default values? This cannot be undone.')) {
        menuConfig = getDefaultMenuConfig();
        saveMenuConfig(menuConfig);
        renderMenuItems();
        showToast('Menu reset to defaults', 'success');
    }
}





