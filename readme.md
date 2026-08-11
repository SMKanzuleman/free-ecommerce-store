# Client Handoff & Setup Guide: AuraStore

This guide outlines how to set up, host, and configure your new e-commerce store completely free on GitHub Pages.

---

## 1. Hosting the Store (GitHub Pages)

To host the storefront under your own GitHub account:
1. **Upload the Code**: Create a repository in your GitHub account (e.g., `storefront`) and push these files to it.
2. **Enable GitHub Pages**:
   - Go to your repository **Settings** -> **Pages** (on the left sidebar).
   - Under **Build and deployment**, set the Source to **Deploy from a branch**.
   - Select the **`main`** branch and the **`/ (root)`** folder, then click **Save**.
   - After 1 minute, your site will be live at: `https://your-github-username.github.io/your-repository-name/`

---

## 2. Setting Up the Admin Panel Sync

Because this website has no backend database costs, it saves products and settings directly back to your GitHub repository. To give your Admin Panel permission to write changes:

### Step 1: Generate your GitHub Write Key (Token)
1. Go to your GitHub account **Settings** -> **Developer settings** (at the bottom of the left sidebar).
2. Click **Personal access tokens** -> **Tokens (classic)**.
3. Click **Generate new token** -> Select **Generate new token (classic)**.
4. Set a name (e.g., `store-admin-sync`) and check the **`repo`** checkbox.
5. Click **Generate token** at the bottom and copy the code (starts with `ghp_`).

### Step 2: Configure the Dashboard (One-Time Setup)
1. Open your live Admin Panel: `https://your-github-username.github.io/your-repository-name/admin.html`
2. Log in using the default security PIN: **`1234`**
3. Navigate to the **Store Settings** tab and fill in your details:
   - **WhatsApp Phone Number**: Your number with country code (e.g. `923017062739` without the `+`).
   - **Default Delivery Charges**: (e.g. `250`).
   - **GitHub Username**: Your GitHub username.
   - **Repository Name**: The name of your repository.
   - **GitHub PAT Token**: Paste the token (`ghp_...`) you copied in Step 1.
   - **Branch**: `main`.
4. Navigate to the **Footer Settings** tab and customize your store name, description, address, and social links.
5. Click **Save Settings**!

---

## 3. Managing Your Catalog
- **Add Products**: Go to **Add New Product**, type a title, price, select or create a category, add one or more image URLs (Unsplash, Google Drive share links, etc.), write a description, and click **Publish Product to Store**.
- **Edit/Delete**: Go to **Manage Products** to edit details or remove products from inventory.
- **Order Notifications**: When a customer checks out, you will receive a pre-formatted message directly on your configured WhatsApp number containing the customer's name, phone, address, and purchase list.
