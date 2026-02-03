# Product Type API Documentation

## Tổng quan
API đầy đủ cho Product Type với CRUD operations: **GET**, **Tạo mới**, **Cập nhật** và **Xóa bỏ**.

---

## 📋 Các file đã tạo/sửa

### 1. **Controller Files**
- ✅ `src/controller/producttype/createProductType.js` - Controller tạo product type
- ✅ `src/controller/producttype/updateProductType.js` - Controller cập nhật product type
- ✅ `src/controller/producttype/deleteProductType.js` - Controller xóa product type
- ✅ `src/controller/producttype/index.js` - Đã cập nhật exports

### 2. **Model Files**
- ✅ `src/models/producttype.model.js` - Đã thêm các methods:
  - `getProductTypeById(productTypeId)` - Lấy product type theo ID
  - `hasAssociatedProducts(productTypeId)` - Kiểm tra có sản phẩm liên kết không
  - `updateProductType(productTypeId, updateData)` - Cập nhật product type
  - `deleteProductTypeById(productTypeId)` - Xóa product type

### 3. **Route Files**
- ✅ `src/routes/producttype.routes.js` - Đã thêm routes: POST, PUT, DELETE

### 4. **Validator Files**
- ✅ `src/validators/producttype.validator.js` - Đã thêm:
  - `productTypeSchema` - Validation cho create
  - `productTypeUpdateSchema` - Validation cho update (partial)
  - `productTypeQuerySchema` - Validation cho GET query

### 5. **HTTP Test Files**
- ✅ `http/producttype.http` - Đã thêm đầy đủ ví dụ request cho tất cả APIs

---

## 🚀 API Endpoints

### 1. **POST /api/product-types** - Tạo mới Product Type

**Request Format:**
- Content-Type: `multipart/form-data`
- Fields (camelCase - tự động convert sang snake_case):
  - `categoryId` (required) - ID của category
  - `productTypeNameVn` (required) - Tên product type tiếng Việt (max 255 ký tự)
  - `descriptionVn` (optional) - Mô tả tiếng Việt (max 1000 ký tự)
  - `status` (optional) - Trạng thái: `active` hoặc `inactive` (default: `active`)
  - `productTypeImage` (optional) - File ảnh (max 5MB)

**Ví dụ Request:**
```http
POST http://localhost:5000/api/product-types
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="categoryId"

1
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="productTypeNameVn"

Áo thun nam
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="descriptionVn"

Áo thun nam cotton cao cấp
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="status"

active
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="productTypeImage"; filename="producttype.jpg"
Content-Type: image/jpeg

< ./path/to/your/image.jpg
------WebKitFormBoundary7MA4YWxkTrZu0gW--
```

**Response Success (201):**
```json
{
  "status": "success",
  "message": "Product type created successfully",
  "source": "db",
  "data": {
    "imageUrl": "https://res.cloudinary.com/..."
  }
}
```

**Response Errors:**
- `400` - Category not found
- `400` - Product type name already exists
- `500` - Internal server error

---

### 2. **PUT /api/product-types/:product_type_id** - Cập nhật Product Type

**URL Parameters:**
- `product_type_id` (required) - ID của product type cần cập nhật

**Request Format:**
- Content-Type: `multipart/form-data`
- Fields (All optional - camelCase format):
  - `categoryId` - ID của category mới
  - `productTypeNameVn` - Tên product type mới (max 255 ký tự)
  - `descriptionVn` - Mô tả mới (max 1000 ký tự)
  - `status` - Trạng thái: `active` hoặc `inactive`
  - `productTypeImage` - File ảnh mới (max 5MB)

**Lưu ý:** Ít nhất 1 field phải được gửi lên

**Ví dụ - Cập nhật toàn bộ:**
```http
PUT http://localhost:5000/api/product-types/1
Content-Type: multipart/form-data

{
  categoryId: 2,
  productTypeNameVn: "Ghế Sofa Cao Cấp",
  descriptionVn: "Mô tả mới cho loại sản phẩm",
  status: "active",
  productTypeImage: <new-file>
}
```

