# Media Management System – Phase 1

### INFS3201 – Fall 2025

**Team Members:**

* Shaza Saad - 60301815
* Sarah Mohamed - 60101453
* jahan Elsaid - 60100358

---

## Overview

This project is a **Media Management System** that allows users to register, log in, upload photos, and manage visibility and comments.
It builds upon **Assignment 3**, which served as the foundation for our Phase 1 development.

Phase 1 focuses on **user authentication**, **photo visibility**, and **commenting functionality**.

---

## Features Implemented (Phase 1)

* ✅ User registration and login (authentication)
* ✅ View all **public** photos and **user-owned** photos
* ✅ Add **visibility flag** (public/private) for photos
* ✅ Allow logged-in users to **edit their own photos**
* ✅ Logged-in users can **comment** on public or owned photos
* ✅ Comments are **visible to all users**
* ✅ Non-logged-in users are **redirected** to the login page

> Future development (Phase 2) will include album galleries, uploads, email notifications, and search functionality.

---

## Architecture

This project follows a **layered architecture** consisting of:

* **Presentation Layer:** UI templates and routes for user interaction
* **Business Logic Layer:** Core functionality and logic handling
* **Persistence Layer:** Database operations and persistence

---

## Project Structure

```
INFS3201_FALL2025_PROJECT/
 ├─ public/
 │   ├─ photos/
 |   |   └── (all photos used for this application)
 │   └── css/
 │       └── styles.css
 ├─ src/
 |   ├── business.js
 |   ├── presentation.js
 |   └── persistence.js   
 ├─ views/
 |   ├─ layouts/
 |   |   └── main.hbs
 │   ├─ index.hbs
 │   ├─ albums.hbs
 │   ├─ photos.hbs
 │   ├─ error.hbs
 │   ├─ login.hbs
 │   ├─ registration.hbs
 │   └── editphoto.hbs
 ├─ .gitignore
 ├─ app.js
 ├─ package-lock.json
 ├─ package.json
 └── README.md
```
---

## Database Connection

**Connection String:**

```
mongodb+srv://60301815:60301815@60301815.kxwbpk3.mongodb.net/
```

**Username:** `60301815`
**Password:** `60301815`

---

## Setup & Run Instructions

1. **Clone the repository**

   ```bash
   git clone https://github.com/ShazaSaad/infs3201_fall2025_project.git
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the application**

   ```bash
   node app.js
   ```

4. **Access the system**

   * Open your browser and go to:
     👉 `http://localhost:8000`

5. **Test Application**

   You can use the following users to test the application:

   - **Username:** `jahan` | **Password:** `111`  
   - **Username:** `shaza` | **Password:** `222`  
   - **Username:** `sara` | **Password:** `333`

---

## Base Code Reference

This project **extends Assignment 3** solution code, which included:

* Basic photo listing and upload features
* Initial database schema and routing setup

All new Phase 1 functionality builds upon that foundation.

---

## Future Improvements (Phase 2 Preview)

* Album galleries with thumbnail grids
* Email notification system for photo comments
* Photo uploads and tagging system
* Search functionality (by title, tag, description)
