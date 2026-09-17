# 🌟 TaskFlow - Nền Tảng Quản Lý Công Việc & Trợ Lý Ảo Toàn Diện

TaskFlow không chỉ là một ứng dụng quản lý công việc (To-Do List) thông thường. Đây là một **Hệ sinh thái Quản lý Cá nhân Cao cấp (Premium)**, được trang bị Trí tuệ Nhân tạo (AI), hệ thống Gamification (Trò chơi hóa) và các công cụ Phân tích (Analytics) mạnh mẽ, giúp bạn x200% năng suất làm việc.

Dự án được xây dựng với kiến trúc hiện đại: **React.js + TailwindCSS + Framer Motion** (Frontend), **Node.js/Express** (Backend), và **SQL Server** (Database).

---

## 🔥 Tính năng Nổi bật (Premium Features)

### 🤖 1. Trợ Lý Ảo AI (Tích hợp Gemini 3.6 Flash)
- **🎤 Ghi âm tạo Task (Voice-to-Task):** Không cần gõ phím! Chỉ cần bấm Micro và nói (VD: *"Nhắc tôi nộp báo cáo lúc 3 giờ chiều mai khẩn cấp"*). AI sẽ tự động phân tích câu nói của bạn thành Tiêu đề, Hạn chót và Mức độ ưu tiên để tạo Task chỉ trong 1 giây.
- **📄 AI File Planner:** Tải lên một file PDF, Word, hoặc Excel. AI sẽ đọc tài liệu và tự động vạch ra một kế hoạch chi tiết (Timeline) kèm theo các Task cụ thể cho bạn.
- **🪄 Smart NLP Input:** Gõ tự do bằng tiếng Việt/Anh (VD: *"Họp team 9h sáng thứ hai"*), hệ thống tự động nhận diện và bóc tách thông tin.

### 🎮 2. Trải nghiệm Tương tác (Gamification & UX)
- **⌨️ Phím tắt Thông minh (Shortcuts):** Thao tác nhanh như các phần mềm chuyên nghiệp với `Ctrl + K` (Tìm kiếm), phím `C` (Tạo Task), phím `D` (Đổi giao diện Tối/Sáng).
- **📋 Kanban Board:** Kéo & thả (Drag and Drop) mượt mà giữa các cột trạng thái công việc (To Do, In Progress, Completed).
- **🎉 Hiệu ứng phần thưởng:** Bắn pháo hoa (Confetti) và âm thanh "Ting" đã tai mỗi khi bạn hoàn thành công việc.

### 📈 3. Phân Tích & Tối Ưu Hóa (Analytics & Productivity)
- **🍅 Đồng hồ Pomodoro:** Tích hợp đồng hồ tập trung Pomodoro. Đặc biệt, hệ thống tự động ghi nhận số lượng Pomodoro bạn đã dùng cho mỗi Task.
- **📊 Biểu đồ Thời gian (Time Analytics):** Dashboard thông minh cung cấp biểu đồ Tròn (Pie Chart) trực quan, cho biết bạn đã tiêu tốn bao nhiêu thời gian (số Phút) cho từng nhóm danh mục (Học tập, Công việc,...).
- **📧 Email Nhắc việc 8:00 AM:** Cứ đúng 8h sáng, một luồng Cronjob chạy ngầm sẽ gom tất cả các công việc trong ngày và gửi email nhắc nhở cực đẹp tới bạn.

---

## 🛠️ Hướng dẫn Cài đặt & Chạy dự án (Quick Start)

### 1. Yêu cầu hệ thống (Prerequisites)
- [Node.js](https://nodejs.org/) (Phiên bản 16.x trở lên)
- [SQL Server](https://www.microsoft.com/en-us/sql-server/sql-server-downloads) (Đã bật SQL Server Authentication)
- Git

### 2. Cấu hình Cơ sở dữ liệu (Database)
- Đăng nhập vào SQL Server (SQL Server Management Studio).
- Tạo một Database mới có tên: `taskflow_db`.
- *Lưu ý: Bạn KHÔNG cần phải tự tạo các bảng (Tables). Ứng dụng đã được tích hợp luồng chạy tự động tạo Bảng và Migrate dữ liệu ngay khi khởi động Server lần đầu.*

### 3. Cài đặt Backend
1. Mở Terminal, di chuyển vào thư mục backend: `cd backend`
2. Cài đặt thư viện: `npm install`
3. Tạo file `.env` (bạn có thể copy từ `.env.example` nếu có) và cấu hình các thông số sau:
   ```env
   PORT=5000
   DB_SERVER=localhost
   DB_USER=sa
   DB_PASSWORD=your_sql_password
   DB_NAME=taskflow_db
   JWT_SECRET=your_secret_key
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
4. Khởi động Backend: `npm start`
   *(Bạn sẽ thấy dòng chữ thông báo Server khởi động thành công và Database Connected).*

### 4. Cài đặt Frontend
1. Mở một Terminal mới, di chuyển vào thư mục frontend: `cd frontend`
2. Cài đặt thư viện: `npm install`
3. Khởi động giao diện: `npm run dev`
4. Mở trình duyệt và truy cập: `http://localhost:5173`

---

## 🎮 Hướng Dẫn Sử Dụng Phím Tắt (Hotkeys)
Để thao tác nhanh như một "Pro User", hãy ghi nhớ các phím tắt sau:
- **`Ctrl + K`** hoặc **`Cmd + K`**: Mở thanh Tìm kiếm nhanh (Global Search) từ bất kỳ đâu.
- Nhấn phím **`C`** (bất cứ khi nào bạn không gõ văn bản): Mở bảng Tạo công việc mới (Create Task).
- Nhấn phím **`D`**: Chuyển đổi nhanh giữa Chế độ Sáng (Light) và Tối (Dark).

---

## 🧪 Hướng dẫn Trải nghiệm Toàn bộ Chức năng (Testing Guide)
Để không bỏ sót bất kỳ tính năng "xịn xò" nào của TaskFlow, bạn hãy làm theo các bước trải nghiệm sau:

1. **Đăng ký & Đăng nhập:** Tạo ngay một tài khoản mới và truy cập vào Dashboard.
2. **Cá nhân hóa:** Vào Sidebar -> Đổi Theme Color, thử đổi ngôn ngữ Anh/Việt.
3. **Thử nghiệm AI File Planner:** Vào Dashboard, nhấn nút `AI File Plan` -> Tải lên một file PDF/Word bất kỳ của bạn -> Chờ AI trả về một Kế hoạch siêu chi tiết.
4. **Thử nghiệm AI Voice-to-Task:** Ở trang My Tasks, nhấn vào nút Micro 🎤 ở ô nhập liệu. Đọc một câu tiếng Việt hoặc Anh -> Dừng lại và xem AI điền thông tin tự động.
5. **Kéo thả Kanban:** Chuyển sang View Bảng (Board), kéo 1 công việc từ To Do sang Completed -> Nghe tiếng "Ting" và xem pháo hoa rơi màn hình.
6. **Kiểm tra Phân tích thời gian:** Bật đồng hồ Pomodoro (góc dưới bên phải), liên kết với một Task, để đồng hồ chạy hết 25 phút. Sau đó quay lại Dashboard -> Nhìn vào Biểu đồ Tròn (Pie Chart) -> Bấm nút `TIME` để xem thành quả!

---

*Cảm ơn bạn đã lựa chọn TaskFlow! Nếu bạn gặp bất kỳ lỗi nào hoặc muốn đóng góp ý tưởng, đừng ngần ngại tạo Issue trên dự án.*
