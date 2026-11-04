  const roles = {1:"학급회장", 2:"학급부회장", 3:"전교학생회장"};
  const clubs = ["독서","체육·운동","과학탐구"];

  for(let i=0;i<24;i++){
    const no = i+1;
    const stu = blankStudent(no);
    const sm = stu.s1;

    /* 행동특성 — 번호마다 다른 갈래 네 개 */
    const bcat = ["A","B","C","D","E","F","G","H","I","J","K","L"];
    for(let slot=0; slot<4; slot++){
      const c = bcat[(i*(slot*2+3) + slot*5) % bcat.length];
      if(!sm.behavior[c]) sm.behavior[c] = {i:(i*(slot+2)+slot*3) % 10, obs:""};
    }
    if(i===0) sm.behavior.A = {i:0, obs:"모둠 토의에서 친구들의 의견을 끝까지 들은 뒤 정리해 말함"};
    if(i===1) sm.behavior.C = {i:0, obs:"모둠 정리 당번이 빠진 날 대신 맡아 마무리함"};

    /* 학기말 — 갈래 세 개 (과목 공통) */
    const tcat = ["M","N","O","P","Q","R"];
    for(let slot=0; slot<3; slot++){
      const c = tcat[(i*(slot+2) + slot) % tcat.length];
      if(!sm.term[c]) sm.term[c] = {i:(i*(slot+3)) % 10, obs:""};
    }
    if(i===0) sm.extra = "2학기 들어 발표를 맡는 횟수가 늘고 모둠에서 기록을 자주 맡음";

    /* 창의적 체험활동 — 학급이 함께 한 활동 + 번호별 차이 */
    const auto = [{n:"학급회의", obs:"", period:""}];
    if(i<16) auto.push({n:"환경·기후 교육", obs:"", period:""});
    if(roles[no]) auto.unshift({n:roles[no], obs:"", period:"20"+String(meta.year).slice(2)+".03.02.~20"+String(meta.year).slice(2)+".08.31."});
    sm.cca.auto = auto.slice(0,3);
    sm.cca.club = [{n:clubs[i % 3], obs:"", period:""}];
    sm.cca.career = (i<20) ? [{n:"꿈 발표", obs:"", period:""}] : [{n:"진로 검사·상담", obs:"", period:""}];
    sm.cca.service = (i<12) ? [{n:"교내 환경 정화", obs:"", period:""}, {n:"또래 돕기", obs:"", period:""}]
                            : [{n:"교내 환경 정화", obs:"", period:""}];

    /* 23·24번은 일부를 비워 두어 ‘아직 생성되지 않았습니다’를 보여 준다 */
    if(no === 23){ sm.cca.career = []; sm.cca.service = []; }
    if(no === 24){ sm.behavior = {}; sm.term = {}; sm.cca.club = []; sm.cca.career = []; sm.cca.service = []; }