**Ví dụ - Chỉ cập nhật tên (partial update):**
```http
PUT http://localhost:5000/api/product-types/1
Content-Type: multipart/form-data

{
  productTypeNameVn: "Ghế Sofa Hiện Đại"
}
```

**Ví dụ - Chỉ cập nhật ảnh:**
```http
PUT http://localhost:5000/api/product-types/1
Content-Type: multipart/form-data

{
  productTypeImage: <new-file>
}
```

**Response Success (200):**
```json
{
  "status": "success",
  "message": "Product type updated successfully",
  "source": "db",
  "data": {
    "image_url": "https://res.cloudinary.com/...",
    "updated_fields": ["product_type_name_vn", "description_vn"]
  }
}
```

**Response Errors:**
- `404` - Product type not found
- `400` - Category not found
- `400` - Product type name already exists
- `400` - At least one field must be provided
- `500` - Internal server error

---

### 3. **DELETE /api/product-types/:product_type_id** - Xóa Product Type

**URL Parameters:**
- `product_type_id` (required) - ID của product type cần xóa

**Ví dụ Request:**
```http
DELETE http://localhost:5000/api/product-types/1
```

**Response Success (200):**
```json
{
  "status": "success",
  "message": "Product type deleted successfully",
  "source": null,
  "data": null
}
```

**Response Errors:**
- `404` - Product type not found
- `400` - Cannot delete product type with associated products
- `500` - Internal server error

---

## 🔄 Luồng xử lý

### Create Product Type Flow:
1. **Middleware autoCaseConverter** - Chuyển camelCase → snake_case
2. **Multer** - Parse multipart/form-data và upload file
3. **convertMultipartBodyToSnakeCase** - Convert body sau khi multer parse
4. **Validate** - Kiểm tra dữ liệu với Zod schema
5. **Controller**:
   - Kiểm tra category có tồn tại
   - Kiểm tra tên product type có trùng không
   - Upload ảnh lên Cloudinary (nếu có)
   - Insert vào database
   - Nếu lỗi, xóa ảnh đã upload (cleanup)

### Update Product Type Flow:
1. **Middleware autoCaseConverter** - Chuyển camelCase → snake_case
2. **Multer** - Parse multipart/form-data và upload file
3. **convertMultipartBodyToSnakeCase** - Convert body sau khi multer parse
4. **Validate** - Kiểm tra với productTypeUpdateSchema (partial)
5. **Controller**:
   - Kiểm tra product type có tồn tại
   - Kiểm tra category mới có tồn tại (nếu đổi category)
   - Kiểm tra tên mới có trùng không (nếu đổi tên)
   - Upload ảnh mới lên Cloudinary (nếu có)
   - Update database
   - Xóa ảnh cũ từ Cloudinary (nếu có ảnh mới)
   - Nếu lỗi, xóa ảnh mới đã upload (rollback)
   - Invalidate cache

### Delete Product Type Flow:
1. **Middleware autoCaseConverter** - Chuyển params sang snake_case
2. **Controller**:
   - Kiểm tra product type có tồn tại
   - Kiểm tra có sản phẩm liên kết không
   - Xóa product type khỏi database
   - Xóa ảnh từ Cloudinary (nếu có)
   - Xóa cache liên quan

---

## 📝 Validation Rules

### Create Product Type:
```javascript
{
  categoryId: number (positive integer) - Required
  productTypeNameVn: string (1-255 chars) - Required
  descriptionVn: string (max 1000 chars) - Optional
  status: enum ['active', 'inactive'] - Optional (default: 'active')
  productTypeImage: file (max 5MB, image only) - Optional
}
```

### Update Product Type (All fields optional):
```javascript
{
  categoryId: number (positive integer) - Optional
  productTypeNameVn: string (1-255 chars) - Optional
  descriptionVn: string (max 1000 chars) - Optional
  status: enum ['active', 'inactive'] - Optional
  productTypeImage: file (max 5MB, image only) - Optional
}
// Note: Ít nhất 1 field phải được gửi lên
```

