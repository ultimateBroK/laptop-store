document.addEventListener("DOMContentLoaded", function() {
    // Địa chỉ API sản phẩm
    const apiUrl = "https://main.vienthong3g.vn/VnetManager/api.jsp?chart=zipchat_hieu&node=Start&b&t&c&r&s&sc&g&min&max";

    // Phần tử chứa sản phẩm
    const productContainer = document.getElementById("product-container");

    // Các phần tử lọc sản phẩm
    const searchBar = document.querySelector(".search-bar");        // Thanh tìm kiếm
    const priceRange = document.getElementById("priceRange");       // Thanh trượt khoảng giá
    const categoryButtons = document.querySelectorAll(".category-btn"); // Nút lọc danh mục
    const brandCheckboxes = document.querySelectorAll(".form-check-input"); // Checkbox thương hiệu
    const processorCheckboxes = document.querySelectorAll(".processor-check"); // Checkbox CPU
    const ramFilter = document.getElementById("ram-filter");        // Bộ lọc RAM
    const sortSelect = document.getElementById("sort-select");      // Dropdown sắp xếp
    const viewButtons = document.querySelectorAll(".view-btn");     // Nút chuyển chế độ xem
    const resetFiltersButton = document.getElementById("reset-filters"); // Nút reset filter

    // Các phần tử so sánh sản phẩm
    const compareProductsButton = document.getElementById("compare-products");
    const clearComparisonButton = document.getElementById("clear-comparison");
    const comparisonBar = document.getElementById("comparison-bar");
    const comparisonItems = document.getElementById("comparison-items");
    const compareCount = document.getElementById("compare-count");

    // Biến toàn cục cho chế độ xem và sắp xếp sản phẩm
    let currentView = 'grid'; // Chế độ xem mặc định là dạng lưới
    let currentSort = 'featured'; // Sắp xếp mặc định là nổi bật
    let productsToCompare = []; // Mảng lưu trữ sản phẩm để so sánh
    let apiProducts = []; // Mảng lưu trữ sản phẩm lấy từ API
    let currentPage = 1;
    const productsPerPage = 12; // Số sản phẩm mỗi trang
    let allFilteredProducts = []; // Lưu trữ tất cả sản phẩm đã lọc

    // Hàm lấy sản phẩm từ API
    function fetchProducts() {
        // Hiển thị trạng thái đang tải
        if (productContainer) {
            productContainer.innerHTML = "<div class='col-12 text-center'><h3>Đang tải sản phẩm...</h3><div class='spinner-border text-primary' role='status'><span class='visually-hidden'>Đang tải...</span></div></div>";
        }

        // Lấy tham số URL
        const urlParams = new URLSearchParams(window.location.search);
        const brandParam = urlParams.get('b') || '';
        const typeParam = urlParams.get('t') || '';
        const cpuParam = urlParams.get('c') || '';
        const ramParam = urlParams.get('r') || '';
        const storageParam = urlParams.get('s') || '';
        const screenParam = urlParams.get('sc') || '';
        const gpuParam = urlParams.get('g') || '';
        const minPriceParam = urlParams.get('min') || '';
        const maxPriceParam = urlParams.get('max') || '';

        // Xây dựng URL API với các tham số - cách tiếp cận tốt hơn
        // Phân tích URL API cơ bản
        const apiUrlObj = new URL(apiUrl);

        // Thêm tham số vào URL nếu chúng tồn tại
        if (brandParam) apiUrlObj.searchParams.set('b', brandParam);
        if (typeParam) apiUrlObj.searchParams.set('t', typeParam);
        if (cpuParam) apiUrlObj.searchParams.set('c', cpuParam);
        if (ramParam) apiUrlObj.searchParams.set('r', ramParam);
        if (storageParam) apiUrlObj.searchParams.set('s', storageParam);
        if (screenParam) apiUrlObj.searchParams.set('sc', screenParam);
        if (gpuParam) apiUrlObj.searchParams.set('g', gpuParam);
        if (minPriceParam) apiUrlObj.searchParams.set('min', minPriceParam);
        if (maxPriceParam) apiUrlObj.searchParams.set('max', maxPriceParam);

        const apiUrlWithParams = apiUrlObj.toString();
        console.log('Đang lấy sản phẩm từ:', apiUrlWithParams);

        // Thêm thời gian chờ cho yêu cầu fetch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // Thời gian chờ 10 giây

        // Gọi API
        fetch(apiUrlWithParams, { signal: controller.signal })
            .then(response => {
                clearTimeout(timeoutId); // Xóa thời gian chờ nếu nhận được phản hồi
                if (!response.ok) {
                    throw new Error(`Yêu cầu API thất bại với trạng thái ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Phản hồi API:', data);

                if (Array.isArray(data)) {
                    // Xử lý dữ liệu sản phẩm để trích xuất URL hình ảnh nếu có
                    apiProducts = data.map(product => {
                        // Trích xuất URL hình ảnh với logic ngắn gọn hơn
                        const imageStore = ['images', 'image_url', 'imageUrl', 'image', 'img'];

                        for (const image_item of imageStore) {
                            if (image_item === 'images' && product[image_item]?.length > 0) {
                                product.imageUrl = product[image_item][0].url;
                                break;
                            } else if (product[image_item]) {
                                product.imageUrl = product[image_item];
                                break;
                            }
                        }

                        return product;
                    });

                    // Hiển thị tất cả sản phẩm từ API mà không lọc theo loại
                    renderProducts(apiProducts);
                } else {
                    console.error('Phản hồi API không phải là một mảng:', data);
                    // Hiển thị thông báo lỗi cho người dùng
                    if (productContainer) {
                        productContainer.innerHTML = `<div class='col-12 text-center text-danger'>
                            <h3>Lỗi tải sản phẩm</h3>
                            <p>API trả về dữ liệu không hợp lệ.</p>
                        </div>`;
                    }
                }
            })
            .catch(error => {
                clearTimeout(timeoutId); // Xóa thời gian chờ khi có lỗi

                let errorAlert = error.message;
                if (error.name === 'AbortError') {
                    errorAlert = 'Yêu cầu đã quá thời gian chờ. Vui lòng thử lại.';
                }

                console.error('Lỗi tìm nạp API:', error);
                // Hiển thị thông báo lỗi cho người dùng
                if (productContainer) {
                    productContainer.innerHTML = `<div class='col-12 text-center text-danger'>
                        <h3>Lỗi tải sản phẩm</h3>
                        <p>${errorAlert}</p>
                    </div>`;
                }
            });
    }

    // Hàm định dạng giá tiền
    function formatPrice(price) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    }

    // Hàm tạo mô tả sản phẩm
    function generateProductDescription(product) {
        let description = '';

        if (product.type.includes('Gaming')) {
            description = 'Laptop gaming mạnh mẽ với hiệu năng vượt trội, phù hợp cho game thủ và người dùng cần xử lý đồ họa nặng.';
        } else if (product.type.includes('2-in-1')) {
            description = 'Laptop lai 2 trong 1 với màn hình cảm ứng, dễ dàng chuyển đổi giữa chế độ laptop và tablet.';
        } else if (product.brand === 'Apple') {
            description = 'Laptop Apple với thiết kế sang trọng, hiệu năng ổn định và hệ sinh thái đồng bộ.';
        } else if (product.price > 50000000) {
            description = 'Laptop cao cấp với cấu hình mạnh mẽ, thiết kế sang trọng và tính năng hiện đại.';
        } else {
            description = 'Laptop đa năng phù hợp cho công việc văn phòng, học tập và giải trí hàng ngày.';
        }

        return description;
    }

    // Hàm tạo đánh giá sao
    function generateRatingStars(product) {
        // Tạo điểm đánh giá ngẫu nhiên dựa trên ID sản phẩm để đảm bảo tính nhất quán
        const seed = product.id % 10;
        let rating = 0;

        if (seed < 3) rating = 4 + (seed / 10); // 4.0 - 4.2
        else if (seed < 6) rating = 4.3 + ((seed - 3) / 10); // 4.3 - 4.5
        else if (seed < 9) rating = 4.6 + ((seed - 6) / 10); // 4.6 - 4.8
        else rating = 4.9; // 4.9

        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let starsHTML = '';

        // Thêm sao đầy
        for (let i = 0; i < fullStars; i++) {
            starsHTML += '<i class="fas fa-star"></i>';
        }

        // Thêm nửa sao nếu cần
        if (hasHalfStar) {
            starsHTML += '<i class="fas fa-star-half-alt"></i>';
        }

        // Thêm sao rỗng
        for (let i = 0; i < emptyStars; i++) {
            starsHTML += '<i class="far fa-star"></i>';
        }

        return `${starsHTML} <span>(${rating.toFixed(1)})</span>`;
    }

    // Hàm rút gọn văn bản thông số kỹ thuật
    function formatSpecText(text, maxLength) {
        if (!text) return '';

        // Nếu có dấu ngoặc, lấy phần trước dấu ngoặc
        if (text.includes('(')) {
            text = text.split('(')[0].trim();
        }

        // Nếu vẫn dài hơn maxLength, cắt và thêm dấu ...
        if (text.length > maxLength) {
            return text.substring(0, maxLength) + '...';
        }

        return text;
    }

    // Hàm cơ sở để lấy URL hình ảnh sản phẩm
    function getProductImageUrl(product, isThumbnail = false) {
        if (!product) {
            return "No product information available";
        }
    
        // Ưu tiên hình ảnh do API cung cấp nếu chúng tồn tại
        if (product.imageUrl) {
            return product.imageUrl;
        }
     
        // Thay vì sử dụng các đường dẫn cục bộ có thể không tồn tại, hãy trả lại thông tin sản phẩm
        if (!product.brand) {
            return `Product: ${product.name || "Unknown product"}`;
        }
    
        // Trả về mô tả sản phẩm bằng cách sử dụng thương hiệu và tên
        return `${product.brand} - ${product.name || "Laptop"}`;
    }

    // Hàm hiển thị ảnh với xử lý lỗi
    function createImageElementWithFallback(src, alt, className) {
        // Kiểm tra xem src đã là thông tin văn bản thay vì URL chưa
        if (src.startsWith('Product:') || src.includes(' - ')) {
            return `<div class="${className} text-placeholder">${src}</div>`;
        }
        
        // Chỉ cho các URL hình ảnh thực tế (API được cung cấp)
        return `<img src="${src}" alt="${alt}" class="${className}"
                onerror="this.onerror=null; this.classList.add('fallback-image'); this.outerHTML='<div class=\'${className} text-placeholder\'>${alt}</div>';">`;
    }
    
    // Hàm lấy hình ảnh sản phẩm, ưu tiên hình ảnh từ API
    function getProductImage(product) {
        if (!product || !product.name || !product.brand) {
            return `<div class="text-placeholder">Thông tin sản phẩm không đầy đủ</div>`;
        }
    
        const imageUrl = getProductImageUrl(product);
        
        // Xác định class dựa trên loại sản phẩm
        let imageClass = "";
        if (product.type && product.type.includes('Gaming')) {
            imageClass = "gaming-laptop";
        } else if (product.type && product.type.includes('2-in-1')) {
            imageClass = "convertible-laptop";
        } else if (product.brand.toLowerCase() === 'apple') {
            imageClass = "apple-laptop";
        } else {
            imageClass = "standard-laptop";
        }
    
        // Xử lý khi imageUrl đã được thông tin văn bản
        if (imageUrl.startsWith('Product:') || imageUrl.includes(' - ')) {
            return `<div class="product-info-text ${imageClass}">${imageUrl}</div>`;
        }
    
        // Chỉ cho các URL hình ảnh thực tế (API được cung cấp)
        if (product.imageUrl || product.imageId) {
            return createImageElementWithFallback(imageUrl, product.name, `api-image ${imageClass}`);
        }
    
        // Mặc định là tên sản phẩm và thương hiệu làm văn bản
        return `<div class="product-info-text ${imageClass}">${product.brand} - ${product.name}</div>`;
    }

    // Hàm lấy hình ảnh thu nhỏ của sản phẩm
    function getProductThumbnail(product) {
        return getProductImageUrl(product, true);
    }

    // Kiểm tra sự phù hợp với danh mục
    function matchesProductCategory(product, category) {
        if (category === "Tất cả") return true;

        switch(category) {
            case "Gaming":
                return product.type.includes("Gaming") ||
                      (product.gpu && product.gpu.toLowerCase().includes("rtx"));
            case "Doanh nhân":
                return !product.type.includes("Gaming") && product.price > 30000000;
            case "Siêu mỏng":
                return product.name.includes("Air") ||
                      product.name.includes("XPS") ||
                      product.name.includes("Spectre") ||
                      product.name.includes("Gram") ||
                      (product.weight && parseFloat(product.weight) < 1.5);
            case "Giá rẻ":
                return product.price < 30000000;
            case "2-trong-1":
                return product.type.includes("2-in-1");
            default:
                return true;
        }
    }

    // Kiểm tra sự phù hợp với bộ xử lý
    function matchesProcessor(product, selectedProcessors) {
        if (!selectedProcessors.length) return true;

        return selectedProcessors.some(proc => {
            if (proc === "intel") {
                return product.cpu.toLowerCase().includes("intel") ||
                    product.cpu.toLowerCase().includes("core i");
            } else if (proc === "amd") {
                return product.cpu.toLowerCase().includes("amd") ||
                    product.cpu.toLowerCase().includes("ryzen");
            } else if (proc === "apple") {
                return product.cpu.toLowerCase().includes("m1") ||
                    product.cpu.toLowerCase().includes("m2") ||
                    product.cpu.toLowerCase().includes("m3");
            }
            return false;
        });
    }

    // Kiểm tra sự phù hợp với RAM
    function matchesRam(product, selectedRam) {
        if (!selectedRam) return true;

        const ramMap = {
            "8GB": ram => ram.includes("8GB") || ram.includes("4GB"),
            "16GB": ram => ram.includes("16GB"),
            "32GB": ram => ram.includes("32GB"),
            "64GB": ram => ram.includes("64GB") || ram.includes("128GB")
        };

        return ramMap[selectedRam] ? ramMap[selectedRam](product.ram) : true;
    }

    // Hàm tạo HTML cho card sản phẩm (chung cho grid và list view)
    function createProductCardHTML(product, viewMode = 'grid') {
        // Định dạng giá thành VND
        const priceFormatted = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(product.price);

        // Xác định hình ảnh sản phẩm
        let productPhoto = getProductImage(product);

        // Xác định huy hiệu sản phẩm
        let badge = "";
        if (product.price > 40000000) {
            badge = '<div class="product-badge premium">Cao cấp</div>';
        } else if (product.type.includes("Gaming")) {
            badge = '<div class="product-badge gaming">Gaming</div>';
        } else if (product.type.includes("2-in-1")) {
            badge = '<div class="product-badge convertible">2-in-1</div>';
        }

        // Kiểm tra xem sản phẩm có thông tin GPU hay không
        const gpuInfo = product.gpu ? `<li class="gpu-info"><i class="fas fa-microchip"></i> ${product.gpu}</li>` : '';

        // Kiểm tra xem sản phẩm có trong danh sách so sánh hay không
        const compareList = productsToCompare && productsToCompare.some(p => p.id === product.id);
        const compareSelected = compareList ? 'checked' : '';

        let productCardHTML = '';

        if (viewMode === 'grid') {
            productCardHTML = `
                <div class="product-card">
                    <div class="product-img">
                        ${productPhoto}
                        ${badge}
                        <div class="quick-view-btn">
                            <button class="btn btn-sm btn-light" onclick="quickView(${product.id})">
                                <i class="fas fa-eye"></i> Xem nhanh
                            </button>
                        </div>
                        <div class="product-labels">
                            ${product.price < 30000000 ? '<span class="label-sale">Giá tốt</span>' : ''}
                            ${product.ram.includes('32GB') || product.ram.includes('64GB') ? '<span class="label-new">Cao cấp</span>' : ''}
                        </div>
                    </div>
                    <div class="product-info">
                        <h3 class="product-title">${product.name}</h3>
                        <div class="rating">
                            ${generateRatingStars(product)}
                        </div>
                        <div class="product-specs">
                            <ul>
                                <li><i class="fas fa-microchip"></i> ${formatSpecText(product.cpu, 30)}</li>
                                <li><i class="fas fa-memory"></i> ${product.ram}</li>
                                <li><i class="fas fa-hdd"></i> ${product.storage}</li>
                                ${gpuInfo}
                                <li><i class="fas fa-laptop"></i> ${product.brand}</li>
                                <li><i class="fas fa-desktop"></i> ${formatSpecText(product.screen, 35)}</li>
                            </ul>
                        </div>
                        <div class="product-price">
                            ${priceFormatted} <span class="stock-status">Còn hàng</span>
                            ${product.id % 3 === 0 ? `<span class="old-price">${formatPrice(product.price * 1.15)}</span>` : ''}
                        </div>
                        <div class="product-actions">
                            <a href="#" class="btn-details">Chi tiết</a>
                            <a href="#" class="btn-buy">Thêm vào giỏ hàng</a>
                        </div>
                        <div class="compare-check">
                            <input type="checkbox" id="compare${product.id}" name="compare" ${compareSelected}>
                            <label for="compare${product.id}" class="compare-label">So sánh</label>
                        </div>
                    </div>
                </div>
            `;
        } else { // list view
            productCardHTML = `
                <div class="product-card list-view">
                    <div class="row">
                        <div class="col-md-3">
                            <div class="product-img">
                                ${productPhoto}
                                ${badge}
                                <div class="product-labels">
                                    ${product.price < 30000000 ? '<span class="label-sale">Giá tốt</span>' : ''}
                                    ${product.ram.includes('32GB') || product.ram.includes('64GB') ? '<span class="label-new">Cao cấp</span>' : ''}
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="product-info">
                                <h3 class="product-title">${product.name}</h3>
                                <div class="rating">
                                    ${generateRatingStars(product)}
                                </div>
                                <div class="product-description">
                                    ${generateProductDescription(product)}
                                </div>
                                <div class="product-specs">
                                    <ul class="row">
                                        <li class="col-md-6"><i class="fas fa-microchip"></i> ${formatSpecText(product.cpu, 40)}</li>
                                        <li class="col-md-6"><i class="fas fa-memory"></i> ${product.ram}</li>
                                        <li class="col-md-6"><i class="fas fa-hdd"></i> ${product.storage}</li>
                                        <li class="col-md-6"><i class="fas fa-desktop"></i> ${formatSpecText(product.screen, 40)}</li>
                                        ${gpuInfo ? `<li class="col-md-6"><i class="fas fa-microchip"></i> ${formatSpecText(product.gpu, 40)}</li>` : ''}
                                        <li class="col-md-6"><i class="fas fa-laptop"></i> ${product.brand}</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="product-price-actions">
                                <div class="product-price">
                                    ${priceFormatted} <span class="stock-status">Còn hàng</span>
                                    ${product.id % 3 === 0 ? `<div class="old-price">${formatPrice(product.price * 1.15)}</div>` : ''}
                                </div>
                                <div class="product-actions">
                                    <a href="#" class="btn-details">Chi tiết</a>
                                    <a href="#" class="btn-buy">Thêm vào giỏ hàng</a>
                                    <button class="btn-quick-view" onclick="quickView(${product.id})">
                                        <i class="fas fa-eye"></i> Xem nhanh
                                    </button>
                                </div>
                                <div class="compare-check">
                                    <input type="checkbox" id="compare${product.id}" name="compare" ${compareSelected}>
                                    <label for="compare${product.id}" class="compare-label">So sánh</label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        return productCardHTML;
    }

    // Hàm hiển thị một sản phẩm duy nhất
    function renderProduct(product, viewMode = 'grid') {
        if (!productContainer) return;
        const productElement = document.createElement('div');
        productElement.className = viewMode === 'grid' ? 'col-lg-4 col-md-6 mb-4' : 'col-12 mb-4';
        productElement.innerHTML = createProductCardHTML(product, viewMode);
        productContainer.appendChild(productElement);
    }

    // Hàm hiển thị sản phẩm ra trang với phân trang
    function renderProducts(productsToRender) {
        if (!productContainer) return;

        // Hiển thị tổng số sản phẩm tìm thấy
        const productCountElement = document.getElementById('product-count');
        if (productCountElement) {
            productCountElement.textContent = productsToRender.length;
        }

        // Lưu danh sách sản phẩm đã lọc
        allFilteredProducts = [...productsToRender];

        // Reset về trang 1 khi có bộ lọc mới
        currentPage = 1;

        productContainer.innerHTML = "";

        if (productsToRender.length === 0) {
            productContainer.innerHTML = "<div class='col-12 text-center'><h3>Không tìm thấy sản phẩm phù hợp với tiêu chí của bạn</h3><p>Hãy thử điều chỉnh bộ lọc hoặc cụm từ tìm kiếm của bạn.</p></div>";
            return;
        }

        // Sắp xếp sản phẩm nếu cần
        if (sortSelect && sortSelect.value !== 'featured') {
            productsToRender = sortProducts(productsToRender, sortSelect.value);
        }

        // Tính toán phân trang
        const startIndex = (currentPage - 1) * productsPerPage;
        const paginatedProducts = productsToRender.slice(startIndex, startIndex + productsPerPage);

        // Hiển thị các sản phẩm của trang hiện tại
        const fragment = document.createDocumentFragment();
        paginatedProducts.forEach(product => {
            const productElement = document.createElement('div');
            productElement.className = currentView === 'grid' ? 'col-lg-4 col-md-6 mb-4' : 'col-12 mb-4';
            productElement.innerHTML = createProductCardHTML(product, currentView);
            fragment.appendChild(productElement);
        });

        productContainer.appendChild(fragment);
        // Thêm trình nghe sự kiện cho hộp kiểm so sánh sau khi hiển thị
        addCompareCheckboxListeners();

        // Render điều khiển phân trang
        renderPagination(productsToRender.length);

        // Hiển thị thông tin về trang hiện tại
        updatePageInfo(productsToRender.length, paginatedProducts.length);
    }

    // Hiển thị thông tin về số sản phẩm đang hiển thị
    function updatePageInfo(totalProducts, currentPageCount) {
        const pageInfoElement = document.getElementById('page-info');
        if (pageInfoElement) {
            const startIndex = (currentPage - 1) * productsPerPage + 1;
            const endIndex = Math.min(startIndex + currentPageCount - 1, totalProducts);
            pageInfoElement.textContent = `Đang hiển thị ${startIndex}-${endIndex} trên tổng số ${totalProducts} sản phẩm`;
        }
    }

    // Render điều khiển phân trang
    function renderPagination(totalProducts) {
        const paginationContainer = document.getElementById('pagination-container');
        if (!paginationContainer) return;

        const totalPages = Math.ceil(totalProducts / productsPerPage);

        // Nếu không có sản phẩm hoặc chỉ có 1 trang, ẩn phân trang
        if (totalProducts === 0 || totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let paginationHTML = '<nav aria-label="Page navigation"><ul class="pagination justify-content-center">';

        // Nút trước
        paginationHTML += `
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="javascript:void(0)" data-page="${currentPage - 1}" aria-label="Previous">
                    <span aria-hidden="true">«</span>
                </a>
            </li>
        `;

        // Số trang - Hiển thị một số lượng hợp lý trang xung quanh trang hiện tại
        const maxPagesToShow = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

        // Điều chỉnh lại khoảng trang nếu cần
        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }

        // Hiển thị nút trang đầu tiên nếu cần
        if (startPage > 1) {
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="javascript:void(0)" data-page="1">1</a>
                </li>
            `;
            if (startPage > 2) {
                paginationHTML += `
                    <li class="page-item disabled">
                        <a class="page-link" href="javascript:void(0)">...</a>
                    </li>
                `;
            }
        }

        // Các trang giữa
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${currentPage === i ? 'active' : ''}">
                    <a class="page-link" href="javascript:void(0)" data-page="${i}">${i}</a>
                </li>
            `;
        }

        // Hiển thị nút trang cuối cùng nếu cần
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += `
                    <li class="page-item disabled">
                        <a class="page-link" href="javascript:void(0)">...</a>
                    </li>
                `;
            }
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="javascript:void(0)" data-page="${totalPages}">${totalPages}</a>
                </li>
            `;
        }

        // Nút tiếp theo
        paginationHTML += `
            <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="javascript:void(0)" data-page="${currentPage + 1}" aria-label="Next">
                    <span aria-hidden="true">»</span>
                </a>
            </li>
        `;

        paginationHTML += '</ul></nav>';
        paginationHTML += '<div id="page-info" class="text-center mt-2 text-muted"></div>';

        paginationContainer.innerHTML = paginationHTML;

        // Thêm trình nghe sự kiện vào các liên kết phân trang
        document.querySelectorAll('.pagination .page-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();

                // Kiểm tra xem phần tử cha có class disabled không
                if (this.parentNode.classList.contains('disabled')) {
                    return; // Không làm gì nếu nút bị vô hiệu hóa
                }

                const pageNum = parseInt(this.getAttribute('data-page'));
                if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
                    console.log(`Chuyển đến trang ${pageNum}`);
                    currentPage = pageNum;

                    // Tính toán các sản phẩm của trang mới
                    const startIndex = (currentPage - 1) * productsPerPage;
                    const endIndex = Math.min(startIndex + productsPerPage, allFilteredProducts.length);
                    const currentPageProducts = allFilteredProducts.slice(startIndex, endIndex);

                    // Xóa các sản phẩm hiện tại
                    productContainer.innerHTML = "";

                    // Tạo document fragment để tăng hiệu năng
                    const fragment = document.createDocumentFragment();

                    // Hiển thị các sản phẩm của trang mới
                    currentPageProducts.forEach(product => {
                        const productElement = document.createElement('div');
                        productElement.className = currentView === 'grid' ? 'col-lg-4 col-md-6 mb-4' : 'col-12 mb-4';
                        productElement.innerHTML = createProductCardHTML(product, currentView);
                        fragment.appendChild(productElement);
                    });

                    // Đồng bộ thêm fragment vào container (để tránh reflow nhiều lần)
                    productContainer.appendChild(fragment);

                    // Cập nhật thông tin trang
                    const pageInfoElement = document.getElementById('page-info');
                    if (pageInfoElement) {
                        const firstItemIndex = startIndex + 1;
                        const lastItemIndex = endIndex;
                        pageInfoElement.textContent = `Đang hiển thị ${firstItemIndex}-${lastItemIndex} trên tổng số ${allFilteredProducts.length} sản phẩm`;
                    }

                    // Cập nhật UI của phân trang
                    document.querySelectorAll('.pagination .page-item').forEach(item => {
                        // Xóa active class cho tất cả các nút
                        item.classList.remove('active');

                        // Cập nhật trạng thái active cho nút trang hiện tại
                        const link = item.querySelector('.page-link');
                        if (link && link.getAttribute('data-page') == currentPage) {
                            item.classList.add('active');
                        }

                        // Cập nhật trạng thái disabled cho nút Previous
                        if (link && link.getAttribute('aria-label') === 'Previous') {
                            if (currentPage === 1) {
                                item.classList.add('disabled');
                            } else {
                                item.classList.remove('disabled');
                                link.setAttribute('data-page', currentPage - 1);
                            }
                        }

                        // Cập nhật trạng thái disabled cho nút Next
                        if (link && link.getAttribute('aria-label') === 'Next') {
                            if (currentPage === totalPages) {
                                item.classList.add('disabled');
                            } else {
                                item.classList.remove('disabled');
                                link.setAttribute('data-page', currentPage + 1);
                            }
                        }
                    });

                    // Hiển thị lại phân trang để cập nhật UI hoàn toàn
                    renderPagination(allFilteredProducts.length);

                    // Scroll to top of product container
                    productContainer.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    // Hàm cập nhật URL với các tham số bộ lọc
    function updateURLParams(params) {
        const urlParams = new URLSearchParams();
        for (const key in params) {
            if (params[key]) { // Chỉ thêm tham số nếu có giá trị
                urlParams.set(key, params[key]);
            }
        }
        const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
        window.history.pushState({ path: newUrl }, '', newUrl);
    }

    // Lọc sản phẩm dựa trên đầu vào tìm kiếm
    function filterProducts() {
        const searchTerm = searchBar ? searchBar.value.toLowerCase() : "";
        const maxPrice = priceRange ? priceRange.value * 1000000 : 50000000;

        const selectedBrands = Array.from(brandCheckboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.nextElementSibling.textContent.trim());

        const selectedCategory = Array.from(categoryButtons)
            .find(button => button.classList.contains("active"))?.textContent.trim() || "Tất cả";

        const selectedProcessors = processorCheckboxes ? Array.from(processorCheckboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value.toLowerCase()) : [];

        const selectedRam = ramFilter ? ramFilter.value : "";

        const filterParams = {
            search: searchTerm || undefined, // Sử dụng undefined để loại bỏ tham số nếu rỗng
            max: (maxPrice !== 50000000) ? maxPrice : undefined,
            b: selectedBrands.length > 0 ? selectedBrands.join(',') : undefined,
            t: (selectedCategory !== "Tất cả") ? selectedCategory : undefined,
            c: selectedProcessors.length > 0 ? selectedProcessors.join(',') : undefined,
            r: selectedRam || undefined
        };

        updateURLParams(filterParams);

        if (apiProducts && apiProducts.length > 0) {
            let filteredProducts = apiProducts.filter(product => {
                const matchesSearch = !searchTerm ||
                    product.name.toLowerCase().includes(searchTerm) ||
                    product.brand.toLowerCase().includes(searchTerm) ||
                    product.cpu.toLowerCase().includes(searchTerm) ||
                    (product.gpu && product.gpu.toLowerCase().includes(searchTerm));

                const matchesPrice = product.price <= maxPrice;
                const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(product.brand);
                const matchesCategory = matchesProductCategory(product, selectedCategory);
                const matchesProcessorFilter = matchesProcessor(product, selectedProcessors);
                const matchesRamFilter = matchesRam(product, selectedRam);

                return matchesSearch && matchesPrice && matchesBrand &&
                    matchesCategory && matchesProcessorFilter && matchesRamFilter;
            });
            renderProducts(filteredProducts);
        } else {
            fetchProducts(); // Gọi lại fetch nếu không có dữ liệu sẵn
        }
    }

    // Hàm sắp xếp
    function sortProducts(productsToSort, sortType) {
        let sortedProducts = [...productsToSort];

        switch (sortType) {
            case 'price-low':
                sortedProducts.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                sortedProducts.sort((a, b) => b.price - a.price);
                break;
            case 'name-asc': // Sắp xếp theo tên tăng dần
                sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name-desc': // Sắp xếp theo tên giảm dần
                sortedProducts.sort((a, b) => b.name.localeCompare(b.name));
                break;
            default:
                // 'featured' - không cần sắp xếp
                break;
        }
        return sortedProducts
    }

    // Chuyển đổi sản phẩm trong danh sách so sánh
    function toggleCompare(productId) {
        if (!productsToCompare) productsToCompare = [];

        const checkbox = document.getElementById(`compare${productId}`);
        const product = apiProducts.find(p => p.id === productId); // Tìm trong apiProducts

        if (!product) return;

        const index = productsToCompare.findIndex(p => p.id === productId);

        if (index === -1 && checkbox.checked) {
            // Thêm vào so sánh
            if (productsToCompare.length >= 4) {
                alert('Bạn chỉ có thể so sánh tối đa 4 sản phẩm cùng lúc!');
                checkbox.checked = false;
                return;
            }
            productsToCompare.push(product);
        } else if (index !== -1 && !checkbox.checked) {
            // Xóa khỏi so sánh
            productsToCompare.splice(index, 1);
        }

        updateComparisonBar();
    }

    // Cập nhật thanh so sánh với các sản phẩm đã chọn
    function updateComparisonBar() {
        if (!comparisonBar || !comparisonItems || !compareCount) return;

        // Cập nhật số lượng
        compareCount.textContent = productsToCompare.length;

        // Hiển thị/ẩn thanh so sánh
        if (productsToCompare.length > 0) {
            comparisonBar.style.display = 'block';
        } else {
            comparisonBar.style.display = 'none';
            return;
        }

        // Cập nhật các mục so sánh
        comparisonItems.innerHTML = '';

        productsToCompare.forEach(product => {
            const itemHTML = `
                <div class="comparison-item">
                    <img src="${getProductThumbnail(product)}" alt="${product.name}" class="img-thumbnail">
                    <span>${product.name.substring(0, 20)}${product.name.length > 20 ? '...' : ''}</span>
                    <button class="btn btn-sm btn-outline-danger" onclick="toggleCompare(${product.id})">×</button>
                </div>
            `;
            comparisonItems.innerHTML += itemHTML;
        });
    }

    // Hiển thị trang so sánh
    function showComparison() {
        if (productsToCompare.length < 2) {
            alert('Vui lòng chọn ít nhất 2 sản phẩm để so sánh!');
            return;
        }

        // Trong một ứng dụng thực tế, bạn sẽ chuyển hướng đến một trang so sánh
        // Hiện tại, chúng ta sẽ chỉ thông báo
        alert('Chức năng so sánh sẽ được triển khai trong phiên bản tiếp theo!');
    }

    // Xóa tất cả sản phẩm khỏi so sánh
    function clearComparison() {
        productsToCompare = [];

        // Bỏ chọn tất cả các hộp kiểm so sánh
        document.querySelectorAll('input[name="compare"]').forEach(checkbox => {
            checkbox.checked = false;
        });

        updateComparisonBar();
    }

    // Thêm trình nghe sự kiện vào các hộp kiểm so sánh
    function addCompareCheckboxListeners() {
        document.querySelectorAll('input[name="compare"]').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const productId = parseInt(this.id.replace('compare', ''));
                toggleCompare(productId);
            });
        });
    }

    // Chức năng xem nhanh
    function quickView(productId) {
        console.log(`Xem nhanh sản phẩm có ID: ${productId}`);
        const product = apiProducts.find(p => p.id === productId); // Tìm trong danh sách sản phẩm API
        if (!product) {
            console.error('Không tìm thấy sản phẩm', productId);
            return;
        }

        // Hiển thị thông tin sản phẩm với một thông báo đơn giản
        const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price);

        let infoText = `Thông tin sản phẩm: ${product.name}\n`;
        infoText += `Giá: ${formattedPrice}\n`;
        infoText += `Thương hiệu: ${product.brand}\n`;
        infoText += `CPU: ${product.cpu}\n`;
        infoText += `RAM: ${product.ram}\n`;
        infoText += `Lưu trữ: ${product.storage}\n`;
        infoText += `Màn hình: ${product.screen}`;

        if (product.gpu) {
            infoText += `\nCard đồ họa: ${product.gpu}`;
        }

        alert(infoText);
    }

    // Đặt lại tất cả bộ lọc
    function resetFilters() {
        if (searchBar) searchBar.value = '';
        if (priceRange) {
            priceRange.value = 50;
            const priceDisplay = document.querySelector(".price-value");
            if (priceDisplay) priceDisplay.textContent = '50.000.000₫';
        }

        categoryButtons.forEach((btn, index) => btn.classList.toggle('active', index === 0));
        brandCheckboxes.forEach(checkbox => checkbox.checked = true);
        if (processorCheckboxes) processorCheckboxes.forEach(checkbox => checkbox.checked = true);
        if (ramFilter) ramFilter.value = '';

        updateURLParams({}); // Xóa tất cả tham số trên URL
        fetchProducts();
    }

    // Khởi tạo trình nghe sự kiện
    function initEventListeners() {
        if (searchBar) {
            searchBar.addEventListener("input", filterProducts);
        }

        if (priceRange) {
            priceRange.addEventListener("input", function() {
                const priceValue = parseInt(this.value) * 1000000;
                const formattedPrice = new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND'
                }).format(priceValue);

                // Cập nhật hiển thị giá nếu nó tồn tại
                const priceDisplay = document.querySelector(".price-value");
                if (priceDisplay) {
                    priceDisplay.textContent = formattedPrice;
                }

                filterProducts();
            });
        }

        // Các nút danh mục
        categoryButtons.forEach(button => {
            button.addEventListener("click", function() {
                categoryButtons.forEach(btn => btn.classList.remove("active"));
                this.classList.add("active");
                filterProducts();
            });
        });

        // Hộp kiểm thương hiệu
        brandCheckboxes.forEach(checkbox => {
            checkbox.addEventListener("change", filterProducts);
        });

        // Hộp kiểm bộ vi xử lý
        if (processorCheckboxes) {
            processorCheckboxes.forEach(checkbox => {
                checkbox.addEventListener('change', filterProducts);
            });
        }

        // Bộ lọc RAM
        if (ramFilter) {
            ramFilter.addEventListener('change', filterProducts);
        }

        // Lựa chọn sắp xếp
        if (sortSelect) {
            sortSelect.addEventListener('change', function() {
                currentSort = this.value;
                filterProducts();
            });
        }

        // Các nút xem
        if (viewButtons) {
            viewButtons.forEach(button => {
                button.addEventListener('click', function() {
                    viewButtons.forEach(btn => btn.classList.remove('active'));
                    this.classList.add('active');
                    currentView = this.dataset.view;
                    filterProducts(); // Hiển thị lại với chế độ xem hiện tại
                });
            });
        }

        // Nút đặt lại bộ lọc
        if (resetFiltersButton) {
            resetFiltersButton.addEventListener('click', resetFilters);
        }

        // Các nút so sánh
        if (compareProductsButton) {
            compareProductsButton.addEventListener('click', showComparison);
        }

        if (clearComparisonButton) {
            clearComparisonButton.addEventListener('click', clearComparison);
        }
    }

    // Khởi tạo
    fetchProducts();
    initEventListeners();
});