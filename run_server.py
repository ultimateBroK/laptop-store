import http.server
import socketserver
import os
import webbrowser
import sys

# Configuration
PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Đảm bảo chỉ phục vụ các file từ thư mục hiện tại
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, format, *args):
        # Ghi log các yêu cầu vào console với định dạng dễ đọc
        print(f"[{self.log_date_time_string()}] {format % args}")

def run_server():
    try:
        # Thử khởi tạo server với cổng đã chọn
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            # Hỗ trợ cả IPv4 và IPv6
            httpd.allow_reuse_address = True  # Cho phép tái sử dụng địa chỉ nếu server bị dừng đột ngột
            print(f"Server started at http://localhost:{PORT}")
            print(f"Serving files from: {DIRECTORY}")
            print("Press Ctrl+C to stop the server")
            
            # Mở trình duyệt tự động (tùy chọn)
            open_browser = input("Do you want to open the browser automatically? (y/n): ").strip().lower()
            if open_browser == 'y':
                webbrowser.open(f"http://localhost:{PORT}")
            
            # Giữ server chạy
            httpd.serve_forever()

    except OSError as e:
        # Xử lý lỗi nếu cổng đã được sử dụng
        if "Address already in use" in str(e):
            print(f"Error: Port {PORT} is already in use. Please choose a different port.")
        else:
            print(f"An unexpected error occurred: {e}")
        sys.exit(1)

    except KeyboardInterrupt:
        # Xử lý khi người dùng nhấn Ctrl+C
        print("\nServer stopped.")

if __name__ == "__main__":
    run_server()