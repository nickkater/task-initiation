# 착수 도우미 (Task Initiation Helper)

할 일 앞에서 얼어붙은 당신을 위한 첫걸음 도우미입니다.

## 기능

- **첫걸음 생성**: 할 일을 입력하면 AI가 물리적인 첫걸음 하나만 제시
- **무한 쪼개기**: "이것도 너무 커?" 버튼으로 원하는 만큼 작게 쪼갤 수 있음
- **타이머**: 첫걸음에 집중하는 동안 함께 있어줌
- **포인트 시스템**: 시작과 완료에 포인트 부여 (감소 없음)
- **위기 신호 처리**: 자해·자살 신호 감지 시 도움 자원 제공

## 배포 (Netlify)

### 1. 프로젝트 설정

```bash
# 프로젝트 폴더에서
npm install
```

### 2. 환경변수 설정

```bash
# .env 파일 생성
cp .env.example .env

# ANTHROPIC_API_KEY를 실제 키로 교체
# .env:
# ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Netlify에 연결

```bash
# Netlify CLI 설치 (선택사항, 웹 대시보드에서도 가능)
npm install -g netlify-cli

# Netlify 연결
netlify link

# 배포
netlify deploy --prod
```

또는 **Netlify 웹 대시보드**에서:
1. GitHub 저장소 연결
2. 빌드 명령어: `npm run build`
3. 발행 디렉토리: `build`
4. 환경변수 추가: `ANTHROPIC_API_KEY`

### 4. 확인

배포 URL에서:
- 입력 화면 로드
- API 함수 호출 (콘솔에서 네트워크 탭 확인)
- JSON 응답 검증

## 개발

### 로컬 실행

```bash
npm start
```

React 앱이 `http://localhost:3000`에서 시작되고,
Netlify 함수는 `http://localhost:8888/.netlify/functions/first-step`에서 실행됩니다.

### 프롬프트 개선

`netlify/functions/first-step.js`의 `SYSTEM_PROMPT`를 수정하고 저장하면 다음 호출부터 반영됩니다.

## 아키텍처

```
Input (textarea) 
  → handleGetStep() 
  → POST /.netlify/functions/first-step 
  → Claude Haiku API (system prompt + user input)
  → JSON response 
  → setFirstStep() + screen = 'step'
  → Display first-step box
  → User clicks "더 잘게" or "지금 시작"
```

### Netlify Function 흐름

1. **초기 요청** (`mode: 'initial'`)
   - User input 그대로 Claude에 전달

2. **더 잘게** (`mode: 'break-down'`)
   - `"이 걸음도 아직 커: '{step}'. 절반 이하로 쪼갠 동작 하나만."`

3. **다음 걸음** (`mode: 'next-step'`)
   - `"원래 할 일: {task}. 방금 끝낸 것: {completed}. 그 다음 동작 하나만."`

모든 모드가 같은 JSON 포맷으로 응답하므로, 프론트엔드는 파싱이 단순합니다.

## 포인트 시스템

- **시작**: +10점
- **완료**: +15점
- **연쇄(다음 걸음)**: +5점
- **감소 없음**: 절대 점수는 올라만 갑니다
- **저장**: 브라우저 localStorage에 저장

## 위기 신호 처리

프롬프트가 다음 중 명확한 신호를 감지하면 `crisis: true`를 반환합니다:
- 자해/자살 언급 명시적
- 심각한 절망감 + 즉각적 행동 암시
- 의료 응급 신호

이 경우 첫걸음을 주지 않고, 도움 자원(위기 상담전화)을 제공합니다.

## 파일 구조

```
task-initiation/
├── netlify/
│   └── functions/
│       └── first-step.js       # Claude API 호출 함수
├── public/
│   └── index.html              # HTML 진입점
├── src/
│   ├── App.jsx                 # React 컴포넌트 (4화면)
│   ├── App.css                 # 스타일
│   └── index.jsx               # 진입점
├── package.json
├── netlify.toml                # Netlify 설정
└── README.md
```

## 주의사항

- **API 키**: 환경변수로만 관리 (절대 코드에 노출 금지)
- **CORS**: Netlify Function은 자동으로 CORS 처리됨
- **Rate limit**: Claude API는 분당 요청 제한 있음
- **로컬스토리지**: 포인트는 브라우저 저장소만 사용 (서버 sync 없음)

## 향후 개선

- [ ] 포인트로 테마/톤 언락 (IAP)
- [ ] 완료 히스토리 추적
- [ ] 친구 초대/공유
- [ ] 데스크톱 PWA
- [ ] 다국어 지원 (한국어/영어/베트남어)
