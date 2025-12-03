# 코드 검토 및 개선 사항

## 1️⃣ Prisma Schema 개선

### ✅ 변경 사항

- **@updatedAt 추가**: `updated_at` 필드에 `@updatedAt` 적용

  ```prisma
  updated_at  DateTime   @updatedAt @db.Timestamptz(6)
  ```

  자동으로 매 업데이트 시 현재 시간으로 갱신됨

- **인덱스 추가**: 쿼리 성능 최적화

  ```prisma
  @@index([todolist_id])      // subtasks에서 todolist 조회 최적화
  @@index([created_at])       // todolists 정렬 최적화
  @@index([original_todolist_id]) // deletedsubtasks 조회 최적화
  ```

- **onDelete 정책 개선**: `NoAction` → `Cascade`
  ```prisma
  todolists   todolists? @relation(..., onDelete: Cascade, ...)
  ```
  todolist 삭제 시 관련 subtasks도 자동 삭제

---

## 2️⃣ Prisma Client 싱글톤 패턴 (CRITICAL FIX)

### ❌ 문제점

```javascript
// ❌ 각 라우터에서 새로운 인스턴스 생성 → 메모리 누수
const prisma = new PrismaClient();
```

### ✅ 해결책

**lib/prisma.js** 생성 - 싱글톤 패턴 구현

```javascript
const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

**라우터에서 사용**

```javascript
import { prisma } from "../lib/prisma.js";
```

---

## 3️⃣ 에러 처리 개선

### ❌ 문제점

- Prisma 에러 타입별 처리 없음
- 모든 에러가 500으로 반환됨

### ✅ 해결책

**middleware/errorHandler.js** - 전역 에러 핸들러

```javascript
// PrismaClientKnownRequestError 타입별 처리
- P2025: Record not found (404)
- P2003: Foreign key constraint (400)
- P2002: Unique constraint (400)

// asyncHandler로 try-catch 자동화
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```

---

## 4️⃣ 입력 값 검증 추가

### ❌ 문제점

- 문자열 길이 검증 없음
- ID 파싱 에러 처리 부족
- 타입 검증 없음

### ✅ 해결책

**utils/validation.js** - 중앙 집중식 검증

```javascript
- validateDescription(): 문자열, 길이 (1-500) 검증
- validateId(): ID 파싱, 양수 검증
- validateBoolean(): 불린 타입 검증
- ValidationError 클래스로 상태 코드 전달
```

---

## 5️⃣ N+1 쿼리 최적화

### ❌ 문제점 (기존 PATCH 엔드포인트)

```javascript
// 2번의 쿼리 실행
const todolist = await prisma.todolists.findUnique(...);  // 1번
const updatedTodolist = await prisma.todolists.update(...); // 2번
```

### ✅ 해결책

```javascript
// 1번의 쿼리로 통합
const updatedTodolist = await prisma.todolists.update({
  where: { id },
  data: updateData, // 유효성 검증 후 데이터만 넘김
  include: { subtasks: true },
});
```

---

## 6️⃣ 트랜잭션 최적화

### ⚠️ 개선 사항 (DELETE /todolists/:id)

```javascript
// 기존: for 루프로 subtask 하나씩 저장
for (const subtask of subtasks) {
  await tx.deletedsubtasks.create(...);
}

// 개선: createMany로 배치 저장 (더 빠름)
await tx.deletedsubtasks.createMany({
  data: todolist.subtasks.map(...)
});
```

---

## 7️⃣ API 구조 개선

### ✅ 추가 변경사항

**index.js**

- CORS 미들웨어 추가
- 환경 변수 로딩 (`import "dotenv/config"`)
- PORT 환경 변수 지원
- 404 핸들러 추가
- 전역 에러 핸들러 등록

**라우터**

- asyncHandler로 모든 라우트 감싸기 (자동 에러 캐칭)
- findUniqueOrThrow() 사용으로 404 자동 처리
- validateId, validateBoolean 사용으로 검증 통일

---

## 📊 성능 비교

| 작업                 | 기존                    | 개선 후               |
| -------------------- | ----------------------- | --------------------- |
| PATCH 쿼리 수        | 2 (findUnique + update) | 1 (update)            |
| DELETE subtasks 저장 | N개 쿼리 (for 루프)     | 1개 쿼리 (createMany) |
| Prisma 인스턴스      | 3개 (메모리 낭비)       | 1개 (싱글톤)          |
| ID 파싱 에러         | 미처리                  | 검증됨                |
| 에러 응답            | 모두 500                | 타입별 처리           |

---

## 🔄 마이그레이션 가이드

### Step 1: 새 파일 구조 확인

```
backend/
├── index-improved.js          ← 새 메인 파일
├── lib/
│   └── prisma.js              ← 싱글톤 관리
├── middleware/
│   └── errorHandler.js        ← 에러 처리
├── utils/
│   └── validation.js          ← 입력 검증
├── routes/
│   ├── todolists-improved.js  ← 개선된 라우터
│   └── subtasks-improved.js   ← 개선된 라우터
├── prisma/
│   └── schema-improved.prisma ← 개선된 스키마
└── .env-example               ← 환경 변수 템플릿
```

### Step 2: 적용 (기존 파일 교체)

```bash
# 1. 스키마 업데이트
cp prisma/schema-improved.prisma prisma/schema.prisma

# 2. 마이그레이션 실행
npx prisma migrate dev --name update_schema

# 3. 메인 파일 교체
cp index-improved.js index.js

# 4. lib, middleware, utils 디렉토리 구조 유지
```

### Step 3: 검증

```bash
npm run dev
```

---

## ✅ 체크리스트

- [x] Prisma Schema: @updatedAt, 인덱스 추가
- [x] Prisma Client: 싱글톤 패턴
- [x] API: asyncHandler로 에러 자동 처리
- [x] 검증: 입력값 중앙 집중식 검증
- [x] 성능: N+1 쿼리 제거, 배치 처리
- [x] 에러: PrismaError 타입별 처리
- [x] 구조: 라우터, 미들웨어, 유틸 분리
- [x] 환경: dotenv 설정, 포트 설정 가능

---

## 📌 추가 권장 사항

### 1. 로깅 강화

```javascript
// 구현 예제
import winston from 'winston';
const logger = winston.createLogger({...});
```

### 2. 요청 제한 (Rate Limiting)

```javascript
import rateLimit from "express-rate-limit";
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use("/api/", limiter);
```

### 3. 요청/응답 검증 스키마

```javascript
import joi from "joi"; // package.json에 이미 설치됨
const schema = joi.object({ description: joi.string().required() });
```

### 4. API 문서화

```javascript
import swagger from "swagger-ui-express";
```
