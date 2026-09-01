# Requirements Document

## 1. Application Overview

**Name**: TechStore

**Description**: A dark-themed tech product e-commerce website featuring product browsing, cart and checkout flows, wishlist, user account management, and a separate admin dashboard for store operations. The site uses a dark navy/black background with blue accent colors throughout.

**Color Scheme**:
- Background: #0a0f1e
- Secondary background: #111827
- Card background: #1a2236
- Primary accent: #3b82f6
- Text primary: #ffffff
- Text secondary: #9ca3af
- Border: #1e2d45

---

## 2. Users and Use Cases

**Target Users**:
- Shoppers browsing and purchasing tech products
- Registered users managing orders, wishlist, and profile
- Store administrators managing products, orders, customers, and analytics

**Core Use Cases**:
- Browse products by category, search, or deals
- Add products to cart or wishlist, proceed to checkout
- Admin manages inventory, orders, and views analytics

---

## 3. Page Structure and Feature Description

### 3.1 Page Hierarchy

```
TechStore
├── Home Page (/)
├── Shop Page (/shop)
├── Product Detail Page (/product/:id)
├── Deals Page (/deals)
├── New Arrivals Page (/new-arrivals)
├── Brands Page (/brands)
├── Blog Page (/blog)
├── Contact Page (/contact)
├── Cart Page (/cart)
├── Checkout Page (/checkout)
├── Wishlist Page (/wishlist)
├── Account/Profile Page (/account)
└── Admin Dashboard (/admin)
    ├── Overview/Analytics (/admin)
    ├── Product Management (/admin/products)
    ├── Category Management (/admin/categories)
    ├── Order Management (/admin/orders)
    ├── Stock Management (/admin/stock)
    ├── Customer Management (/admin/customers)
    └── Settings (/admin/settings)
```

---

### 3.2 Global Layout

**Header** (all storefront pages):
- Left: TechStore logo with shopping bag/cart icon in blue
- Center: Search bar with \"All Categories\" dropdown and search button
- Right: Wishlist icon, Cart icon with item count badge, Account dropdown

**Top Navigation Bar**:
- Links: Home, Shop, Deals, New Arrivals, Brands, Blog, Contact

**Left Sidebar (Category Navigation)**:
- \"All Categories\" button (blue/highlighted) with grid icon
- Category list with icons: Laptops, Smartphones, Tablets, Accessories, Audio, Smartwatches, Gaming, Cameras, Monitors, Storage, Deals & Offers (fire icon, distinct highlight)

**Mobile Layout**:
- Bottom navigation bar: Home, Categories, Deals, Wishlist, Account
- Hamburger menu for top navigation
- Mobile-optimized product grid

---

### 3.3 Home Page (/)

**Hero Section**:
- Large banner with \"New Arrival\" badge
- Headline: \"Technology That Inspires\" (\"Inspires\" rendered in blue accent color)
- Subtext: \"Discover the latest tech gadgets and accessories at unbeatable prices.\"
- CTA buttons: \"Shop Now\" (blue filled), \"View Deals\" (outlined with arrow)
- Background features tech product imagery (laptops, phones, watches)

**Feature Badges** (below hero, 4 items):
- Free Delivery - On orders over $99
- 7 Days Return - Easy returns
- Secure Payment - 100% secure checkout
- 24/7 Support - Dedicated support

**Shop By Category Section**:
- Section header with \"View All\" link
- Grid of category cards, each showing product image, category name, and item count
- Categories: Laptops (120+ items), Smartphones (200+ items), Accessories (150+ items), Audio (100+ items), Smartwatches (80+ items), Gaming (90+ items), Cameras (70+ items), Storage (60+ items)

**Best Selling Products Section**:
- Section header with \"View All\" link
- Product cards each containing:
  - Product image
  - Sale badge (e.g., -15%, -20%, New, -10%, -12%)
  - Wishlist heart button
  - Product name
  - Star rating with review count
  - Current price and original price (strikethrough)
- Featured products: Apple MacBook Air M2, Samsung Galaxy S24 Ultra, Sony WH-1000XM5, Apple Watch Series 9, PlayStation 5, iPhone 15 Pro Max

---

### 3.4 Shop Page (/shop)

- Full product listing grid
- Left filter panel: price range slider, brand checkboxes, star rating filter
- Sorting options: relevance, price low-to-high, price high-to-low, newest, best rated
- Product cards consistent with Best Selling section style
- Pagination or load-more

---

### 3.5 Product Detail Page (/product/:id)

- Image gallery (main image + thumbnails)
- Product name, brand, rating with review count
- Current price and original price (strikethrough), discount badge
- Product description and specifications
- Quantity selector
- \"Add to Cart\" button and \"Add to Wishlist\" button
- Customer reviews section (star rating, review text, reviewer name)

---

### 3.6 Deals Page (/deals)

- Grid of discounted products with prominent discount badges
- Filter by discount percentage or category
- Product cards consistent with site style

---

### 3.7 New Arrivals Page (/new-arrivals)

- Grid of recently added products sorted by date added (newest first)
- \"New\" badge on product cards
- Product cards consistent with site style

---

### 3.8 Brands Page (/brands)

- Grid of brand cards showing brand logo/name
- Clicking a brand navigates to filtered shop listing for that brand

---

### 3.9 Blog Page (/blog)

- Grid of blog article cards: thumbnail, title, excerpt, date, read more link
- Individual article view with full content

