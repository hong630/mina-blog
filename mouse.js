(() => {
    // ====== 옵션 ======
    const OPT = {
        color: '#fff',             // 흰색(다크배경용). 라이트배경이면 '#000'
        spawnPerMove: 1,           // 마우스 이동 시 생성 수
        gravity: 0.05,             // 중력
        maxParticles: 50,         // 최대 파티클
        lineWidth: 1,              // 선 두께
        shadowBlur: 1,             // 반짝임 정도(0~10)
        //shapes: ['sparkle','star5','cross'], // 섞어서 사용
        shapes: ['cross'],
        ignoreOver: ['INPUT','TEXTAREA','SELECT','BUTTON'], // 이 위에선 생성 안 함
        ignoreClasses: ['tag-slider','relevance-btn','tag-sort-btn','tag-controls']
    };

    // 모션 줄이기면 종료
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // 캔버스 준비
    const cvs = document.getElementById('sparkles');
    const ctx = cvs.getContext('2d');
    let W=0,H=0, DPR = Math.max(1, devicePixelRatio||1);
    const resize = () => {
        DPR = Math.max(1, devicePixelRatio||1);
        W = cvs.width  = innerWidth * DPR;
        H = cvs.height = innerHeight * DPR;
        cvs.style.width  = innerWidth + 'px';
        cvs.style.height = innerHeight + 'px';
        ctx.setTransform(DPR,0,0,DPR,0,0);
    };
    addEventListener('resize', resize, {passive:true});
    resize();

    // 파티클 풀
    const pool = [];
    function spawn(x,y){
        const n = OPT.spawnPerMove|0;
        for(let i=0;i<n;i++){
            if(pool.length > OPT.maxParticles) pool.shift();
            const shape = OPT.shapes[(Math.random()*OPT.shapes.length)|0];
            pool.push({
                x, y,
                vx: (Math.random()*2-1)*1.2,
                vy: - (0.8 + Math.random()*1.6),
                g:  OPT.gravity,
                life: 0,
                ttl: 55 + (Math.random()*20|0),
                size: 1.2 + Math.random()*2.2,
                rot: Math.random()*Math.PI*2,
                spin: (Math.random()*0.4-0.2),
                shape
            });
        }
    }

    // 컨트롤 위에서는 생성/업데이트 스킵
    const isControl = el => {
        if (!el) return false;
        if (OPT.ignoreOver.includes(el.tagName)) return true;
        for (const c of OPT.ignoreClasses) {
            if (el.classList?.contains?.(c)) return true;
            if (el.closest && el.closest('.'+c)) return true;
        }
        return false;
    };

    let mx=0,my=0, pending = false, paused = false;
    addEventListener('mousemove', e=>{
        if (isControl(e.target)) return;  // 컨트롤 위에선 생성 X
        mx = e.clientX; my = e.clientY; pending = true;
    }, {passive:true});

    // 탭 비활성/활성
    document.addEventListener('visibilitychange', () => {
        paused = document.hidden;
    });

    // 그리기 도형들
    function drawSparkle(x,y,r,rot){
        // ✦ 스파클(대각선 + 십자)
        ctx.save(); ctx.translate(x,y); ctx.rotate(rot);
        ctx.beginPath(); ctx.moveTo(0,-r*1.6); ctx.lineTo(0, r*1.6);
        ctx.moveTo(-r*1.6,0); ctx.lineTo( r*1.6,0);
        ctx.moveTo(-r*1.1,-r*1.1); ctx.lineTo(r*1.1,r*1.1);
        ctx.moveTo(-r*1.1, r*1.1); ctx.lineTo(r*1.1,-r*1.1);
        ctx.stroke(); ctx.restore();
    }
    function drawCross(x,y,r,rot){
        // ✚ 크로스
        ctx.save(); ctx.translate(x,y); ctx.rotate(rot);
        ctx.beginPath(); ctx.moveTo(0,-r*1.8); ctx.lineTo(0, r*1.8);
        ctx.moveTo(-r*1.8,0); ctx.lineTo( r*1.8,0);
        ctx.stroke(); ctx.restore();
    }
    function drawStar5(x,y,r,rot){
        // ★ 5각별 외곽선
        ctx.save(); ctx.translate(x,y); ctx.rotate(rot);
        const spikes = 5, outer=r*1.6, inner=r*0.7;
        let rotA = -Math.PI/2, step = Math.PI/spikes;
        ctx.beginPath();
        for(let i=0;i<spikes;i++){
            ctx.lineTo(Math.cos(rotA)*outer, Math.sin(rotA)*outer);
            rotA += step;
            ctx.lineTo(Math.cos(rotA)*inner, Math.sin(rotA)*inner);
            rotA += step;
        }
        ctx.closePath(); ctx.stroke(); ctx.restore();
    }

    function drawParticle(p){
        const a = Math.max(0, 1 - p.life/p.ttl);
        ctx.globalAlpha = a;
        switch(p.shape){
            case 'cross':   drawCross(p.x, p.y, p.size, p.rot); break;
            case 'star5':   drawStar5(p.x, p.y, p.size, p.rot); break;
            default:        drawSparkle(p.x, p.y, p.size, p.rot); break;
        }
        ctx.globalAlpha = 1;
    }

    // 루프
    (function loop(){
        requestAnimationFrame(loop);
        if (paused) return;

        // 배경 지우기
        ctx.clearRect(0,0,innerWidth,innerHeight);

        // 새로 생성
        if (pending){ spawn(mx,my); pending = false; }

        // 스타일
        ctx.lineWidth = OPT.lineWidth;
        ctx.strokeStyle = OPT.color;
        ctx.shadowBlur = OPT.shadowBlur;
        ctx.shadowColor = OPT.color;

        // 업데이트 & 렌더
        for (let i=pool.length-1;i>=0;i--){
            const p = pool[i];
            p.life++;
            p.vy += p.g;
            p.x += p.vx;
            p.y += p.vy;
            p.rot += p.spin;

            drawParticle(p);

            if (p.life > p.ttl || p.y > innerHeight + 24) pool.splice(i,1);
        }
    })();
})();