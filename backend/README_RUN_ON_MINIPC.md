# Hướng dẫn chạy backend trên mini PC tại nhà

## 1. Lấy mã nguồn về mini PC

### Cách 1: Clone từ GitHub (Khuyến nghị)
Trên mini PC, mở terminal và chạy:
```sh
git clone https://github.com/hoangnamtran09/eduhub.git
cd eduhub/backend
```

### Cách 2: Copy trực tiếp qua USB hoặc SCP
- **USB:** Copy toàn bộ thư mục dự án sang USB, cắm vào mini PC và chép ra.
- **SCP qua mạng LAN:** Trên máy chứa mã nguồn, chạy:
  ```sh
  scp -r /duong_dan/den/thu_muc/eduhub user@ip_mini_pc:/duong_dan/den/thu_muc_dich/
  ```

## 2. Cài đặt Python và pip (nếu chưa có)
- Ubuntu/Debian:
  ```sh
  sudo apt update
  sudo apt install python3 python3-venv python3-pip
  ```
- macOS:
  ```sh
  brew install python
  ```

## 3. Tạo và kích hoạt môi trường ảo
```sh
cd backend
python3 -m venv .venv
source .venv/bin/activate
```

## 4. Cài đặt dependencies
```sh
pip install -r requirements.txt
```

## 5. Chạy backend
```sh
python app/main.py
```
Hoặc nếu dùng FastAPI/Uvicorn:
```sh
uvicorn app.main:app --reload
```

## 6. Truy cập backend
- Mặc định chạy ở `http://127.0.0.1:8000` (nếu dùng uvicorn).
- Đảm bảo mở port nếu truy cập từ máy khác.

## 7. Ghi chú
- Nếu gặp lỗi thiếu pip: cài lại pip bằng lệnh:
  ```sh
  python3 -m ensurepip --upgrade
  ```
- Nếu gặp lỗi module, kiểm tra lại bước cài đặt dependencies.

---

## 8. Phần mềm quản lý backend (Process Manager)

Để quản lý, giám sát và tự động khởi động lại backend khi bị lỗi hoặc khi khởi động lại máy, nên dùng các phần mềm sau:

### 1. **systemd** (Linux)
- Tạo file service cho backend, ví dụ `/etc/systemd/system/backend.service`:
  ```
  [Unit]
  Description=Python Backend Service
  After=network.target

  [Service]
  User=youruser
  WorkingDirectory=/duong_dan/den/backend
  ExecStart=/duong_dan/den/backend/.venv/bin/python app/main.py
  Restart=always

  [Install]
  WantedBy=multi-user.target
  ```
- Kích hoạt:
  ```sh
  sudo systemctl daemon-reload
  sudo systemctl enable backend
  sudo systemctl start backend
  ```

### 2. **Supervisor**
- Cài đặt:
  ```sh
  pip install supervisor
  echo_supervisord_conf > supervisord.conf
  ```
- Thêm chương trình vào `supervisord.conf`:
  ```
  [program:backend]
  command=/duong_dan/den/backend/.venv/bin/python app/main.py
  directory=/duong_dan/den/backend
  autostart=true
  autorestart=true
  stderr_logfile=/var/log/backend.err.log
  stdout_logfile=/var/log/backend.out.log
  ```

### 3. **pm2** (dùng cho Node.js, nhưng có thể chạy Python)
- Cài đặt:
  ```sh
  npm install -g pm2
  pm2 start app/main.py --interpreter python3
  pm2 save
  pm2 startup
  ```

**Khuyến nghị:** Nếu dùng Linux, nên dùng systemd hoặc Supervisor để quản lý backend Python.