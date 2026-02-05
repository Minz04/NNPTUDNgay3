let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
let perPage = 10;
let sortState = {
	title: null, // 'asc' | 'desc' | null
	price: null  // 'asc' | 'desc' | null
};

// --- API HANDLING ---

async function loadProducts() {
	const tableBody = document.querySelector('#products-table tbody');
	tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-5"><div class="spinner-border text-primary"></div></td></tr>';

	try {
		const res = await fetch('https://api.escuelajs.co/api/v1/products');
		if (!res.ok) throw new Error("API Error");

		allProducts = await res.json();
		filteredProducts = [...allProducts];
		currentPage = 1;
		renderProducts();
	} catch (error) {
		console.error(error);
		tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-4">Error loading products. Check API or Network.</td></tr>`;
	}
}

// --- RENDERING ---

function renderProducts() {
	const tableBody = document.querySelector('#products-table tbody');
	tableBody.innerHTML = '';

	if (!filteredProducts.length) {
		tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4">No products found</td></tr>';
		renderPagination(1, 1);
		return;
	}

	const startIdx = (currentPage - 1) * perPage;
	const endIdx = startIdx + perPage;
	const pageProducts = filteredProducts.slice(startIdx, endIdx);

	pageProducts.forEach(product => {
		const row = document.createElement('tr');
		row.style.cursor = 'pointer';

		let imgUrl = (Array.isArray(product.images) && product.images.length > 0) ? product.images[0] : '';
		if (imgUrl && imgUrl.startsWith('["')) {
			try { imgUrl = JSON.parse(imgUrl)[0]; } catch (e) { }
		}

		row.innerHTML = `
            <td class="ps-3 fw-medium text-secondary">#${product.id}</td>
            <td class="fw-bold text-dark">${product.title}</td>
            <td class="text-success fw-bold">$${product.price}</td>
            <td><span class="badge bg-light text-dark border">${product.category?.name || 'Uncategorized'}</span></td>
            <td>
                ${imgUrl ? `<img src="${imgUrl}" class="rounded-3 border" style="width:40px;height:40px;object-fit:cover;" onerror="this.style.display='none'">` : ''}
            </td>
        `;

		// SỰ KIỆN: Click -> Mở Modal chi tiết
		row.onclick = () => showProductModal(product);

		// SỰ KIỆN: Hover -> Hiện Description trôi
		row.addEventListener('mouseenter', (e) => showFloatingPreview(e, product));
		row.addEventListener('mouseleave', hideFloatingPreview);
		// Cập nhật vị trí khi di chuột trong hàng
		row.addEventListener('mousemove', (e) => {
			const floatingPreview = document.getElementById('floating-preview');
			if (floatingPreview.style.display === 'block') {
				floatingPreview.style.top = `${e.clientY + 15}px`;
				floatingPreview.style.left = `${e.clientX + 15}px`;
			}
		});

		tableBody.appendChild(row);
	});

	const totalPages = Math.ceil(filteredProducts.length / perPage) || 1;
	renderPagination(currentPage, totalPages);
	updateSortIcons();
}

function updateSortIcons() {
	const sortTitleIcon = document.getElementById('sort-title-icon');
	const sortPriceIcon = document.getElementById('sort-price-icon');

	if (sortTitleIcon) sortTitleIcon.className = 'bi bi-arrow-down-up ms-1 text-muted opacity-25';
	if (sortPriceIcon) sortPriceIcon.className = 'bi bi-arrow-down-up ms-1 text-muted opacity-25';

	if (sortState.title) {
		sortTitleIcon.className = sortState.title === 'asc' ? 'bi bi-arrow-up ms-1 text-primary' : 'bi bi-arrow-down ms-1 text-primary';
	}
	if (sortState.price) {
		sortPriceIcon.className = sortState.price === 'asc' ? 'bi bi-arrow-up ms-1 text-primary' : 'bi bi-arrow-down ms-1 text-primary';
	}
}

