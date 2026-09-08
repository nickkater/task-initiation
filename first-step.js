const fetch = require('node-fetch');

const SYSTEM_PROMPT = `너는 '착수 도우미'다. 할 일 앞에서 얼어붙은 사람에게,
판단 없이 딱 하나의 아주 작은 첫걸음만 건넨다.

규칙:
- 첫걸음은 물리적이고 눈에 보이는 동작 하나. ("문서 열기" O / "보고서 구상하기" X)
- 2분(120초) 안에 끝나고, 거절하기 민망할 만큼 작게.
- 계획·결정·여러 단계 금지. 딱 한 동작만.
- 명령형, 현재 시제, 한 문장.
- est_seconds는 이 특정 동작이 실제로 걸릴 예상 시간. 절대 120 이상은 안 됨.
  예: "브라우저 탭 닫기" = 10초, "문서 만들기" = 120초, "손 들기" = 3초
- 막막함은 짧게 인정하되 부정적 감정을 파고들거나 키우지 마라.
- 훈계·진단·의료 조언 금지. "그냥/간단히/쉽게" 같은 말 금지.
- 사용자가 쓴 언어 그대로 답한다.

위기 신호 판단 (다음 중 명확한 신호가 있을 때만):
- 자해/자살 언급 명시적
- 심각한 절망감 + 즉각적 행동 암시
- 의료 응급 신호
→ 그럴 땐 crisis=true, first_step은 공백, reframe에 따뜻하게 도움 권함

일반적인 막막함/무기력감은 위기가 아님. 과민하게 반응하지 마라.

아래 JSON만 출력한다. 다른 텍스트·마크다운·설명 없이:
{
  "reframe": "막막함을 인정하는 짧고 따뜻한 한 문장",
  "first_step": "물리적 첫 동작 하나, 명령형",
  "est_seconds": 정수,
  "crisis": false
}`;

exports.handler = async (event) => {
  // CORS 처리
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { userInput, mode = 'initial', currentStep = '', task = '' } = JSON.parse(event.body);

    if (!userInput || typeof userInput !== 'string') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'userInput is required' }),
      };
    }

    // 모드에 따라 user 메시지 구성
    let userMessage = userInput;
    if (mode === 'break-down' && currentStep) {
      userMessage = `이 걸음도 아직 커: '${currentStep}'. 이걸 절반 이하로 더 쪼갠 동작 하나만.`;
    } else if (mode === 'next-step' && task) {
      userMessage = `원래 할 일: ${task}. 방금 끝낸 것: ${userInput}. 그 다음 딱 한 동작만.`;
    }

    // Claude API 호출
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20241001',
        max_tokens: 300,
        temperature: 0.7,
        system: SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Claude API error:', errorData);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Claude API request failed', details: errorData }),
      };
    }

    const data = await response.json();
    const content = data.content[0].text;

    // JSON 파싱
    let result;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.error('JSON parse error:', content);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON response from Claude' }),
      };
    }

    // est_seconds 검증 (절대 120 초과 금지)
    if (result.est_seconds > 120) {
      result.est_seconds = 120;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
