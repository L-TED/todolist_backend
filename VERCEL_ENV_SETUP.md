# Vercel + Render 배포 환경 변수 설정 가이드

## 🔴 문제: "DATABASE_URL environment variable is not set"

이 에러는 Vercel Serverless Function에서 환경 변수가 제대로 로드되지 않을 때 발생합니다.

---

## ✅ 해결방법

### 1단계: Vercel Dashboard에서 환경 변수 설정

**https://vercel.com → Project Settings → Environment Variables**

아래 변수들을 **Production** 환경에 추가:

```
DATABASE_URL = postgresql://render:kaZpHi8JHvVvc8f9X4EYHJkD1VtVUDtw@dpg-d4nrpger433s73eb9abg-a.singapore-postgres.render.com:5432/todo_pm3l
NODE_ENV = production
```

### 2단계: .env 파일 설정 확인 (로컬)

```bash
# .env 파일 내용
DATABASE_URL="postgresql://render:...@dpg-xxx.com:5432/todo_pm3l"
NODE_ENV=development
```

### 3단계: 코드 구조 확인

새로운 구조:

```
backend/
├── index.js          # Express 앱 + 로컬 서버 시작
├── api/
│   └── index.js      # Vercel 진입점
└── lib/
    └── prisma.js     # dotenv/config 포함
```

---

## 🚀 배포 후 테스트

### Health Check

```bash
curl https://your-vercel-domain.com/health
```

### 예상 응답

```json
{
  "status": "healthy",
  "database": "connected"
}
```

### 에러가 발생하면

```bash
# Vercel 함수 로그 확인
vercel logs

# 또는 Vercel Dashboard → Deployments → Logs
```

---

## 🔍 디버깅 팁

### DATABASE_URL이 로드되지 않는 경우

1. **Vercel Dashboard 확인**

   - Settings → Environment Variables
   - Production 환경에 DATABASE_URL 확인
   - 값이 제대로 입력되었는지 확인 (공백 제거)

2. **로그 확인**

   ```bash
   # Prisma 디버그 로그 활성화
   DEBUG=prisma:* npm run dev
   ```

3. **Render 데이터베이스 상태 확인**
   - https://dashboard.render.com → PostgreSQL Database
   - 연결 상태 확인
   - 연결 제한 확인 (무료 플랜: 5-10개)

---

## 📦 재배포 방법

```bash
# 1. 코드 변경 커밋
git add .
git commit -m "Fix DATABASE_URL loading for Vercel"
git push origin main

# 2. Vercel 자동 배포 시작
# (GitHub 연동 시 자동)

# 3. 배포 상태 확인
vercel --prod

# 4. 헬스 체크
curl https://your-vercel-domain.com/health
```

---

## ⚠️ 주의사항

- **DATABASE_URL은 민감한 정보입니다** - 소스 코드에 직접 입력하지 마세요
- **Vercel Environment Variables 사용** - 배포 시에만 로드됨
- **.env 파일은 .gitignore에 포함** - 커밋하지 않기