---

### 3.10 Contact Page (/contact)

- Contact form: name, email, subject, message, submit button
- Store contact information displayed alongside the form

---

### 3.11 Cart Page (/cart)

- List of cart items: product image, name, unit price, quantity selector, remove button
- Order summary: subtotal, shipping cost, taxes, total
- \"Proceed to Checkout\" button
- \"Continue Shopping\" link

---

### 3.12 Checkout Page (/checkout)

Multi-step flow:

**Step 1 - Shipping Information**:
- Form fields: full name, email, phone, address, city, state/province, postal code, country

**Step 2 - Payment Method**:
- Payment options: Credit Card (card number, expiry, CVV), PayPal

**Step 3 - Order Review**:
- Order summary sidebar: item list, subtotal, shipping, taxes, total
- \"Place Order\" button

All steps styled to match the dark theme.

---

### 3.13 Wishlist Page (/wishlist)

- Grid of saved product cards
- Each card: product image, name, price, \"Add to Cart\" button, remove from wishlist button

---

### 3.14 Account/Profile Page (/account)

- User profile info: name, email, phone, edit profile form
- Order history list: order ID, date, status, total, view details link
- Order detail view: items, shipping address, payment method, status
- Change password section

**Login/Register**:
- Login page: email and password fields, submit button, link to register
- Register page: name, email, password, confirm password, submit button, link to login

---

### 3.15 Admin Dashboard (/admin)

Accessible via /admin route. Separate layout from storefront.

**3.15.1 Overview/Analytics (/admin)**:
- Summary cards: Total Sales, Total Orders, Total Customers, Revenue
- Sales charts: Daily, Weekly, Monthly (line/bar charts)
- Top selling products table
- Recent orders table

**3.15.2 Product Management (/admin/products)**:
- Table listing all products: image, name, price, stock quantity, category
- Add new product form: name, description, price, original price, category, stock, images upload
- Edit product: update any field including images
- Delete product

**3.15.3 Category Management (/admin/categories)**:
- List all categories with name and item count
- Add new category: name, icon
- Edit category name/icon
- Delete category

**3.15.4 Order Management (/admin/orders)**:
- Table of all orders: order ID, customer name, date, total, status
- Update order status: pending, processing, shipped, delivered
- Order detail view: items, customer info, shipping address, payment method

**3.15.5 Stock Management (/admin/stock)**:
- Table of products with current stock levels
- Inline stock quantity update
- Low stock alert indicator for products below threshold

**3.15.6 Customer Management (/admin/customers)**:
- Table of all registered customers: name, email, registration date, total orders
- Customer detail view: profile info and order history

**3.15.7 Settings (/admin/settings)**:
- Store settings: store name, contact email, currency
- Admin profile: name, email, change password

---

## 4. Business Rules and Logic

### 4.1 Cart
- Cart state persists across pages within a session
- Adding the same product increments quantity
- Quantity minimum is 1; removing at quantity 1 removes the item
- Cart item count badge in header reflects current cart item count
- Shipping cost and taxes calculated at checkout step

### 4.2 Wishlist
- Wishlist requires user to be logged in; unauthenticated users are redirected to login
- A product already in the wishlist shows a filled heart icon

### 4.3 Authentication
- Login and register are required to access wishlist, account, and checkout
- Unauthenticated users attempting to access protected pages are redirected to login
- Admin dashboard (/admin) is accessible only to users with admin role

### 4.4 Product Badges
- \"New\" badge: shown for products added within the last 30 days
- Discount badge (e.g., -15%): calculated from original price vs. current price

### 4.5 Search
- Search bar queries product name and category
- Results displayed on the Shop page with the search term applied as a filter

### 4.6 Data Storage
- All product, order, customer, cart, and wishlist data stored in backend database
- User authentication managed via backend auth service

---

## 5. Exceptions and Edge Cases

| Scenario | Handling |
|---|---|
| Product out of stock | \"Add to Cart\" button disabled; \"Out of Stock\" label shown |
| Empty cart | Cart page shows empty state message and \"Start Shopping\" link |
| Empty wishlist | Wishlist page shows empty state message |
| Checkout with empty cart | Redirect to cart page |
| Invalid search query | Shop page shows \"No products found\" message |
| Contact form submission failure | Show error message, allow retry |
| Order placement failure | Show error message, do not clear cart |

---

## 6. Acceptance Criteria

1. User opens the Home page and sees the hero banner, feature badges, category grid, and best selling products.
2. User clicks a category or \"Shop Now\" and is taken to the Shop page with relevant products listed.
3. User clicks a product card and views the Product Detail page with images, specs, and reviews.
4. User clicks \"Add to Cart\" and the cart icon badge updates with the correct item count.
5. User navigates to the Cart page, adjusts quantity, and sees the updated subtotal.
6. User clicks \"Proceed to Checkout\", completes shipping info, selects payment method, reviews order, and clicks \"Place Order\" to complete purchase.
7. Admin navigates to /admin, views the analytics dashboard with sales cards and charts, and can add/edit/delete a product.

---

## 7. Out of Scope (Not Implemented This Phase)

- Real payment gateway integration (payment UI is present but no live transaction processing)
- Email notification system for order confirmation
- Product review submission by users (reviews display only)
- Multi-language or multi-currency support
- Social login (Google, Facebook, etc.)
- Promotional coupon/discount code system
- Product comparison feature
- Live chat support widget
