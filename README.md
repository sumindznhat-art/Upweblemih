#  ZENRO TOOL 

 tool phân tích Tài Xỉu MD5  Baccarat 

## 🚀 Deploy lên GitHub Pages

### Bước 1: Tạo repo
1. Vào https://github.com/new
2. Đặt tên repo (VD: `zenro-tool`)
3. Chọn **Public**
4. Bấm **Create repository**

### Bước 2: Upload files
Upload **tất cả** các file sau lên repo (giữ nguyên tên):
- `index.html`
- `style.css`
- `config.js`
- `db.js`
- `auth.js`
- `app.js`
- `admin.js`
- `engine.js`
- `README.md`

### Bước 3: Bật GitHub Pages
1. Vào **Settings** → **Pages**
2. Source: chọn **Deploy from a branch**
3. Branch: chọn **main** / **root**
4. Bấm **Save**
5. Đợi 1-2 phút, link web sẽ là:
   `https://<username>.github.io/<repo-name>/`

## 👑 Tài khoản Admin mặc định
- **Email:** `leminhdz@gmail.com`
- **Password:** `admin123`

⚠️ **ĐỔI MẬT KHẨU NGAY** sau khi deploy! Sửa trong file `config.js`:
```js
adminEmail: 'email_cua_ban@gmail.com',
adminPassword: 'matkhau_moi_manh',
