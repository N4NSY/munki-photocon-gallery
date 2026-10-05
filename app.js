(() => {
  'use strict';

  const state = {
    data: null,
    works: [],
    orderedWorks: [],
    view: 'gallery',
    favorites: new Set(),
    viewerIndex: -1,
    viewerImageIndex: 0,
    focusPhotos: [],
    focusIndex: 0,
    focusTouchStartX: null,
    focusTouchStartY: null,
    suppressFocusClickUntil: 0,
  };

  const els = {};
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];

  const storageKey = 'munki-photocon:favorites:v1';

  function loadFavorites() {
    try {
      const raw = JSON.parse(localStorage.getItem(storageKey) || '[]');
      state.favorites = new Set(Array.isArray(raw) ? raw.map(String) : []);
    } catch {
      state.favorites = new Set();
    }
  }

  function saveFavorites() {
    try { localStorage.setItem(storageKey, JSON.stringify([...state.favorites])); } catch {}
    updateFavoriteCount();
  }

  function isSaved(id) { return state.favorites.has(String(id)); }

  function toggleFavorite(id) {
    id = String(id);
    if (isSaved(id)) state.favorites.delete(id); else state.favorites.add(id);
    saveFavorites();
    syncFavoriteUI(id);
    if (state.view === 'favorites') renderFavorites();
  }

  function updateFavoriteCount() {
    const valid = [...state.favorites].filter(id => state.works.some(w => w.id === id));
    els.favoriteCount.textContent = String(valid.length);
  }

  function syncFavoriteUI(id) {
    $$(`[data-favorite-id="${CSS.escape(String(id))}"]`).forEach(btn => {
      const saved = isSaved(id);
      btn.classList.toggle('is-saved', saved);
      btn.textContent = saved ? '♥' : '♡';
      btn.setAttribute('aria-label', saved ? '保存から外す' : 'この作品を保存');
      btn.title = saved ? '保存から外す' : 'この作品を保存';
    });
    if (state.viewerIndex >= 0 && state.orderedWorks[state.viewerIndex]?.id === String(id)) updateViewerFavorite();
  }

  function cardTemplate(work) {
    const img = work.images[0];
    const multi = work.images.length > 1 ? `<span class="multi-badge">${work.images.length}枚</span>` : '';
    const saved = isSaved(work.id);
    return `
      <article class="work-card" data-work-id="${work.id}" tabindex="0" aria-label="${escapeHtml(work.displayName)}さんの作品を開く">
        <img src="${img.thumb}" width="${img.webWidth}" height="${img.webHeight}" loading="lazy" decoding="async" alt="${escapeHtml(work.displayName)}さんの作品">
        ${multi}
        <button class="favorite-card ${saved ? 'is-saved' : ''}" data-favorite-id="${work.id}" type="button" aria-label="${saved ? '保存から外す' : 'この作品を保存'}">${saved ? '♥' : '♡'}</button>
        <div class="card-overlay">
          <span class="card-author"><span class="card-name">${escapeHtml(work.displayName)}</span><span class="card-user">@${escapeHtml(work.username)}</span></span>
        </div>
      </article>`;
  }

  function renderGallery() {
    els.galleryGrid.innerHTML = state.orderedWorks.map(cardTemplate).join('');
  }

  function renderFavorites() {
    const favorites = state.orderedWorks.filter(w => isSaved(w.id));
    els.favoritesGrid.innerHTML = favorites.map(cardTemplate).join('');
    els.favoritesEmpty.hidden = favorites.length !== 0;
  }

  function rebuildFocusPhotos() {
    state.focusPhotos = state.orderedWorks.flatMap(work =>
      work.images.map((image, imageIndex) => ({ work, image, imageIndex }))
    );
    if (state.focusPhotos.length) {
      state.focusIndex = ((state.focusIndex % state.focusPhotos.length) + state.focusPhotos.length) % state.focusPhotos.length;
    } else {
      state.focusIndex = 0;
    }
  }

  function focusTemplate(item) {
    const { work, image, imageIndex } = item;
    const saved = isSaved(work.id);
    const postImageCount = work.images.length > 1
      ? `<span class="focus-post-count">投稿内 ${imageIndex + 1}/${work.images.length}</span>`
      : '';
    return `
      <div class="focus-shell">
        <article class="focus-card">
          <div class="focus-media" data-focus-media role="group" aria-label="画像の左半分で前、右半分で次。左右スワイプでも移動できます">
            <img src="${image.src}" width="${image.webWidth}" height="${image.webHeight}" draggable="false" alt="${escapeHtml(work.displayName)}さんの作品">
            <span class="focus-edge-hint focus-edge-hint-left" aria-hidden="true">‹</span>
            <span class="focus-edge-hint focus-edge-hint-right" aria-hidden="true">›</span>
            <span class="focus-position">${state.focusIndex + 1} / ${state.focusPhotos.length}</span>
            ${postImageCount}
          </div>
          <div class="focus-meta">
            <div class="focus-profile">
              <p class="focus-name">${escapeHtml(work.displayName)}</p>
              <p class="focus-user">@${escapeHtml(work.username)}</p>
            </div>
            <div class="focus-actions">
              <button class="round-action ${saved ? 'is-saved' : ''}" data-favorite-id="${work.id}" type="button" aria-label="${saved ? '保存から外す' : 'この作品を保存'}">${saved ? '♥' : '♡'}</button>
              <a class="focus-x" href="${work.tweetUrl}" target="_blank" rel="noopener noreferrer">Xで元投稿を見る ↗</a>
            </div>
          </div>
        </article>
      </div>`;
  }

  function renderFocus() {
    if (!state.focusPhotos.length) return;
    state.focusIndex = ((state.focusIndex % state.focusPhotos.length) + state.focusPhotos.length) % state.focusPhotos.length;
    els.focusMount.innerHTML = focusTemplate(state.focusPhotos[state.focusIndex]);
  }

  function moveFocus(delta) {
    if (!state.focusPhotos.length) return;
    state.focusIndex = (state.focusIndex + delta + state.focusPhotos.length) % state.focusPhotos.length;
    renderFocus();
  }

  function setView(view) {
    if (!['gallery', 'focus', 'favorites'].includes(view)) return;
    state.view = view;
    document.body.classList.toggle('is-focus-mode', view === 'focus');
    $$('.view').forEach(v => v.classList.toggle('is-active', v.id === `${view}View`));
    $$('.nav-tab').forEach(b => b.classList.toggle('is-active', b.dataset.view === view));
    els.shuffleButton.hidden = view === 'favorites' || view === 'focus';
    if (view === 'favorites') renderFavorites();
    if (view === 'focus') renderFocus();
    window.scrollTo({ top: 0, behavior: view === 'focus' ? 'auto' : 'smooth' });
  }

  function shuffleWorks() {
    const arr = [...state.orderedWorks];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    state.orderedWorks = arr;
    state.focusIndex = 0;
    rebuildFocusPhotos();
    renderGallery();
    if (state.view === 'focus') renderFocus();
  }

  function openViewerById(id, pushHash = true) {
    const idx = state.orderedWorks.findIndex(w => w.id === String(id));
    if (idx < 0) return;
    state.viewerIndex = idx;
    state.viewerImageIndex = 0;
    renderViewer();
    els.viewer.hidden = false;
    els.viewer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (pushHash) history.replaceState(null, '', `#${id}`);
  }

  function closeViewer(clearHash = true) {
    els.viewer.hidden = true;
    els.viewer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    state.viewerIndex = -1;
    if (clearHash && location.hash) history.replaceState(null, '', location.pathname + location.search);
  }

  function renderViewer() {
    const work = state.orderedWorks[state.viewerIndex];
    if (!work) return;
    state.viewerImageIndex = ((state.viewerImageIndex % work.images.length) + work.images.length) % work.images.length;
    const image = work.images[state.viewerImageIndex];
    els.viewerImage.src = image.src;
    els.viewerImage.width = image.webWidth;
    els.viewerImage.height = image.webHeight;
    els.viewerImage.alt = `${work.displayName}さんの作品 ${state.viewerImageIndex + 1}`;
    els.viewerName.textContent = work.displayName;
    els.viewerUsername.textContent = `@${work.username}`;
    els.viewerTweet.href = work.tweetUrl;
    els.viewerImageCount.textContent = work.images.length > 1 ? `${state.viewerImageIndex + 1} / ${work.images.length}` : '';
    els.viewerImagePrev.hidden = work.images.length < 2;
    els.viewerImageNext.hidden = work.images.length < 2;
    updateViewerFavorite();
    history.replaceState(null, '', `#${work.id}`);
  }

  function updateViewerFavorite() {
    const work = state.orderedWorks[state.viewerIndex];
    if (!work) return;
    const saved = isSaved(work.id);
    els.viewerFavorite.classList.toggle('is-saved', saved);
    els.viewerFavorite.textContent = saved ? '♥ 保存済み' : '♡ あとで見る';
  }

  function moveViewerImage(delta) {
    const work = state.orderedWorks[state.viewerIndex];
    if (!work || work.images.length < 2) return;
    state.viewerImageIndex = (state.viewerImageIndex + delta + work.images.length) % work.images.length;
    renderViewer();
  }

  function moveViewerWork(delta) {
    state.viewerIndex = (state.viewerIndex + delta + state.orderedWorks.length) % state.orderedWorks.length;
    state.viewerImageIndex = 0;
    renderViewer();
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }

  function handleCardClick(e) {
    const favorite = e.target.closest('[data-favorite-id]');
    if (favorite) {
      e.preventDefault(); e.stopPropagation();
      toggleFavorite(favorite.dataset.favoriteId);
      return;
    }
    const card = e.target.closest('[data-work-id]');
    if (card) openViewerById(card.dataset.workId);
  }

  function bindEvents() {
    document.addEventListener('click', e => {
      const viewBtn = e.target.closest('[data-view]');
      if (viewBtn) { setView(viewBtn.dataset.view); return; }

      const close = e.target.closest('[data-action="close-viewer"]');
      if (close) { closeViewer(); return; }

      const home = e.target.closest('[data-action="home"]');
      if (home) { e.preventDefault(); setView('gallery'); window.scrollTo({top:0,behavior:'smooth'}); return; }

      const favorite = e.target.closest('[data-favorite-id]');
      if (favorite) {
        e.preventDefault(); e.stopPropagation();
        toggleFavorite(favorite.dataset.favoriteId);
        if (state.view === 'focus') renderFocus();
        return;
      }

      const card = e.target.closest('[data-work-id]');
      if (card) openViewerById(card.dataset.workId);
    });

    document.addEventListener('keydown', e => {
      const card = e.target.closest?.('[data-work-id]');
      if (card && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openViewerById(card.dataset.workId); return; }
      if (!els.viewer.hidden) {
        if (e.key === 'Escape') closeViewer();
        else if (e.key === 'ArrowLeft') moveViewerImage(-1);
        else if (e.key === 'ArrowRight') moveViewerImage(1);
      } else if (state.view === 'focus') {
        if (e.key === 'ArrowLeft') moveFocus(-1);
        if (e.key === 'ArrowRight') moveFocus(1);
      }
    });

    els.shuffleButton.addEventListener('click', shuffleWorks);
    els.viewerImagePrev.addEventListener('click', () => moveViewerImage(-1));
    els.viewerImageNext.addEventListener('click', () => moveViewerImage(1));
    els.viewerPrevWork.addEventListener('click', () => moveViewerWork(-1));
    els.viewerNextWork.addEventListener('click', () => moveViewerWork(1));
    els.viewerFavorite.addEventListener('click', () => {
      const work = state.orderedWorks[state.viewerIndex];
      if (work) toggleFavorite(work.id);
    });

    let startX = null;
    els.viewerImage.addEventListener('touchstart', e => { startX = e.touches[0]?.clientX ?? null; }, {passive:true});
    els.viewerImage.addEventListener('touchend', e => {
      if (startX == null) return;
      const endX = e.changedTouches[0]?.clientX ?? startX;
      const dx = endX - startX;
      if (Math.abs(dx) > 48) moveViewerImage(dx > 0 ? -1 : 1);
      startX = null;
    }, {passive:true});

    els.focusMount.addEventListener('click', e => {
      if (e.target.closest('a,button')) return;
      const media = e.target.closest('[data-focus-media]');
      if (!media || Date.now() < state.suppressFocusClickUntil) return;
      const rect = media.getBoundingClientRect();
      moveFocus(e.clientX < rect.left + rect.width / 2 ? -1 : 1);
    });

    els.focusMount.addEventListener('touchstart', e => {
      const media = e.target.closest('[data-focus-media]');
      if (!media || e.touches.length !== 1) return;
      state.focusTouchStartX = e.touches[0].clientX;
      state.focusTouchStartY = e.touches[0].clientY;
    }, { passive: true });

    els.focusMount.addEventListener('touchend', e => {
      if (state.focusTouchStartX == null || state.focusTouchStartY == null) return;
      const touch = e.changedTouches[0];
      const dx = (touch?.clientX ?? state.focusTouchStartX) - state.focusTouchStartX;
      const dy = (touch?.clientY ?? state.focusTouchStartY) - state.focusTouchStartY;
      state.focusTouchStartX = null;
      state.focusTouchStartY = null;
      if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.15) {
        state.suppressFocusClickUntil = Date.now() + 350;
        moveFocus(dx > 0 ? -1 : 1);
      }
    }, { passive: true });

    window.addEventListener('hashchange', () => {
      const id = location.hash.slice(1);
      if (id && state.works.some(w => w.id === id)) openViewerById(id, false);
      else if (!id && !els.viewer.hidden) closeViewer(false);
    });
  }

  async function init() {
    Object.assign(els, {
      galleryGrid: $('#galleryGrid'),
      favoritesGrid: $('#favoritesGrid'),
      favoritesEmpty: $('#favoritesEmpty'),
      favoriteCount: $('#favoriteCount'),
      focusMount: $('#focusMount'),
      shuffleButton: $('#shuffleButton'),
      galleryStats: $('#galleryStats'),
      periodText: $('#periodText'),
      viewer: $('#viewer'),
      viewerImage: $('#viewerImage'),
      viewerImagePrev: $('#viewerImagePrev'),
      viewerImageNext: $('#viewerImageNext'),
      viewerImageCount: $('#viewerImageCount'),
      viewerName: $('#viewerName'),
      viewerUsername: $('#viewerUsername'),
      viewerTweet: $('#viewerTweet'),
      viewerFavorite: $('#viewerFavorite'),
      viewerPrevWork: $('#viewerPrevWork'),
      viewerNextWork: $('#viewerNextWork'),
    });

    loadFavorites();
    const res = await fetch('data/gallery.json', {cache:'no-cache'});
    if (!res.ok) throw new Error(`gallery.json: ${res.status}`);
    state.data = await res.json();
    state.works = state.data.works;
    state.orderedWorks = [...state.works];
    rebuildFocusPhotos();

    els.galleryStats.textContent = `${state.data.meta.workCount} works · ${state.data.meta.photoCount} photos`;
    els.periodText.textContent = `${state.data.meta.hashtag}  /  ${state.data.meta.period}`;
    updateFavoriteCount();
    renderGallery();
    renderFocus();
    bindEvents();

    const id = location.hash.slice(1);
    if (id && state.works.some(w => w.id === id)) openViewerById(id, false);
  }

  init().catch(err => {
    console.error(err);
    document.body.innerHTML = `<main style="padding:40px;color:#fff"><h1>読み込みに失敗しました</h1><p>GitHub PagesなどHTTPサーバー上で開いてください。</p></main>`;
  });
})();
