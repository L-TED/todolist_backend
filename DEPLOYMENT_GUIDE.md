# Vercel + Render 배포 가이드

## 🚀 Prisma Rust Panic 에러 해결

### 원인분석

1. **Vercel의 Serverless 환경** - 각 함수 호출마다 새로운 Prisma 클라이언트 생성
2. **Render 무료 플랜의 연결 제한** - 동시 연결 수가 5-10으로 제한
3. **연결 풀 고갈** - 연결이 제때 반환되지 않아 Rust Panic 발생

### ✅ 적용된 해결책

#### 1. Prisma 클라이언트 최적화 (`lib/prisma.js`)

- Serverless 환경용 특별한 연결 풀 설정
- 글로벌 인스턴스 재사용 (개발 환경)
- Graceful shutdown 처리

#### 2. 에러 핸들러 개선 (`middleware/errorHandler.js`)

- Rust Panic을 503 상태 코드로 반환 (일시적 오류)
- 타임아웃 에러 감지 및 처리
- 상세한 로깅으로 디버깅 용이

#### 3. 서버 시작 로직 개선 (`index.js`)

- 5초 타임아웃으로 DB 연결 테스트
- 연결 실패 시에도 서버 정상 시작
- 프로덕션 환경 로깅 추가

### 📋 Vercel 환경 변수 설정

**Vercel 대시보드 → Settings → Environment Variables에 추가:**

```
NODE_ENV = production
DATABASE_URL = postgresql://[user]:[password]@dpg-xxx.render.com:5432/todo_pm3l
```

### 🔍 Render 데이터베이스 최적화

**Render 대시보드에서 확인할 사항:**

1. **연결 풀 설정**

   - PostgreSQL 버전 확인
   - SSL/TLS 연결 강제 여부

2. **데이터베이스 용량**

   - 무료 플랜: 256 MB
   - 동시 연결: 5-10개

3. **연결 문자열 포맷**
   ```
   postgresql://user:password@host:5432/dbname?schema=public
   ```

### 🚨 문제 해결 팁

**여전히 Rust Panic이 발생한다면:**

1. **Vercel 함수 재시작**

   - Deployment → Redeploy 클릭

2. **Render 데이터베이스 확인**

   - 연결 상태 확인
   - 쿼리 로그 확인

3. **환경 변수 재확인**

   - Vercel: NODE_ENV, DATABASE_URL 정확히 입력
   - 공백 제거

4. **PrismaPoolError 해결**
   ```javascript
   // 이미 적용됨
   datasources: {
     db: {
       url: process.env.DATABASE_URL,
     },
   }
   ```

### 📦 배포 순서

1. 코드 변경 커밋

   ```bash
   git add .
   git commit -m "Fix Prisma Rust Panic for Vercel + Render"
   git push origin main
   ```

2. Vercel 자동 배포 확인
3. `/health` 엔드포인트로 연결 상태 확인
4. 브라우저에서 API 테스트

### 🔗 관련 링크

- [Prisma 프로덕션 배포 가이드](https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/vercel-caching-issue)
- [Render PostgreSQL 문서](https://render.com/docs/databases)
- [Vercel 환경 변수 설정](https://vercel.com/docs/environment-variables)
