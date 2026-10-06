/**
 * 자료구조 과제 주제 뽑기 (로그인 없는 버전)
 *
 * 구글 시트에 붙은 Apps Script 웹 앱. 학생은 링크만 열면 뽑을 수 있고,
 * 배정 결과는 이 시트의 topics 탭에 그대로 쌓인다.
 * 설치 방법은 같은 폴더의 README.md 참고.
 */

const SHEET_NAME = 'topics';
const HEADERS = ['id', 'title', 'en', 'cat', 'level', 'bigO', 'desc', 'order', 'claimedBy', 'studentNo', 'claimedAt'];
const CACHE_KEY = 'state-v1';
const CACHE_SECONDS = 3;

const SEED = [
  ["array", "배열", "Array", "linear", "기초", "접근 O(1)", "인덱스로 바로 접근하는 연속 메모리 구조. 동적 배열의 확장 전략까지 다룬다.", 1],
  ["sll", "단일 연결 리스트", "Singly Linked List", "linear", "기초", "삽입 O(1)", "노드와 포인터로 이어진 리스트. 삽입·삭제와 역순 뒤집기를 구현한다.", 2],
  ["dll", "이중 연결 리스트", "Doubly Linked List", "linear", "기초", "삭제 O(1)", "앞뒤 포인터를 모두 가진 리스트. 양방향 순회와 노드 삭제를 비교한다.", 3],
  ["cll", "원형 연결 리스트", "Circular Linked List", "linear", "기초", "삽입 O(1)", "마지막 노드가 처음을 가리키는 구조. 요세푸스 문제에 응용한다.", 4],
  ["stack", "스택", "Stack", "linear", "기초", "push/pop O(1)", "후입선출 구조. 괄호 검사와 후위 표기식 계산을 구현한다.", 5],
  ["queue", "큐", "Queue", "linear", "기초", "enqueue O(1)", "선입선출 구조. 배열과 연결 리스트 구현을 비교한다.", 6],
  ["cqueue", "원형 큐", "Circular Queue", "linear", "기초", "enqueue O(1)", "배열 공간을 재활용하는 큐. 가득 참과 빔을 구분하는 방법을 정리한다.", 7],
  ["deque", "덱", "Deque", "linear", "중급", "양끝 삽입 O(1)", "양쪽 끝에서 넣고 빼는 구조. 슬라이딩 윈도 최댓값에 응용한다.", 8],
  ["sparse", "희소 행렬", "Sparse Matrix", "linear", "중급", "전치 O(t)", "0이 대부분인 행렬을 삼원소 표현으로 저장하고 전치 연산을 구현한다.", 9],
  ["bintree", "이진 트리와 순회", "Binary Tree Traversal", "tree", "기초", "순회 O(n)", "전위·중위·후위·레벨 순회를 재귀와 반복으로 구현한다.", 10],
  ["bst", "이진 탐색 트리", "Binary Search Tree", "tree", "중급", "탐색 O(h)", "삽입·탐색·삭제를 구현하고 편향 트리의 문제를 확인한다.", 11],
  ["heap", "힙", "Binary Heap", "tree", "중급", "삽입 O(log n)", "완전 이진 트리 기반 최대·최소 힙과 힙 정렬을 구현한다.", 16],
  ["pq", "우선순위 큐", "Priority Queue", "tree", "중급", "추출 O(log n)", "힙으로 만든 우선순위 큐로 작업 스케줄러를 시뮬레이션한다.", 17],
  ["hash", "해시 테이블", "Hash Table", "hash", "중급", "평균 탐색 O(1)", "해시 함수 설계와 적재율, 재해싱을 다룬다.", 22],
  ["chaining", "체이닝 충돌 해결", "Separate Chaining", "hash", "중급", "평균 탐색 O(1+α)", "버킷마다 리스트를 두어 충돌을 해결하고 성능을 측정한다.", 23],
  ["openaddr", "개방 주소법", "Open Addressing", "hash", "중급", "평균 탐색 O(1)", "선형·이차 조사와 이중 해싱을 비교 실험한다.", 24],
  ["graphrep", "그래프 표현", "Graph Representation", "graph", "기초", "인접 확인 O(1) vs O(deg)", "인접 행렬과 인접 리스트를 구현하고 메모리와 속도를 비교한다.", 26],
  ["dfsbfs", "DFS와 BFS", "Graph Traversal", "graph", "중급", "탐색 O(V+E)", "깊이·너비 우선 탐색으로 미로 찾기를 구현한다.", 27],
  ["topo", "위상 정렬", "Topological Sort", "graph", "중급", "O(V+E)", "선수 과목 그래프로 수강 순서를 정하는 문제에 적용한다.", 30],
  ["dsu", "서로소 집합", "Disjoint Set (Union-Find)", "adv", "중급", "거의 O(1)", "경로 압축과 랭크 합치기로 집합을 관리하고 연결 요소를 찾는다.", 31],
  ["lru", "LRU 캐시", "LRU Cache", "adv", "중급", "get/put O(1)", "해시 테이블과 이중 연결 리스트를 결합해 캐시 교체 정책을 구현한다.", 33]
];