function renderPagination(current, total) {
	const pagination = document.getElementById('pagination');
	if (!pagination) return;
	pagination.innerHTML = '';

	const createPageItem = (page, text, isActive = false, isDisabled = false) => {
		const li = document.createElement('li');
		li.className = `page-item ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`;
		li.innerHTML = `<a class="page-link" href="#">${text}</a>`;
		if (!isDisabled && !isActive) {
			li.onclick = (e) => {
				e.preventDefault();
				currentPage = page;
				renderProducts();
			};
		}
		return li;
	};

	pagination.appendChild(createPageItem(current - 1, '&laquo;', false, current === 1));

	let startPage = Math.max(1, current - 2);
	let endPage = Math.min(total, current + 2);

	if (startPage > 1) {
		pagination.appendChild(createPageItem(1, '1'));
		if (startPage > 2) pagination.appendChild(createPageItem(0, '...', false, true));
	}

	for (let i = startPage; i <= endPage; i++) {
		pagination.appendChild(createPageItem(i, i, i === current));
	}

	if (endPage < total) {
		if (endPage < total - 1) pagination.appendChild(createPageItem(0, '...', false, true));
		pagination.appendChild(createPageItem(total, total));
	}

	pagination.appendChild(createPageItem(current + 1, '&raquo;', false, current === total));
}

// --- FLOATING PREVIEW (Description) ---

const floatingPreview = document.getElementById('floating-preview');
const floatingPreviewImage = document.getElementById('floating-preview-image');
const floatingPreviewDescription = document.getElementById('floating-preview-description');

function showFloatingPreview(event, product) {
	// Xử lý ảnh
	let imgUrl = (product.images && product.images.length > 0) ? product.images[0] : '';
	if (imgUrl && imgUrl.startsWith('["')) { try { imgUrl = JSON.parse(imgUrl)[0]; } catch (e) { } }

	floatingPreviewImage.src = imgUrl;
	floatingPreviewImage.style.display = imgUrl ? 'block' : 'none'; // Ẩn ảnh nếu lỗi

	// HIỂN THỊ DESCRIPTION thay vì Title
	floatingPreviewDescription.textContent = product.description || 'No description available';

	// Position
	floatingPreview.style.top = `${event.clientY + 15}px`;
	floatingPreview.style.left = `${event.clientX + 15}px`;
	floatingPreview.style.display = 'block';
}

function hideFloatingPreview() {
	if (floatingPreview) floatingPreview.style.display = 'none';
}


// --- MODAL & ACTIONS ---

function showCreateProductModal() {
	document.getElementById('create-product-form').reset();
	document.getElementById('create-image-preview').src = '';
	document.getElementById('create-image-preview').style.display = 'none';
	const modal = new window.bootstrap.Modal(document.getElementById('createProductModal'));
	modal.show();
}

function handleCreateImageInput() {
	const url = document.getElementById('create-image').value;
	const imgPreview = document.getElementById('create-image-preview');
	if (url) {
		imgPreview.src = url;
		imgPreview.style.display = 'block';
	} else {
		imgPreview.style.display = 'none';
	}
}

async function handleCreateSave() {
	const title = document.getElementById('create-title').value.trim();
	const price = parseFloat(document.getElementById('create-price').value);
	const categoryId = parseInt(document.getElementById('create-category-id').value, 10);
	const description = document.getElementById('create-description').value.trim();
	const image = document.getElementById('create-image').value.trim();

	if (!title || isNaN(price) || isNaN(categoryId) || !image) {
		alert('Please fill all required fields correctly!');
		return;
	}

	const btn = document.getElementById('create-save-btn');
	const originalText = btn.textContent;
	btn.textContent = 'Saving...';
	btn.disabled = true;

	try {
		const res = await fetch('https://api.escuelajs.co/api/v1/products', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ title, price, description, categoryId, images: [image] })
		});

		if (!res.ok) {
			const err = await res.json();
			throw new Error(err.message || 'Failed to create');
		}

		const created = await res.json();
		allProducts.unshift(created);
		document.getElementById('search-title').value = '';
		filteredProducts = allProducts;
		renderProducts();

		const modalEl = document.getElementById('createProductModal');
		const modal = window.bootstrap.Modal.getInstance(modalEl);
		if (modal) modal.hide();

		alert('Product created successfully!');
	} catch (err) {
		alert('Error: ' + err.message);
	} finally {
		btn.textContent = originalText;
		btn.disabled = false;
	}
}

// Show Edit Modal (View Details)
function showProductModal(product) {
	document.getElementById('modal-product-id').value = product.id;
	document.getElementById('modal-title').value = product.title || '';
	document.getElementById('modal-price').value = product.price || '';
	document.getElementById('modal-category').value = product.category?.name || 'N/A';
	document.getElementById('modal-description').value = product.description || '';

	let imgUrl = (product.images && product.images.length > 0) ? product.images[0] : '';
	if (imgUrl && imgUrl.startsWith('["')) { try { imgUrl = JSON.parse(imgUrl)[0]; } catch (e) { } }

	document.getElementById('modal-image').value = imgUrl;
	document.getElementById('modal-image-preview').src = imgUrl;

	const modal = new window.bootstrap.Modal(document.getElementById('productModal'));
	modal.show();
}

