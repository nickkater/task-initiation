# Netlify 배포 가이드 (단계별)

## 준비 사항

1. **GitHub 계정** (또는 GitLab, Bitbucket)
2. **Netlify 계정** (https://netlify.com - 무료)
3. **Claude API 키** (https://console.anthropic.com)

---

## 1단계: GitHub에 코드 푸시

```bash
# 로컬에서
cd task-initiation

# Git 초기화 (이미 repo가 있다면 스킵)
git init
git add .
git commit -m "Initial commit: task initiation MVP"

# GitHub에 푸시
git remote add origin https://github.com/YOUR_USERNAME/task-initiation.git
git branch -M main
git push -u origin main
```

---

## 2단계: Netlify에 연결 (웹 대시보드)

### Option A: GitHub 연결 (권장)

1. https://app.netlify.com 로그인
2. **Add new site** → **Import an existing project**
3. **Connect to Git** → **GitHub** 선택
4. 저장소 `task-initiation` 선택
5. 빌드 설정 자동 감지:
   - Build command: `npm run build`
   - Publish directory: `build`
   - Functions directory: `netlify/functions`
6. **Deploy site** 클릭

### Option B: 드래그 드롭 배포 (테스트용)

1. 로컬에서 빌드: `npm run build`
2. Netlify 대시보드 드래그 드롭 영역에 `build` 폴더 드롭
3. (임시 URL이 생기지만, 함수는 동작 안 함 — Option A 권장)

---

## 3단계: 환경변수 설정

Netlify 대시보드:

1. 사이트 선택
2. **Site settings** → **Build & deploy** → **Environment**
3. **Add variable**
4. 키: `ANTHROPIC_API_KEY`
5. 값: Claude API 키 (https://console.anthropic.com에서 복사)
6. **Save**

---

## 4단계: 재배포

환경변수 설정 후 자동으로 재배포되거나,
**Deploys** → **Trigger deploy** → **Deploy site** 수동 트리거 가능

---

## 5단계: 테스트

배포 URL (예: `https://task-initiation-abc123.netlify.app`):

1. 입력칸에 "보고서 써야 하는데 손도 못 대"
2. **첫걸음 받기** 클릭
3. AI 응답 확인:
   - `reframe` 표시
   - `first_step` 표시
   - 포인트 업데이트 확인

---

## 트러블슈팅

### 빌드 실패

**에러**: `npm: not found`
- Netlify는 Node.js 자동 설치
- 문제 없으면 로그 확인: **Deploys** → 배포 클릭 → **Deploy log**

**에러**: `ANTHROPIC_API_KEY is not defined`
- **Site settings** → **Build & deploy** → **Environment**에서 설정 확인
- 값이 정확히 입력되었는지 확인 (공백 없음)

### 함수 호출 실패

**에러**: `POST /.netlify/functions/first-step 404`
- 배포 로그에서 함수 빌드 확인
- `netlify.toml`의 `functions` 경로 확인 (`netlify/functions`)
- 함수 파일명 확인 (`first-step.js`)

**에러**: `Claude API error: 401 Unauthorized`
- API 키 다시 확인
- 키가 활성화되어 있는지 확인 (https://console.anthropic.com)
- 환경변수 재설정 후 재배포

### API 응답이 JSON이 아님

**현상**: 콘솔에서 `JSON parse error`
- Claude 응답이 JSON 아님
- 프롬프트에서 `abelow JSON만 출력한다` 부분 강화
- 또는 `first-step.js`의 프롬프트 수정 후 재배포

---

## 로컬 개발 (선택사항)

```bash
# Netlify CLI 설치
npm install -g netlify-cli

# 프로젝트 폴더에서
netlify dev

# http://localhost:8888 에서 함수 포함 실행
# http://localhost:3000 에서 React 앱 실행

# .env 파일 (로컬에만 필요)
# 내용:
# ANTHROPIC_API_KEY=sk-ant-...
```

---

## 커스터마이징

### 프롬프트 수정

`netlify/functions/first-step.js` → `SYSTEM_PROMPT` 수정 후 배포

### UI 수정

`src/App.jsx`, `src/App.css` 수정 후 배포

### 포인트 값 조정

`src/App.jsx`에서:
- `handleGetStep()` 내 `setPoints((prev) => prev + 10)` → 다른 값으로
- `handleCompleted()` 내 `setPoints((prev) => prev + 15)` → 다른 값으로
- `handleNextStep()` 내 `setPoints((prev) => prev + 5)` → 다른 값으로

---

## 성능 최적화 (향후)

- **API 응답 캐싱**: 같은 입력에 대해 캐시 (localStorage)
- **번들 최적화**: 불필요한 의존성 제거
- **이미지 압축**: SVG/PNG 최적화

---

## 보안 체크리스트

- ✓ API 키는 `.env`에 (코드에 노출 X)
- ✓ `.env` 파일은 `.gitignore`에 추가
- ✓ Netlify 환경변수로만 관리
- ✓ 함수에서 입력값 검증 (XSS 방지)
- ✓ CORS 헤더 설정됨

---

## 다음 단계

1. **인스타 프로필 업데이트**
   - 바이오에 배포 URL 추가
   - 예: "착수 도우미 (링크)" + URL

2. **콘텐츠 연결**
   - 데일리교민 콘텐츠에서 앱 언급
   - 예: "보고서 앞에 얼어붙었어? 착수 도우미 써봐" + 링크

3. **모니터링**
   - Netlify Analytics 확인
   - 사용자 피드백 수집
   - 프롬프트 개선

---

## 추가 리소스

- Netlify 문서: https://docs.netlify.com
- Claude API: https://docs.anthropic.com
- React 배포: https://create-react-app.dev/deployment/netlify/
