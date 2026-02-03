# Product API Documentation

## Tổng quan
API đầy đủ cho Product với CRUD operations: **GET**, **Tạo mới**, **Cập nhật** và **Xóa bỏ**.

---

## 📋 Các file đã tạo/sửa

### 1. **Controller Files**
- ✅ `src/controller/products/createProduct.js` - Controller tạo product
- ✅ `src/controller/products/updateProduct.js` - Controller cập nhật product
- ✅ `src/controller/products/deleteProduct.js` - Controller xóa product
- ✅ `src/controller/products/getProducts.js` - Controller lấy danh sách products
- ✅ `src/controller/products/index.js` - Exports tất cả controllers

### 2. **Model Files**
- ✅ `src/models/product.model.js` - Model với các methods:
  - `checkProductCodeExists(product_code)` - Kiểm tra mã sản phẩm tồn tại
  - `getProductById(product_id)` - Lấy product theo ID
  - `createProduct(product_data)` - Tạo product mới
  - `updateProduct(productId, updateData)` - Cập nhật product
  - `deleteProductById(product_id)` - Xóa product
  - `getProducts(filters)` - Lấy danh sách products với filter

### 3. **Route Files**
- ✅ `src/routes/product.routes.js` - Routes: GET, POST, PUT, DELETE

### 4. **Validator Files**
- ✅ `src/validators/product.validator.js` - Schemas:
  - `productQuerySchema` - Validation cho GET query parameters
  - `productCreateSchema` - Validation cho create
  - `productUpdateSchema` - Validation cho update (partial)

### 5. **HTTP Test Files**
- ✅ `http/product.http` - Ví dụ request cho tất cả APIs

---

## 🚀 API Endpoints

### 1. **GET /api/products** - Lấy danh sách Products

**Query Parameters (All optional - camelCase format):**
- `status` - Filter by status: `active`, `inactive`, or `all` (default: `active`)
- `productCode` - Search by product code
- `productNameVn` - Search by product name (partial match)
- `productTypeId` - Filter by product type ID
- `categoryId` - Filter by category ID
- `colorVn` - Search by color (partial match)
- `minPrice` - Minimum price filter
- `maxPrice` - Maximum price filter
- `page` - Page number (default: 1)
- `limit` - Items per page (max 100, default: 10)
- `sortBy` - Sort field: `created_at`, `product_name_vn`, `price` (default: `created_at`)
- `sortOrder` - Sort direction: `ASC` or `DESC` (default: `DESC`)

**Ví dụ Request:**
```http
# Lấy tất cả products active
GET http://localhost:5000/api/products?status=active

# Search với filters
GET http://localhost:5000/api/products?productNameVn=Sofa&minPrice=1000000&maxPrice=5000000

# Filter theo category và product type
GET http://localhost:5000/api/products?categoryId=1&productTypeId=2

# Pagination và sorting
GET http://localhost:5000/api/products?page=1&limit=20&sortBy=price&sortOrder=ASC
```

**Response Success (200):**
```json
{
  "status": "success",
  "message": "Products retrieved successfully",
  "source": "cache",
  "data": {
    "products": [
      {
        "product_id": 1,
        "product_code": "P001",
        "product_name_vn": "Ghế Sofa 3 chỗ",
        "main_image": "https://res.cloudinary.com/...",
        "sub_image": "[\"url1\", \"url2\"]",
        "length": 200,
        "width": 90,
        "height": 85,
        "material_vn": "Gỗ sồi",
        "description_vn": "Ghế sofa cao cấp...",
        "origin_vn": "Việt Nam",
        "color_vn": "Nâu",
        "product_type_id": 1,
        "product_type_name_vn": "Ghế Sofa",
        "category_id": 1,
        "category_name_vn": "Nội thất phòng khách",
        "status": "active",
        "warranty_period": 24,
        "price": 15000000,
        "created_at": "2026-01-31T10:00:00.000Z"
      }
    ],
    "pagination": {
      "totalItems": 50,
      "totalPages": 5,
      "currentPage": 1,
      "itemsPerPage": 10
    }
  }
}
```

---

### 2. **POST /api/products** - Tạo mới Product