function handleModalImageInput() {
	const url = document.getElementById('modal-image').value;
	document.getElementById('modal-image-preview').src = url;
}

async function handleModalEditSave() {
	const id = document.getElementById('modal-product-id').value;
	const title = document.getElementById('modal-title').value.trim();
	const price = parseFloat(document.getElementById('modal-price').value);
	const description = document.getElementById('modal-description').value.trim();
	const image = document.getElementById('modal-image').value.trim();

	if (!title || isNaN(price)) {
		alert('Title and Price are required!');
		return;
	}

	try {
		const res = await fetch(`https://api.escuelajs.co/api/v1/products/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ title, price, description, images: [image] })
		});

		if (!res.ok) throw new Error('Update failed');
		const updated = await res.json();

		const idx = allProducts.findIndex(p => p.id == id);
		if (idx !== -1) allProducts[idx] = { ...allProducts[idx], ...updated };

		const fIdx = filteredProducts.findIndex(p => p.id == id);
		if (fIdx !== -1) filteredProducts[fIdx] = { ...filteredProducts[fIdx], ...updated };

		renderProducts();

		const modalEl = document.getElementById('productModal');
		const modal = window.bootstrap.Modal.getInstance(modalEl);
		if (modal) modal.hide();

		alert('Product updated successfully!');
	} catch (err) {
		console.error(err);
		alert('Update failed! Check console.');
	}
}

// --- UTILS ---

function sortProducts(key) {
	if (sortState[key] === 'asc') sortState[key] = 'desc';
	else sortState[key] = 'asc';

	if (key === 'title') sortState.price = null;
	if (key === 'price') sortState.title = null;

	filteredProducts.sort((a, b) => {
		let valA = a[key];
		let valB = b[key];
		if (key === 'title') {
			valA = (valA || '').toLowerCase();
			valB = (valB || '').toLowerCase();
			if (valA < valB) return sortState[key] === 'asc' ? -1 : 1;
			if (valA > valB) return sortState[key] === 'asc' ? 1 : -1;
			return 0;
		} else {
			return sortState[key] === 'asc' ? valA - valB : valB - valA;
		}
	});

	currentPage = 1;
	renderProducts();
}

function handleSearch() {
	const query = document.getElementById('search-title').value.toLowerCase();
	filteredProducts = allProducts.filter(p => p.title.toLowerCase().includes(query));
	currentPage = 1;
	renderProducts();
}

function handlePerPageChange() {
	perPage = parseInt(document.getElementById('per-page').value);
	currentPage = 1;
	renderProducts();
}

function exportCurrentViewToCSV() {
	if (!filteredProducts.length) return;
	const startIdx = (currentPage - 1) * perPage;
	const endIdx = startIdx + perPage;
	const dataToExport = filteredProducts.slice(startIdx, endIdx);

	const header = ['ID', 'Title', 'Price', 'Category', 'Description', 'Image'];
	const rows = [header];

	dataToExport.forEach(p => {
		rows.push([
			p.id,
			`"${(p.title || '').replace(/"/g, '""')}"`,
			p.price,
			`"${(p.category?.name || '').replace(/"/g, '""')}"`,
			`"${(p.description || '').replace(/"/g, '""')}"`,
			(p.images?.[0] || '')
		]);
	});

	const csvContent = rows.map(r => r.join(',')).join('\r\n');
	const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = 'products_export.csv';
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
}

// INIT
window.addEventListener('DOMContentLoaded', () => {
	loadProducts();

	document.getElementById('search-title').addEventListener('input', handleSearch);
	document.getElementById('per-page').addEventListener('change', handlePerPageChange);
	document.getElementById('export-csv').addEventListener('click', exportCurrentViewToCSV);

	const sortTitleBtn = document.getElementById('sort-title');
	if (sortTitleBtn) sortTitleBtn.addEventListener('click', () => sortProducts('title'));

	const sortPriceBtn = document.getElementById('sort-price');
	if (sortPriceBtn) sortPriceBtn.addEventListener('click', () => sortProducts('price'));

	document.getElementById('create-product-btn').addEventListener('click', showCreateProductModal);
	document.getElementById('create-image').addEventListener('input', handleCreateImageInput);
	document.getElementById('create-save-btn').addEventListener('click', handleCreateSave);

	document.getElementById('modal-image').addEventListener('input', handleModalImageInput);
	document.getElementById('modal-edit-btn').addEventListener('click', handleModalEditSave);
});