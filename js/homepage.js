document.addEventListener("DOMContentLoaded", function() {
    // Kiểm tra xem có phần tử featured-products không
    const featuredProductsContainer = document.getElementById("featured-products");
    if (!featuredProductsContainer) return;

    // Địa chỉ API sản phẩm (giống với product-api.js)
    const apiUrl = "https://main.vienthong3g.vn/VnetManager/api.jsp?chart=zipchat_hieu&node=Start&b&t&c&r&s&sc&g&min&max";

    // Hàm định dạng giá tiền
    function formatPrice(price) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    }

    // Hàm lấy URL hình ảnh sản phẩm
    function getProductImageUrl(product) {
        // Trích xuất URL hình ảnh với logic tương tự product-api.js
        if (product.images && product.images.length > 0) {
            return product.images[0].url;
        } else if (product.image_url) {
            return product.image_url;
        } else if (product.imageUrl) {
            return product.imageUrl;
        } else if (product.image) {
            return product.image;
        } else if (product.img) {
            return product.img;
        }

        // Fallback dựa trên thương hiệu
        const brandMap = {
            'Apple': '../images/macbook-pro.jpg',
            'Dell': '../images/dell-xps.jpg',
            'Asus': '../images/asus-rog.jpg',
            'HP': '../images/hp-laptop.jpg',
            'Lenovo': '../images/lenovo-laptop.jpg',
            'Acer': '../images/acer-laptop.jpg',
            'MSI': '../images/msi-laptop.jpg',
            'Samsung': '../images/samsung-laptop.jpg',
            'LG': '../images/lg-laptop.jpg'
        };

        return brandMap[product.brand] || '../images/default-laptop.jpg';
    }

    // Hàm tạo badge cho sản phẩm
    function createProductBadge(product) {
        if (product.price > 40000000) {
            return '<div class="product-badge premium">Cao cấp</div>';
        } else if (product.type && product.type.includes("Gaming")) {
            return '<div class="product-badge gaming">Gaming</div>';
        } else if (product.type && product.type.includes("2-in-1")) {
            return '<div class="product-badge convertible">2-in-1</div>';
        }
        return '';
    }

    // Hàm tạo HTML cho sản phẩm nổi bật
    function createFeaturedProductHTML(product) {
        const imageUrl = getProductImageUrl(product);
        const badge = createProductBadge(product);
        const priceFormatted = formatPrice(product.price);
        
        return `
            <div class="col-lg-4 col-sm-6 mb-4">
                <div class="box_main">
                    <div class="product-badge-container">
                        ${badge}
                    </div>
                    <h4 class="shirt_text">${product.name}</h4>
                    <p class="price_text">Giá <span style="color: #262626;">${priceFormatted}</span></p>
                    <div class="laptop_img">
                        <img src="${imageUrl}" alt="${product.name}" onerror="this.src='../images/default-laptop.jpg'">
                    </div>
                    <div class="product-specs">
                        <ul>
                            <li><i class="fas fa-microchip"></i> ${product.cpu || 'Không có thông tin'}</li>
                            <li><i class="fas fa-memory"></i> ${product.ram || 'Không có thông tin'}</li>
                            <li><i class="fas fa-hdd"></i> ${product.storage || 'Không có thông tin'}</li>
                        </ul>
                    </div>
                    <div class="btn_main">
                        <div class="buy_bt"><a href="laptops.html?id=${product.id}">Mua Ngay</a></div>
                        <div class="seemore_bt"><a href="laptops.html?id=${product.id}">Xem Chi Tiết</a></div>
                    </div>
                </div>
            </div>
        `;
    }

    // Hàm hiển thị sản phẩm nổi bật
    function displayFeaturedProducts(products) {
        // Lọc ra 3 sản phẩm nổi bật (có thể dựa trên tiêu chí khác nhau)
        const featuredProducts = selectFeaturedProducts(products);
        
        // Xóa spinner loading
        featuredProductsContainer.innerHTML = '';
        
        // Thêm sản phẩm nổi bật vào container
        featuredProducts.forEach(product => {
            featuredProductsContainer.innerHTML += createFeaturedProductHTML(product);
        });
    }

    // Hàm chọn sản phẩm nổi bật từ danh sách sản phẩm
    function selectFeaturedProducts(products) {
        if (!products || products.length === 0) {
            return [];
        }

        // Tạo danh sách sản phẩm nổi bật dựa trên các tiêu chí khác nhau
        const featuredProducts = [];
        
        // 1. Sản phẩm cao cấp (giá cao nhất)
        const premiumProduct = [...products].sort((a, b) => b.price - a.price)[0];
        if (premiumProduct) featuredProducts.push(premiumProduct);
        
        // 2. Sản phẩm gaming
        const gamingProduct = products.find(p => p.type && p.type.includes('Gaming') && p.id !== premiumProduct.id);
        if (gamingProduct) featuredProducts.push(gamingProduct);
        
        // 3. Sản phẩm văn phòng/học tập
        const officeProduct = products.find(p => 
            (!p.type || !p.type.includes('Gaming')) && 
            p.id !== premiumProduct.id && 
            (!gamingProduct || p.id !== gamingProduct.id)
        );
        if (officeProduct) featuredProducts.push(officeProduct);
        
        // Nếu chưa đủ 3 sản phẩm, thêm các sản phẩm khác
        while (featuredProducts.length < 3 && featuredProducts.length < products.length) {
            const remainingProducts = products.filter(p => !featuredProducts.some(fp => fp.id === p.id));
            if (remainingProducts.length === 0) break;
            featuredProducts.push(remainingProducts[0]);
        }
        
        return featuredProducts;
    }

    // Hàm xử lý lỗi khi tải sản phẩm
    function handleFetchError(error) {
        console.error('Lỗi khi tải sản phẩm:', error);
        featuredProductsContainer.innerHTML = `
            <div class="col-12 text-center text-danger">
                <h3>Không thể tải sản phẩm</h3>
                <p>${error.message}</p>
                <button class="btn btn-primary mt-3" onclick="location.reload()">Thử lại</button>
            </div>
        `;
    }

    // Tải sản phẩm từ API
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Yêu cầu API thất bại với trạng thái ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (Array.isArray(data)) {
                // Xử lý dữ liệu sản phẩm
                const products = data.map(product => {
                    // Trích xuất URL hình ảnh
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
                
                // Hiển thị sản phẩm nổi bật
                displayFeaturedProducts(products);
            } else {
                throw new Error('Dữ liệu API không hợp lệ');
            }
        })
        .catch(handleFetchError);
});
