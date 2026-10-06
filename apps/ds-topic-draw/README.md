# 자료구조 과제 주제 뽑기

학생들이 룰렛 또는 카드 뒤집기로 자료구조 과제 주제를 하나씩 뽑고, 배정 현황을 실시간 대시보드로 함께 보는 페이지.

- 배포: Claude Artifact (`db`, `user` 기능 사용) https://claude.ai/artifact/WrZUvS3m39A43ErhjfGJA5
- `index.html`: 페이지 원본. `window.claude` 런타임이 있는 Artifact 뷰어에서만 저장/동기화가 동작한다.
- `seed/*.json`: 초기 주제 21개 (심화 단계와 트라이는 제외) (`topics` 컬렉션 문서). 문서 id = 파일 이름.

규칙: 학번당 1회, 주제당 1명. 동시 클릭은 문서 lease(acquire)로 막고, 누가 먼저 가져가면 다른 주제로 자동 재시도한다.
교수자(편집 권한)는 대시보드에서 배정 해제와 주제 추가를 할 수 있다.

## 로그인 없는 버전

Artifact 버전은 학생도 Claude 에 로그인해야 뽑을 수 있다. 로그인 없이 쓰려면 `apps-script/` 의 구글 Apps Script 버전을 쓴다. 설치 방법은 `apps-script/README.md`.