**Request Format:**
- Content-Type: `multipart/form-data`
- Fields (camelCase - tự động convert sang snake_case):
  - `productCode` (required) - Mã sản phẩm (unique)
  - `productNameVn` (required) - Tên sản phẩm tiếng Việt
  - `length` (required) - Chiều dài (cm)
  - `width` (required) - Chiều rộng (cm)
  - `height` (required) - Chiều cao (cm)
  - `materialVn` (required) - Chất liệu tiếng Việt
  - `price` (required) - Giá sản phẩm
  - `productTypeId` (required) - ID của product type
  - `colorVn` (optional) - Màu sắc tiếng Việt
  - `descriptionVn` (optional) - Mô tả tiếng Việt
  - `originVn` (optional) - Xuất xứ tiếng Việt
  - `warrantyPeriod` (optional) - Thời gian bảo hành (tháng)
  - `status` (optional) - Trạng thái: `active` hoặc `inactive` (default: `active`)
  - `mainImage` (optional) - Ảnh chính (max 10MB)
  - `subImage` (optional) - Ảnh phụ (max 5 ảnh, mỗi ảnh max 10MB)

**Ví dụ Request:**
```http
POST http://localhost:5000/api/products
Content-Type: multipart/form-data

{
  productCode: "P001",
  productNameVn: "Ghế Sofa 3 chỗ",
  length: 200,
  width: 90,
  height: 85,
  materialVn: "Gỗ sồi, vải bọc cao cấp",
  colorVn: "Nâu",
  descriptionVn: "Ghế sofa 3 chỗ ngồi cao cấp...",
  price: 15000000,
  productTypeId: "1",
  status: "active",
  originVn: "Việt Nam",
  warrantyPeriod: 24,
  mainImage: <file>,
  subImage: [<file1>, <file2>, <file3>]
}
```

**Response Success (201):**
```json
{
  "status": "success",
  "message": "Product created successfully",
  "source": "db",
  "data": {
    "product_id": 1
  }
}
```

**Response Errors:**
- `400` - Product code already exists
- `400` - Product type does not exist
- `400` - Validation error
- `500` - Internal server error

---

### 3. **PUT /api/products/:product_id** - Cập nhật Product

**URL Parameters:**
- `product_id` (required) - ID của product cần cập nhật

**Request Format:**
- Content-Type: `multipart/form-data`
- Fields (All optional - camelCase format):
  - `productCode` - Mã sản phẩm mới
  - `productNameVn` - Tên sản phẩm mới
  - `length` - Chiều dài mới
  - `width` - Chiều rộng mới
  - `height` - Chiều cao mới
  - `materialVn` - Chất liệu mới
  - `colorVn` - Màu sắc mới
  - `descriptionVn` - Mô tả mới
  - `price` - Giá mới
  - `productTypeId` - Product type ID mới
  - `status` - Trạng thái mới
  - `originVn` - Xuất xứ mới
  - `warrantyPeriod` - Thời gian bảo hành mới
  - `mainImage` - Ảnh chính mới (max 10MB)
  - `subImage` - Ảnh phụ mới (max 5 ảnh, mỗi ảnh max 10MB)

**Lưu ý:** Ít nhất 1 field phải được gửi lên

**Ví dụ - Cập nhật toàn bộ:**
```http
PUT http://localhost:5000/api/products/1
Content-Type: multipart/form-data

{
  productCode: "P001-V2",
  productNameVn: "Ghế Sofa 3 chỗ Cao Cấp",
  length: 210,
  width: 95,
  height: 90,
  materialVn: "Gỗ sồi nhập khẩu",
  colorVn: "Nâu đậm",
  price: 18000000,
  status: "active",
  mainImage: <new-file>,
  subImage: [<new-file1>, <new-file2>]
}
```

**Ví dụ - Chỉ cập nhật tên và giá (partial update):**
```http
PUT http://localhost:5000/api/products/1
Content-Type: multipart/form-data

{
  productNameVn: "Ghế Sofa Hiện Đại",
  price: 16000000
}
```

**Ví dụ - Chỉ cập nhật ảnh chính:**
```http
PUT http://localhost:5000/api/products/1
Content-Type: multipart/form-data

{
  mainImage: <new-file>
}
```

**Ví dụ - Chỉ cập nhật kích thước:**
```http
PUT http://localhost:5000/api/products/1
Content-Type: multipart/form-data

{
  length: 220,
  width: 100,
  height: 85
}
```