---

## ⚙️ Features

### ✅ Tính năng đã implement:
- **CRUD đầy đủ**: GET, POST, PUT, DELETE
- **Partial Update**: Chỉ cập nhật các trường được gửi lên
- **Image Management**:
  - Upload ảnh lên Cloudinary với folder riêng (`DDS/upload/producttype`)
  - Auto cleanup: Xóa ảnh khỏi Cloudinary nếu tạo/update thất bại
  - Tự động xóa ảnh cũ khi upload ảnh mới
  - Xóa ảnh khỏi Cloudinary khi xóa product type
- **Validation**:
  - Validate category có tồn tại trước khi tạo/update
  - Kiểm tra trùng tên product type
  - Validate tất cả fields với Zod schema
- **Protection**: Ngăn xóa product type có sản phẩm liên kết
- **Cache**: Invalidation (xóa cache `producttypes*` và `products*`)
- **Auto Case Conversion**: camelCase ↔ snake_case
- **Logging**: Winston logger cho tất cả errors

---

## 🧪 Testing

Sử dụng file `http/producttype.http` để test:

```bash
# 1. Tạo product type mới (có ảnh)
POST http://localhost:5000/api/product-types
(xem ví dụ trong file)

# 2. Tạo product type mới (không có ảnh)
POST http://localhost:5000/api/product-types
(xem ví dụ trong file)

# 3. Cập nhật toàn bộ product type (có ảnh mới)
PUT http://localhost:5000/api/product-types/1
(xem ví dụ trong file)

# 4. Cập nhật chỉ tên (partial update)
PUT http://localhost:5000/api/product-types/1
(xem ví dụ trong file)

# 5. Cập nhật chỉ ảnh (partial update)
PUT http://localhost:5000/api/product-types/1
(xem ví dụ trong file)

# 6. Xóa product type
DELETE http://localhost:5000/api/product-types/1
```

---

## 🔒 Security & Best Practices

1. **Validation** - Sử dụng Zod để validate dữ liệu
2. **File Upload** - Giới hạn kích thước file (max 5MB)
3. **Error Handling** - Cleanup resources khi có lỗi, rollback khi update fail
4. **Database Constraints** - Kiểm tra foreign key trước khi insert/delete/update
5. **Cache Management** - Invalidate cache sau khi thay đổi dữ liệu
6. **Logging** - Log tất cả errors với Winston
7. **Partial Updates** - Chỉ update các fields được gửi lên

---

## 📌 Notes

- **Format dữ liệu**: Client gửi **camelCase**, server tự động convert sang **snake_case**
- **Upload ảnh**: Sử dụng field name `productTypeImage`
- **Category**: Phải tạo category trước khi tạo product type
- **Update**: Có thể update toàn bộ hoặc chỉ 1 vài fields (partial update)
- **Image Update**: Khi upload ảnh mới, ảnh cũ sẽ tự động bị xóa khỏi Cloudinary
- **Xóa**: Không thể xóa product type nếu có sản phẩm đang sử dụng
- **Cache**: Tự động xóa cache khi có thay đổi

---

## 🎯 Summary

✅ **API hoàn chỉnh với CRUD operations:**
- **GET** - Lấy danh sách product types (có filter, sort, pagination)
- **POST** - Tạo mới product type (có upload ảnh)
- **PUT** - Cập nhật product type (partial update, có thể thay ảnh)
- **DELETE** - Xóa product type (có validation)

✅ **Image Management thông minh:**
- Upload/Delete/Replace ảnh tự động
- Cleanup khi lỗi, Rollback khi update fail

✅ **Validation đầy đủ:**
- Check category exists, name uniqueness
- Prevent delete với associated products

---

**Created:** 2026-01-31
**Updated:** 2026-01-31
**Status:** ✅ Ready for production
