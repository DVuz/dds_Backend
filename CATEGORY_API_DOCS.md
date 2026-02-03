# Category API Documentation

## Overview
API endpoints for managing product categories with full CRUD operations, image upload support, and flexible filtering.

## Base URL
```
/api/categories
```

## Endpoints

### 1. GET /categories
Get all categories with filtering, sorting, and pagination.

#### Query Parameters (All Optional - camelCase format, auto-converted to snake_case)
| Parameter | Type | Description | Default | Example |
|-----------|------|-------------|---------|---------|
| `status` | string | Filter by status: `active`, `inactive`, or `all` | - | `active` |
| `categoryNameVn` | string | Search by Vietnamese category name (partial match) | - | `Ghế` |
| `page` | number | Page number (must be positive) | `1` | `1` |
| `limit` | number | Items per page (1-100) | `10` | `20` |
| `sortBy` | string | Sort field: `created_at` or `category_name_vn` | `created_at` | `category_name_vn` |
| `sortOrder` | string | Sort direction: `ASC` or `DESC` | `DESC` | `ASC` |

#### Request Examples
```http
# Get all active categories
GET /api/categories?status=active

# Search with pagination
GET /api/categories?categoryNameVn=Sofa&page=1&limit=10

# Sort by name ascending
GET /api/categories?sortBy=category_name_vn&sortOrder=ASC
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "source": "cache",
  "data": {
    "categories": [
      {
        "category_id": 1,
        "category_name_vn": "Ghế Sofa",
        "description_vn": "Các loại ghế sofa cao cấp",
        "image_url": "https://res.cloudinary.com/...",
        "status": "active",
        "created_at": "2026-01-30T10:00:00.000Z",
        "product_type_count": 5,
        "active_product_type_count": 3
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 15,
      "totalPages": 2
    }
  }
}
```

---

### 2. POST /categories
Create a new category with optional image upload.

#### Request Headers
```
Content-Type: multipart/form-data
```

#### Form Data Fields (All in camelCase format)
| Field | Type | Required | Max Length | Description |
|-------|------|----------|------------|-------------|
| `categoryNameVn` | string | Yes | 100 | Vietnamese category name |
| `descriptionVn` | string | No | 1000 | Vietnamese description |
| `status` | enum | No | - | `active` or `inactive` (default: `active`) |
| `categoryImage` | file | No | 5MB | Category image (jpg, png, etc.) |

#### Request Example
```http
POST /api/categories
Content-Type: multipart/form-data

{
  "categoryNameVn": "Ghế Sofa",
  "descriptionVn": "Các loại ghế sofa cao cấp",
  "status": "active",
  "categoryImage": <file>
}
```

#### Response (201 Created)
```json
{
  "success": true,
  "message": "Category created successfully",
  "source": "db",
  "data": {
    "image_url": "https://res.cloudinary.com/..."
  }
}
```

#### Error Responses

**400 Bad Request** - Category name already exists
```json
{
  "success": false,
  "message": "Category name in Vietnamese already exists"
}
```

**400 Bad Request** - Validation error
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "categoryNameVn",
      "message": "Category name in Vietnamese is required"
    }
  ]
}
```

---

### 3. PUT /categories/:category_id
Update an existing category. Can update all fields or just specific fields (partial update).

#### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `category_id` | number | Category ID to update |

#### Request Headers
```
Content-Type: multipart/form-data
```

#### Form Data Fields (All Optional - Update only the fields you want to change)
| Field | Type | Max Length | Description |
|-------|------|------------|-------------|
| `categoryNameVn` | string | 100 | Vietnamese category name |
| `descriptionVn` | string | 1000 | Vietnamese description |
| `status` | enum | - | `active` or `inactive` |
| `categoryImage` | file | 5MB | New category image (replaces old one) |

#### Request Examples

**Update all fields with new image:**
```http
PUT /api/categories/1
Content-Type: multipart/form-data

{
  "categoryNameVn": "Ghế Sofa Cao Cấp",
  "descriptionVn": "Các loại ghế sofa cao cấp nhập khẩu",
  "status": "active",
  "categoryImage": <new-file>
}
```

**Update only name (partial update):**
```http
PUT /api/categories/1
Content-Type: multipart/form-data