/** 처음 한 번 편집기에서 실행: topics 탭과 교수자 키를 만든다. */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
    const rows = SEED.map(r => r.concat(['', '', '']));
    sh.getRange(2, 1, rows.length, HEADERS.length).setValues(rows);
    sh.setFrozenRows(1);
  }
  const props = PropertiesService.getScriptProperties();
  let key = props.getProperty('ADMIN_KEY');
  if (!key) {
    key = Utilities.getUuid().replace(/-/g, '').slice(0, 12);
    props.setProperty('ADMIN_KEY', key);
  }
  Logger.log('교수자 키: ' + key + '  (웹 앱 주소 뒤에 ?admin=' + key + ' 를 붙이면 교수자 화면)');
}

function doGet(e) {
  const key = (e && e.parameter && e.parameter.admin) || '';
  const t = HtmlService.createTemplateFromFile('Index');
  t.adminKey = isAdmin_(key) ? key : '';
  return t.evaluate()
    .setTitle('자료구조 주제 뽑기')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** 현재 배정 현황 (학생 화면이 몇 초마다 부른다) */
function getState() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get(CACHE_KEY);
  if (hit) return JSON.parse(hit);
  const state = { topics: readTopics_().map(t => t.data) };
  cache.put(CACHE_KEY, JSON.stringify(state), CACHE_SECONDS);
  return state;
}

/**
 * 뽑기. 남은 주제 중 하나를 서버에서 무작위로 골라 바로 배정한다.
 * 스크립트 잠금으로 동시에 눌러도 같은 주제가 두 번 나가지 않는다.
 */
function claim(studentNo, name) {
  studentNo = clean_(studentNo, 20);
  name = clean_(name, 30);
  if (!studentNo || !name) return { ok: false, reason: 'missing' };
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) return { ok: false, reason: 'busy' };
  try {
    const rows = readTopics_();
    const mine = rows.find(r => String(r.data.studentNo) === studentNo && r.data.claimedBy);
    if (mine) return { ok: false, reason: 'already', topic: mine.data, topics: rows.map(r => r.data) };
    const left = rows.filter(r => !r.data.claimedBy);
    if (!left.length) return { ok: false, reason: 'empty', topics: rows.map(r => r.data) };
    const pick = left[Math.floor(Math.random() * left.length)];
    const now = Date.now();
    sheet_().getRange(pick.row, HEADERS.indexOf('claimedBy') + 1, 1, 3).setValues([[name, studentNo, now]]);
    SpreadsheetApp.flush();
    pick.data.claimedBy = name; pick.data.studentNo = studentNo; pick.data.claimedAt = now;
    CacheService.getScriptCache().remove(CACHE_KEY);
    return { ok: true, topic: pick.data, topics: rows.map(r => r.data) };
  } finally {
    lock.releaseLock();
  }
}

/** 교수자 전용: 배정 해제 */
function release(adminKey, id) {
  if (!isAdmin_(adminKey)) return { ok: false, reason: 'forbidden' };
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) return { ok: false, reason: 'busy' };
  try {
    const r = readTopics_().find(x => x.data.id === String(id));
    if (!r) return { ok: false, reason: 'notfound' };
    sheet_().getRange(r.row, HEADERS.indexOf('claimedBy') + 1, 1, 3).setValues([['', '', '']]);
    SpreadsheetApp.flush();
    CacheService.getScriptCache().remove(CACHE_KEY);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

/* ---------- 내부 도우미 ---------- */

function sheet_() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sh) throw new Error('topics 탭이 없어요. 편집기에서 setup 을 먼저 실행해 주세요.');
  return sh;
}

function readTopics_() {
  const values = sheet_().getDataRange().getValues();
  const head = values[0].map(String);
  const col = name => head.indexOf(name);
  const out = [];
  for (let i = 1; i < values.length; i++) {
    const v = values[i];
    const id = String(v[col('id')] || '').trim();
    const title = String(v[col('title')] || '').trim();
    if (!id || !title) continue;
    const data = {};
    HEADERS.forEach(h => { const c = col(h); data[h] = c < 0 ? '' : v[c]; });
    data.id = id;
    data.title = title;
    data.order = Number(data.order) || i;
    data.claimedBy = String(data.claimedBy || '');
    data.studentNo = String(data.studentNo || '');
    data.claimedAt = Number(data.claimedAt) || 0;
    out.push({ row: i + 1, data: data });
  }
  out.sort((a, b) => a.data.order - b.data.order);
  return out;
}

function isAdmin_(key) {
  const real = PropertiesService.getScriptProperties().getProperty('ADMIN_KEY');
  return !!real && !!key && String(key) === real;
}

// 시트에 들어갈 학생 입력값 정리. =, +, -, @ 로 시작하면 수식으로 해석되지 않게 막는다.
function clean_(s, max) {
  s = String(s == null ? '' : s).replace(/[\u0000-\u001f]/g, '').trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}