**Response Success (200):**
```json
{
  "status": "success",
  "message": "Product updated successfully",
  "source": "db",
  "data": {
    "main_image": "https://res.cloudinary.com/...",
    "sub_images": ["url1", "url2"],
    "updated_fields": ["product_name_vn", "price", "length"]
  }
}
```

**Response Errors:**
- `404` - Product not found
- `400` - Product code already exists
- `400` - Product type does not exist
- `400` - At least one field must be provided
- `500` - Internal server error

---

### 4. **DELETE /api/products/:product_id** - Xóa Product

**URL Parameters:**
- `product_id` (required) - ID của product cần xóa

**Ví dụ Request:**
```http
DELETE http://localhost:5000/api/products/1
```

**Response Success (200):**
```json
{
  "status": "success",
  "message": "Product deleted successfully",
  "source": null,
  "data": null
}
```

**Response Errors:**
- `404` - Product not found
- `500` - Internal server error

---

## 🔄 Luồng xử lý

### Create Product Flow:
1. **Multer** - Parse multipart/form-data và upload files
2. **convertMultipartBodyToSnakeCase** - Convert body từ camelCase → snake_case
3. **Validate** - Kiểm tra dữ liệu với productCreateSchema
4. **Controller**:
   - Kiểm tra product code có trùng không
   - Kiểm tra product type có tồn tại không
   - Upload ảnh chính lên Cloudinary (nếu có)
   - Upload các ảnh phụ lên Cloudinary (nếu có)
   - Insert vào database
   - Nếu lỗi, xóa tất cả ảnh đã upload (cleanup)

### Update Product Flow:
1. **Multer** - Parse multipart/form-data và upload files
2. **convertMultipartBodyToSnakeCase** - Convert body từ camelCase → snake_case
3. **Validate** - Kiểm tra với productUpdateSchema (partial)
4. **Controller**:
   - Kiểm tra product có tồn tại không
   - Kiểm tra product code mới có trùng không (nếu đổi code)
   - Kiểm tra product type mới có tồn tại không (nếu đổi type)
   - Upload ảnh mới lên Cloudinary (nếu có)
   - Update database
   - Xóa ảnh cũ từ Cloudinary (nếu có ảnh mới)
   - Nếu lỗi, xóa ảnh mới đã upload (rollback)
   - Invalidate cache

### Delete Product Flow:
1. **Controller**:
   - Kiểm tra product có tồn tại không
   - Lấy thông tin ảnh để xóa
   - Xóa product khỏi database
   - Xóa main_image từ Cloudinary (nếu có)
   - Xóa tất cả sub_images từ Cloudinary (nếu có)
   - Invalidate cache

---

## 📝 Validation Rules

### Create Product (Required fields):
```javascript
{
  productCode: string - Required, Unique
  productNameVn: string - Required
  length: number (positive) - Required
  width: number (positive) - Required
  height: number (positive) - Required
  materialVn: string - Required
  price: number (non-negative) - Required
  productTypeId: string - Required
  
  // Optional fields
  colorVn: string - Optional
  descriptionVn: string - Optional
  originVn: string - Optional
  warrantyPeriod: number (positive) - Optional
  status: enum ['active', 'inactive'] - Optional (default: 'active')
  mainImage: file (max 10MB) - Optional
  subImage: files (max 5 files, each max 10MB) - Optional
}
```

### Update Product (All fields optional):
```javascript
{
  // Tất cả fields đều optional, ít nhất 1 field phải được gửi lên
  productCode: string - Optional
  productNameVn: string - Optional
  length: number (positive) - Optional
  width: number (positive) - Optional
  height: number (positive) - Optional
  materialVn: string - Optional
  colorVn: string - Optional
  descriptionVn: string - Optional
  price: number (non-negative) - Optional
  productTypeId: string - Optional
  status: enum ['active', 'inactive'] - Optional
  originVn: string - Optional
  warrantyPeriod: number (positive) - Optional
  mainImage: file (max 10MB) - Optional
  subImage: files (max 5 files, each max 10MB) - Optional
}
```

---

## ⚙️ Features

### ✅ Tính năng đã implement:
- **CRUD đầy đủ**: GET, POST, PUT, DELETE
- **Partial Update**: Chỉ cập nhật các trường được gửi lên
- **Multi-Image Management**:
  - Upload 1 ảnh chính + tối đa 5 ảnh phụ
  - Auto cleanup: Xóa ảnh khỏi Cloudinary nếu tạo/update thất bại
  - Tự động xóa ảnh cũ khi upload ảnh mới
  - Xóa tất cả ảnh khỏi Cloudinary khi xóa product
