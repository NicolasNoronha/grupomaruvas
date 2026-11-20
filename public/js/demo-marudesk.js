/* Demonstração automática do Marudesk (estoque → receita → produção).
   Trazida da home do marudesk.com.br (resources/views/public/home.blade.php, seção #teste).
   Roda sozinha enquanto o celular está na tela; se a pessoa tocar, vira interativa. */
(() => {
  const $ = (id) => document.getElementById(id);
  const tela = $('demo-tela');
  if (!tela) return;
  const app = $('demo-app'), dedo = tela.querySelector('.md-dedo');
  const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const g = (v) => Math.round(v).toLocaleString('pt-BR') + ' g';
  const num = (s) => { s = String(s).trim(); return parseFloat(s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s) || 0; };
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const TITULO = { estoque: 'Estoque', receita: 'Nova receita', producao: 'Produção' };
  let est = [], rec = [], qtd = [], lotes = 1, modo = 'auto', run = 0, tid;

  const toast = (t) => { const el = $('demo-toast'); el.textContent = t; el.classList.add('on'); clearTimeout(tid); tid = setTimeout(() => el.classList.remove('on'), 2600); };

  function vai(aba) {
    tela.querySelectorAll('[data-aba]').forEach((p) => { p.hidden = p.dataset.aba !== aba; });
    tela.querySelectorAll('[data-ir]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.ir === aba));
    $('demo-titulo').textContent = TITULO[aba];
    app.scrollTop = 0;
    if (aba === 'producao') renderProd();
  }
  const renderEst = () => {
    $('e-lista').innerHTML = est.map((i) => `<li class="md-cartao"><b class="md-ico" aria-hidden="true"></b><span><strong>${esc(i.n)}</strong><span>Estoque: ${g(i.saldo)}</span><span>Preço: ${brl(i.preco / i.emb * 1000)} o kg</span></span><em class="md-selo${i.saldo <= 0 ? ' zerado' : ''}">${i.saldo <= 0 ? 'Zerado' : 'Normal'}</em></li>`).join('');
  };
  const custo = () => est.reduce((s, i, k) => s + (qtd[k] || 0) * i.preco / i.emb, 0);
  const renderCusto = () => {
    const t = custo();
    $('r-total').textContent = brl(t);
    $('r-un').textContent = brl(t / (num($('r-rend').value) || 1));
  };
  const renderItens = () => {
    $('r-itens').innerHTML = est.map((i, k) => `<label class="md-item">${esc(i.n)}<input type="number" min="0" inputmode="numeric" data-k="${k}" value="${qtd[k] || ''}" placeholder="0 g" aria-label="Gramas de ${esc(i.n)}"></label>`).join('');
    renderCusto();
  };
  function renderProd() {
    const sel = $('p-receita'), atual = sel.value;
    sel.innerHTML = rec.length ? rec.map((r) => `<option>${esc(r.nome)}</option>`).join('') : '<option value="">Salve uma receita primeiro</option>';
    if (rec.some((r) => r.nome === atual)) sel.value = atual;
    const r = rec.find((x) => x.nome === sel.value);
    $('p-lotes').textContent = lotes;
    $('p-total').textContent = r ? `${r.rend * lotes} unidades · custo ${brl(r.custo * lotes)}` : '';
    let falta = !r;
    $('p-consumo').innerHTML = r ? r.itens.map(({ k, q }) => {
      const fica = est[k].saldo - q * lotes;
      if (fica < 0) falta = true;
      return `<li><strong>${esc(est[k].n)}</strong><span${fica < 0 ? ' class="md-falta"' : ''}>Usa ${g(q * lotes)} · fica ${fica < 0 ? 'faltando ' + g(-fica) : g(fica)}</span></li>`;
    }).join('') : '';
    $('p-registrar').disabled = falta;
  }
  function zera() {
    est = [
      { n: 'Leite condensado', emb: 395, preco: 6.9, saldo: 1580 },
      { n: 'Chocolate em pó 50%', emb: 1000, preco: 39.9, saldo: 1000 },
      { n: 'Manteiga', emb: 200, preco: 9.9, saldo: 400 },
      { n: 'Granulado', emb: 500, preco: 12.9, saldo: 500 },
    ];
    rec = []; qtd = []; lotes = 1;
    $('e-form').reset(); $('r-nome').value = ''; $('r-rend').value = '25';
    renderEst(); renderItens(); vai('estoque');
  }

  tela.querySelector('nav').addEventListener('click', (e) => { const b = e.target.closest('[data-ir]'); if (b) vai(b.dataset.ir); });
  $('e-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const n = $('e-nome').value.trim(), emb = num($('e-emb').value), preco = num($('e-preco').value);
    if (!n || emb <= 0 || preco <= 0) return toast('Preencha ingrediente, embalagem e preço.');
    const i = est.find((x) => x.n.toLowerCase() === n.toLowerCase());
    if (i) { i.saldo += emb; i.emb = emb; i.preco = preco; } else est.push({ n, emb, preco, saldo: emb });
    e.target.reset(); renderEst(); renderItens();
    toast(`${n} no estoque: ${brl(preco / emb * 1000)} o kg`);
  });
  $('r-itens').addEventListener('input', (e) => { qtd[e.target.dataset.k] = Math.max(0, num(e.target.value)); renderCusto(); });
  $('r-rend').addEventListener('input', renderCusto);
  $('r-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const itens = qtd.map((q, k) => ({ k, q })).filter((x) => x.q > 0);
    if (!itens.length) return toast('Informe ao menos um ingrediente.');
    const nome = $('r-nome').value.trim() || 'Minha receita', rend = Math.max(1, Math.round(num($('r-rend').value)) || 1);
    rec = rec.filter((r) => r.nome !== nome).concat({ nome, rend, itens, custo: custo() });
    $('p-receita').innerHTML = `<option>${esc(nome)}</option>`;
    toast(`${nome} salva: ${brl(custo() / rend)} por unidade`);
  });
  $('p-receita').addEventListener('change', renderProd);
  $('p-mais').addEventListener('click', () => { lotes++; renderProd(); });
  $('p-menos').addEventListener('click', () => { lotes = Math.max(1, lotes - 1); renderProd(); });
  $('p-registrar').addEventListener('click', () => {
    const r = rec.find((x) => x.nome === $('p-receita').value);
    if (!r) return;
    r.itens.forEach(({ k, q }) => { est[k].saldo -= q * lotes; });
    toast(`Produção registrada: ${r.rend * lotes} un. de ${r.nome}. Estoque baixado.`);
    renderEst(); renderProd();
  });

  /* Roteiro automático com um "dedo" na tela */
  const pausa = (ms, id) => new Promise((ok, no) => setTimeout(() => (id === run ? ok() : no('parou')), ms));
  async function aponta(el, id) {
    if (app.contains(el)) {
      app.scrollTop = Math.max(0, el.getBoundingClientRect().top - app.getBoundingClientRect().top + app.scrollTop - 90);
      await pausa(400, id);
    }
    const s = tela.getBoundingClientRect(), r = el.getBoundingClientRect();
    dedo.style.opacity = 1;
    dedo.style.transform = `translate(${r.left - s.left + r.width / 2}px, ${r.top - s.top + r.height / 2}px)`;
    await pausa(600, id);
  }
  async function toca(el, id) {
    await aponta(el, id);
    dedo.classList.remove('toca'); void dedo.offsetWidth; dedo.classList.add('toca');
    await pausa(200, id);
    el.click();
    await pausa(500, id);
  }
  async function digita(el, txt, id) {
    await aponta(el, id);
    el.classList.add('md-foco');
    el.value = '';
    for (const c of txt) { el.value += c; el.dispatchEvent(new Event('input', { bubbles: true })); await pausa(85, id); }
    el.classList.remove('md-foco');
    await pausa(250, id);
  }
  const nav = (aba) => tela.querySelector(`[data-ir="${aba}"]`);
  const item = (k) => $('r-itens').querySelector(`[data-k="${k}"]`);
  async function roteiro(id) {
    await pausa(800, id);
    await digita($('e-nome'), 'Creme de leite', id);
    await digita($('e-emb'), '200', id);
    await digita($('e-preco'), '3,49', id);
    await toca($('e-add'), id);
    await pausa(1200, id);
    await toca(nav('receita'), id);
    await digita($('r-nome'), 'Brigadeiro gourmet', id);
    await digita($('r-rend'), '30', id);
    await digita(item(0), '395', id);
    await digita(item(1), '40', id);
    await digita(item(2), '20', id);
    await digita(item(4), '50', id);
    await toca($('r-salvar'), id);
    await pausa(1400, id);
    await toca(nav('producao'), id);
    await toca($('p-mais'), id);
    await pausa(800, id);
    await toca($('p-registrar'), id);
    await pausa(1800, id);
    await toca(nav('estoque'), id);
    await pausa(2800, id);
  }
  async function demo() {
    const id = ++run;
    modo = 'auto';
    try { for (;;) { zera(); await roteiro(id); } } catch (e) { /* parou */ }
  }
  function assume() {
    if (modo !== 'auto') return;
    run++; modo = 'user';
    dedo.style.opacity = 0;
    tela.querySelectorAll('.md-foco').forEach((el) => el.classList.remove('md-foco'));
  }
  tela.addEventListener('pointerdown', assume, true);
  tela.addEventListener('keydown', assume, true);

  zera();
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) { modo = 'user'; return; }
  new IntersectionObserver((es) => {
    if (modo !== 'auto') return;
    if (es[0].isIntersecting) demo(); else run++;
  }, { threshold: 0.3 }).observe(tela);
})();
