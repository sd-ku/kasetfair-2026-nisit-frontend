# Deployment (การ Deploy)

### วิธีการ Deploy ด้วย Docker

โปรเจกต์นี้ใช้ Docker สำหรับการ deploy

```bash
docker compose up -d --build
```

### คำสั่งอื่นๆ ที่มีประโยชน์

**ดูสถานะของ container:**
```bash
docker compose ps
```

**ดู logs:**
```bash
docker compose logs -f
```

**หยุดการทำงาน:**
```bash
docker compose down
```

**หยุดและลบ volumes (ระวัง: จะลบข้อมูลทั้งหมด):**
```bash
docker compose down -v
```

### ข้อกำหนดเบื้องต้น

- ติดตั้ง [Docker](https://www.docker.com/get-started) และ Docker Compose
- ตรวจสอบว่ามีไฟล์ `docker-compose.yml` และ `Dockerfile` ในโปรเจกต์

### หมายเหตุ

หลังจาก deploy เสร็จแล้ว แอปพลิเคชันจะพร้อมใช้งานที่ port ที่กำหนดไว้ใน `docker-compose.yml` (โดยปกติคือ `http://localhost:3000`)
