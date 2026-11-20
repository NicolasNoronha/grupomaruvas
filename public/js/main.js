(() => {
  const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ponteiroFino = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  const ano = $('#ano');
  if (ano) ano.textContent = new Date().getFullYear();

  /* ---------- Entradas ---------- */
  const surgem = $$('[data-surge]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((itens) => {
      itens.forEach((it) => {
        if (!it.isIntersecting) return;
        it.target.classList.add('vis');
        it.target.querySelectorAll('[data-conta]').forEach(conta);
        io.unobserve(it.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    surgem.forEach((el) => io.observe(el));
  } else {
    document.documentElement.classList.add('sem-js');
    surgem.forEach((el) => el.classList.add('vis'));
  }
  // Rede de segurança: nada fica escondido se o observer falhar
  setTimeout(() => surgem.forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight && r.bottom > 0) el.classList.add('vis');
  }), 1500);

  /* ---------- Contadores ---------- */
  const brl = (n) => 'R$ ' + Math.round(n).toLocaleString('pt-BR');
  function conta(el) {
    if (el.dataset.feito) return;
    el.dataset.feito = '1';
    const alvo = +el.dataset.conta;
    if (reduz) { el.textContent = brl(alvo); return; }
    const t0 = performance.now(), dur = 1600;
    const passo = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      el.textContent = brl(alvo * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  }

  /* ---------- Topo, progresso e menu ativo ---------- */
  const topo = $('#topo');
  const barra = $('.progresso span');
  const linksMenu = $$('.menu a[href^="#"]');
  const secoes = linksMenu.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  let agendado = false;
  function aoRolar() {
    agendado = false;
    const y = scrollY;
    topo.classList.toggle('rolou', y > 20);
    const max = document.documentElement.scrollHeight - innerHeight;
    barra.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    let atual = null;
    secoes.forEach((s) => { if (s.getBoundingClientRect().top < innerHeight * 0.4) atual = s.id; });
    linksMenu.forEach((a) => a.classList.toggle('ativo', a.getAttribute('href') === '#' + atual));
  }
  addEventListener('scroll', () => { if (!agendado) { agendado = true; requestAnimationFrame(aoRolar); } }, { passive: true });
  aoRolar();

  /* ---------- Menu celular ---------- */
  const burger = $('#burger'), menu = $('#menu');
  const fecha = () => { menu.classList.remove('aberto'); topo.classList.remove('menu-aberto'); burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Abrir menu'); };
  burger.addEventListener('click', () => {
    const abrir = !menu.classList.contains('aberto');
    menu.classList.toggle('aberto', abrir);
    topo.classList.toggle('menu-aberto', abrir);
    burger.setAttribute('aria-expanded', String(abrir));
    burger.setAttribute('aria-label', abrir ? 'Fechar menu' : 'Abrir menu');
  });
  $$('a', menu).forEach((a) => a.addEventListener('click', fecha));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') fecha(); });

  /* ---------- Interações de mouse (só desktop) ---------- */
  if (ponteiroFino && !reduz) {
    // Parallax do hero
    const cena = $('.hero__cena');
    const hero = $('.hero');
    const camadas = $$('[data-par]');
    const tilts = $$('[data-tilt]', hero);
    hero.addEventListener('pointermove', (e) => {
      const x = e.clientX / innerWidth - 0.5;
      const y = e.clientY / innerHeight - 0.5;
      camadas.forEach((c) => { const f = +c.dataset.par; c.style.transform = `translate(${x * f}px, ${y * f}px)`; });
      tilts.forEach((t, i) => {
        const f = +t.dataset.tilt;
        const z = i * 6;
        t.style.transform = `rotateY(${x * f}deg) rotateX(${-y * f}deg) translate3d(${x * (10 + z)}px, ${y * (10 + z)}px, 0)`;
      });
    });
    hero.addEventListener('pointerleave', () => {
      tilts.forEach((t) => (t.style.transform = ''));
      camadas.forEach((c) => (c.style.transform = ''));
    });

    // Brilho que segue o cursor
    $$('.brilho').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - r.left}px`);
        el.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });

    // Botões magnéticos
    $$('.mag').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        b.style.setProperty('--bx', `${(e.clientX - r.left - r.width / 2) * 0.18}px`);
        b.style.setProperty('--by', `${(e.clientY - r.top - r.height / 2) * 0.25}px`);
      });
      b.addEventListener('pointerleave', () => { b.style.setProperty('--bx', '0px'); b.style.setProperty('--by', '0px'); });
    });
  }

  /* ---------- Simulador de preço ---------- */
  const calc = $('#calc');
  if (calc) {
    const ids = ['ing', 'emb', 'hor', 'val', 'mar'];
    const ent = Object.fromEntries(ids.map((k) => [k, $('#c-' + k)]));
    const sai = Object.fromEntries(ids.map((k) => [k, $('#o-' + k)]));
    const precoEl = $('#r-preco'), lucroEl = $('#r-lucro');
    const fmt = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 });
    let mostrado = 0, anim;

    function animaPreco(alvo) {
      cancelAnimationFrame(anim);
      if (reduz) { mostrado = alvo; precoEl.textContent = fmt(alvo); return; }
      const de = mostrado, t0 = performance.now();
      const passo = (t) => {
        const p = Math.min(1, (t - t0) / 450);
        mostrado = de + (alvo - de) * (1 - Math.pow(1 - p, 3));
        precoEl.textContent = fmt(mostrado);
        if (p < 1) anim = requestAnimationFrame(passo);
      };
      anim = requestAnimationFrame(passo);
    }

    function atualiza() {
      const v = Object.fromEntries(ids.map((k) => [k, parseFloat(ent[k].value)]));
      ids.forEach((k) => {
        const i = ent[k];
        i.style.setProperty('--p', ((i.value - i.min) / (i.max - i.min)) * 100 + '%');
      });
      sai.ing.textContent = fmt(v.ing);
      sai.emb.textContent = fmt(v.emb);
      sai.hor.textContent = String(v.hor).replace('.', ',') + ' h';
      sai.val.textContent = fmt(v.val);
      sai.mar.textContent = v.mar + '%';
      const mao = v.hor * v.val;
      const custo = v.ing + v.emb + mao;
      const lucro = custo * (v.mar / 100);
      const preco = custo + lucro;
      animaPreco(preco);
      lucroEl.textContent = fmt(lucro);
    }
    ids.forEach((k) => ent[k].addEventListener('input', atualiza));
    atualiza();
  }
})();