- **Advanced Filtering**:
  - Filter by status, product type, category, color, price range
  - Search by product code, product name
  - Sort by created_at, product_name_vn, price
  - Pagination support
- **Validation**:
  - Validate product code uniqueness
  - Validate product type exists
  - Validate tất cả fields với Zod schema
  - Validate price range (minPrice <= maxPrice)
- **Cache**: Invalidation (xóa cache `products*`)
- **Auto Case Conversion**: camelCase ↔ snake_case
- **Logging**: Winston logger cho tất cả errors
- **JOIN Queries**: Tự động lấy thông tin product_type và category

---

## 🧪 Testing

Sử dụng file `http/product.http` để test:

```bash
# 1. Lấy danh sách products
GET http://localhost:5000/api/products

# 2. Lấy products với filters
GET http://localhost:5000/api/products?status=active&categoryId=1&minPrice=1000000

# 3. Tạo product mới (có ảnh)
POST http://localhost:5000/api/products
(xem ví dụ trong file)

# 4. Cập nhật toàn bộ product (có ảnh mới)
PUT http://localhost:5000/api/products/1
(xem ví dụ trong file)

# 5. Cập nhật chỉ tên và giá (partial update)
PUT http://localhost:5000/api/products/1
(xem ví dụ trong file)

# 6. Cập nhật chỉ ảnh chính (partial update)
PUT http://localhost:5000/api/products/1
(xem ví dụ trong file)

# 7. Xóa product
DELETE http://localhost:5000/api/products/1
```

---

## 🔒 Security & Best Practices

1. **Validation** - Sử dụng Zod để validate dữ liệu
2. **File Upload** - Giới hạn kích thước file (max 10MB) và số lượng (max 5 sub images)
3. **Error Handling** - Cleanup resources khi có lỗi, rollback khi update fail
4. **Database Constraints** - Kiểm tra foreign key và unique constraints
5. **Cache Management** - Invalidate cache sau khi thay đổi dữ liệu
6. **Logging** - Log tất cả errors với Winston
7. **Partial Updates** - Chỉ update các fields được gửi lên
8. **Image Cleanup** - Xóa ảnh cũ khi update, xóa tất cả ảnh khi delete

---

## 📌 Notes

- **Format dữ liệu**: Client gửi **camelCase**, server tự động convert sang **snake_case**
- **Upload ảnh**: 
  - Field name cho ảnh chính: `mainImage`
  - Field name cho ảnh phụ: `subImage` (có thể gửi nhiều files)
- **Product Type**: Phải tạo product type trước khi tạo product
- **Update**: Có thể update toàn bộ hoặc chỉ 1 vài fields (partial update)
- **Image Update**: 
  - Khi upload ảnh chính mới, ảnh chính cũ sẽ tự động bị xóa
  - Khi upload ảnh phụ mới, tất cả ảnh phụ cũ sẽ bị xóa và thay bằng ảnh mới
- **Sub Images**: Được lưu dạng JSON array trong database
- **Price Range**: Khi filter theo giá, minPrice phải <= maxPrice
- **Cache**: Tự động xóa cache khi có thay đổi

---

## 🎯 Summary

✅ **API hoàn chỉnh với CRUD operations:**
- **GET** - Lấy danh sách products (có filter nâng cao, sort, pagination)
- **POST** - Tạo mới product (có upload multi-images)
- **PUT** - Cập nhật product (partial update, có thể thay ảnh)
- **DELETE** - Xóa product (tự động xóa tất cả ảnh)

✅ **Multi-Image Management thông minh:**
- Upload 1 main image + max 5 sub images
- Auto cleanup khi lỗi
- Rollback khi update fail
- Replace ảnh cũ khi upload ảnh mới

✅ **Advanced Filtering:**
- Filter by nhiều criteria (status, type, category, color, price range)
- Search by code, name
- Sort by multiple fields
- Pagination support

✅ **Validation đầy đủ:**
- Check product code uniqueness
- Check product type exists
- Validate all fields với Zod
- Price range validation

---

**Created:** 2026-01-31
**Status:** ✅ Ready for production
