# Render 배포 환경 변수 설정 가이드

## 🔧 Render Dashboard 설정 방법

### 1단계: Render에서 프로젝트 열기

- https://dashboard.render.com 접속
- 배포된 웹 서비스 선택

### 2단계: 환경 변수 설정

**Settings → Environment Variables**에서 아래 변수 추가:

```
DATABASE_URL=postgresql://user:password@host:port/dbname
NODE_ENV=production
```

### 3단계: 변수 값 확인

DATABASE_URL 형식:

```
postgresql://render:kaZpHi8JHvVvc8f9X4EYHJkD1VtVUDtw@dpg-d4nrpger433s73eb9abg-a.singapore-postgres.render.com:5432/todo_pm3l
```

### 4단계: 배포 재시작

**Deploy → Redeploy latest commit** 클릭

## 🚀 배포 후 확인

```bash
# 로그 확인
tail -f render.log

# API 헬스 체크
curl https://your-render-url.onrender.com/health

# 응답 예제
{
  "status": "healthy",
  "database": "connected"
}
```

## ❌ 문제 해결

### "Invalid value undefined for datasource"

**원인:** DATABASE_URL 환경 변수가 설정되지 않음
**해결:** Render Dashboard → Settings → Environment Variables에서 확인

### "Connection refused"

**원인:** Render PostgreSQL 데이터베이스에 연결할 수 없음
**해결:**

- DATABASE_URL 정확성 확인
- Render PostgreSQL이 정상 작동 중인지 확인
- 파이어월 규칙 확인

### "Too many connections"

**원인:** 동시 연결 수 초과
**해결:**

- Vercel 함수 인스턴스 줄이기
- 커넥션 풀 설정 조정
- Render 플랜 업그레이드
