#!/bin/bash

# 1. Hỏi/nhận dữ liệu bạn muốn truyền đi
if [ -z "$1" ]; then
    read -p "Nhập dữ liệu muốn gửi sang Google Script: " DATA
else
    DATA="$1"
fi

# Check nếu không nhập gì thì báo lỗi
if [ -z "$DATA" ]; then
    echo "Lỗi: Dữ liệu không được để trống!"
    exit 1
fi

# 2. Thực hiện các lệnh Git tự động
echo "--- Đang thêm file vào Git ---"
git add .

echo "--- Đang commit với dữ liệu: $DATA ---"
git commit -m "$DATA"

echo "--- Đang push lên GitHub ---"
git push

echo "=> Push thành công! GitHub Actions đang xử lý dữ liệu của bạn."