{
  "categoryNameVn": "Ghế Sofa Hiện Đại"
}
```

**Update only description:**
```http
PUT /api/categories/1
Content-Type: multipart/form-data

{
  "descriptionVn": "Mô tả mới cho danh mục"
}
```

**Update only status:**
```http
PUT /api/categories/1
Content-Type: multipart/form-data

{
  "status": "inactive"
}
```

**Update only image:**
```http
PUT /api/categories/1
Content-Type: multipart/form-data

{
  "categoryImage": <new-file>
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Category updated successfully",
  "source": "db",
  "data": {
    "image_url": "https://res.cloudinary.com/...",
    "updated_fields": ["category_name_vn", "description_vn"]
  }
}
```

#### Error Responses

**404 Not Found** - Category does not exist
```json
{
  "success": false,
  "message": "Category not found"
}
```

**400 Bad Request** - Category name already exists
```json
{
  "success": false,
  "message": "Category name in Vietnamese already exists"
}
```

**400 Bad Request** - No fields provided
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "message": "At least one field must be provided for update"
    }
  ]
}
```

---

### 4. DELETE /categories/:category_id
Delete a category by ID.

#### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `category_id` | number | Category ID to delete |

#### Request Example
```http
DELETE /api/categories/1
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Category deleted successfully",
  "data": null
}
```

#### Error Responses

**404 Not Found** - Category does not exist
```json
{
  "success": false,
  "message": "Category not found"
}
```

**400 Bad Request** - Category has associated product types
```json
{
  "success": false,
  "message": "Cannot delete category with associated product types"
}
```

---

## Features

### ✅ Automatic Case Conversion
- Send request data in **camelCase** format
- Backend automatically converts to **snake_case** for database operations
- Example: `categoryNameVn` → `category_name_vn`

### ✅ Image Management
- **Upload**: Automatically uploads images to Cloudinary
- **Update**: Replaces old image with new one and deletes old image from Cloudinary
- **Delete**: Removes image from Cloudinary when category is deleted
- **Cleanup**: Automatically removes uploaded images if transaction fails

### ✅ Validation
- Category name uniqueness check
- Maximum file size: 5MB
- Supported image formats: jpg, jpeg, png, gif, webp
- Field length validation

### ✅ Caching
- GET requests are cached in Redis
- Cache automatically invalidated on create/update/delete operations
- Pattern-based cache invalidation: `categories*`

### ✅ Flexible Updates
- Update all fields at once
- Partial updates (only specific fields)
- Optional image replacement
- Preserves unchanged fields

### ✅ Pagination & Filtering
- Flexible filtering by status and name
- Customizable sorting
- Pagination support
- Total count and page calculation

---

## Common Use Cases

### 1. Create Category with Image
```javascript
const formData = new FormData();
formData.append('categoryNameVn', 'Ghế Sofa');
formData.append('descriptionVn', 'Các loại ghế sofa cao cấp');
formData.append('status', 'active');
formData.append('categoryImage', imageFile);

fetch('/api/categories', {
  method: 'POST',
  body: formData
});
```

### 2. Update Only Category Name
```javascript
const formData = new FormData();
formData.append('categoryNameVn', 'Ghế Sofa Hiện Đại');

fetch('/api/categories/1', {
  method: 'PUT',
  body: formData
});
```

### 3. Replace Category Image
```javascript
const formData = new FormData();
formData.append('categoryImage', newImageFile);

fetch('/api/categories/1', {
  method: 'PUT',
  body: formData
});
```

### 4. Search Active Categories
```javascript
fetch('/api/categories?status=active&categoryNameVn=Sofa&page=1&limit=10');
```

---

## Notes

1. **CamelCase Convention**: All request parameters should use camelCase (e.g., `categoryNameVn`, `descriptionVn`)
2. **Image Cleanup**: Failed transactions automatically clean up uploaded images
3. **Soft Delete Option**: Use status update to `inactive` instead of hard delete when needed
4. **Cache Strategy**: Cache is invalidated on all write operations (create/update/delete)
5. **Validation**: All fields are validated before processing
6. **Partial Updates**: Only send the fields you want to update in PUT requests
