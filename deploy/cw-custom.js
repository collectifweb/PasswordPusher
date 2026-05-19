/*
 * CW Password Pusher — UI customizations
 * Servi par nginx (location = /cw-custom.js), injecté via sub_filter
 * dans toutes les réponses HTML.
 *
 * Toutes les modifications sont DOM-side: l'image Docker upstream
 * n'est pas modifiée.
 */
(function () {
  'use strict';

  if (!window.__cwPwpushCustomBound) {
    window.__cwPwpushCustomBound = true;
    document.addEventListener('DOMContentLoaded', init);
    document.addEventListener('turbo:load', init);
    window.addEventListener('pageshow', init);
  }
  init();

  function init() {
    customizeNewForm();
    customizePreviewPage();
  }

  // ============================================================
  // Formulaire de création de push (/pushes/new)
  // ============================================================
  function customizeNewForm() {
    var form = document.querySelector('form[id^="new_push"]');
    if (!form) return;

    customizeSubmitButton(form);
    normalizeHiddenOptions();
    replaceExpirationControls();
    makePassphraseOptional();
  }

  function customizeSubmitButton(form) {
    var btn = form.querySelector('button[data-form-target="pushit"]');
    if (!btn) return;
    // Garde-fou: ne pas toucher au bouton du formulaire d'édition
    var disable = btn.getAttribute('data-disable-with') || '';
    if (/Updating|Mise à jour|Mise|Update/.test(disable)) return;

    btn.textContent = 'Générer le lien sécurisé';
  }

  function replaceExpirationControls() {
    var daysInput = document.querySelector('input[name="push[expire_after_days]"]');
    var viewsInput = document.querySelector('input[name="push[expire_after_views]"]');
    if (!daysInput || !viewsInput) return;
    if (document.getElementById('cw-expiration')) return;

    var daysAllowed = [1, 3, 7, 14, 30];
    var viewsAllowed = [1, 3, 7, 15];

    var daysMin = parseInt(daysInput.getAttribute('min'), 10) || 1;
    var daysMax = parseInt(daysInput.getAttribute('max'), 10) || 30;
    var viewsMin = parseInt(viewsInput.getAttribute('min'), 10) || 1;
    var viewsMax = parseInt(viewsInput.getAttribute('max'), 10) || 100;

    var daysOptions = daysAllowed.filter(function (v) { return v >= daysMin && v <= daysMax; });
    var viewsOptions = viewsAllowed.filter(function (v) { return v >= viewsMin && v <= viewsMax; });
    if (!daysOptions.length) daysOptions = [daysMin];
    if (!viewsOptions.length) viewsOptions = [viewsMin];

    // Masque les rangées des sliders d'origine
    var daysRow = daysInput.closest('.row');
    var viewsRow = viewsInput.closest('.row');
    if (daysRow) daysRow.classList.add('cw-hidden');
    if (viewsRow) viewsRow.classList.add('cw-hidden');

    // Masque le "(whichever comes first)" — la nouvelle UI est sans ambiguïté
    var whicheverP = document.querySelector('.text-center.form-text');
    if (whicheverP) {
      var whicheverRow = whicheverP.closest('.row');
      if (whicheverRow) whicheverRow.classList.add('cw-hidden');
    }

    var block = document.createElement('div');
    block.id = 'cw-expiration';
    block.className = 'mb-3';

    block.appendChild(buildSelectBlock(
      'cw-days-select',
      'Expirer et supprimer après',
      daysInput,
      daysOptions,
      'jour',
      'jours'
    ));

    block.appendChild(buildSelectBlock(
      'cw-views-select',
      'Nombre maximum de lectures',
      viewsInput,
      viewsOptions,
      'vue',
      'vues'
    ));

    var anchor = daysRow || viewsRow;
    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(block, anchor);
    }
  }

  function buildSelectBlock(id, labelText, rangeInput, options, singular, plural) {
    var wrap = document.createElement('div');
    wrap.className = 'mb-3';

    var label = document.createElement('label');
    label.setAttribute('for', id);
    label.className = 'form-label';
    label.textContent = labelText;
    wrap.appendChild(label);

    var select = document.createElement('select');
    select.id = id;
    select.className = 'form-select';

    var currentVal = parseInt(rangeInput.value, 10);
    var matched = false;
    options.forEach(function (v) {
      var opt = document.createElement('option');
      opt.value = String(v);
      opt.textContent = v + ' ' + (v === 1 ? singular : plural);
      if (v === currentVal) {
        opt.selected = true;
        matched = true;
      }
      select.appendChild(opt);
    });
    if (!matched) {
      var closest = options.reduce(function (prev, curr) {
        return Math.abs(curr - currentVal) < Math.abs(prev - currentVal) ? curr : prev;
      });
      select.value = String(closest);
      setRangeValue(rangeInput, closest);
    }

    select.addEventListener('change', function () {
      setRangeValue(rangeInput, parseInt(select.value, 10));
    });

    wrap.appendChild(select);
    return wrap;
  }

  function setRangeValue(input, value) {
    input.value = String(value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function makePassphraseOptional() {
    var passInput = document.getElementById('push_passphrase');
    if (!passInput) return;
    if (document.getElementById('cw-passphrase-wrap')) return;
    var inputGroup = passInput.closest('.input-group');
    if (!inputGroup) return;
    var col = inputGroup.parentNode;

    var wrap = document.createElement('div');
    wrap.id = 'cw-passphrase-wrap';
    wrap.className = 'mb-3';

    var check = document.createElement('div');
    check.className = 'form-check mb-2';
    check.innerHTML =
      '<input class="form-check-input" type="checkbox" id="cw-passphrase-toggle">' +
      '<label class="form-check-label" for="cw-passphrase-toggle">' +
      'Protéger l’accès avec un mot de passe' +
      '</label>';
    wrap.appendChild(check);

    col.insertBefore(wrap, inputGroup);
    wrap.appendChild(inputGroup);
    inputGroup.style.display = 'none';
    passInput.value = '';

    var toggle = check.querySelector('input');
    toggle.addEventListener('change', function () {
      if (toggle.checked) {
        inputGroup.style.display = '';
        passInput.focus();
      } else {
        inputGroup.style.display = 'none';
        passInput.value = '';
      }
    });
  }

  function normalizeHiddenOptions() {
    var retrieval = document.getElementById('push_retrieval_step');
    if (retrieval) {
      retrieval.checked = false;
    }

    var deletable = document.getElementById('push_deletable_by_viewer');
    if (deletable) {
      deletable.checked = true;
      deletable.value = 'on';
    }
  }

  // ============================================================
  // Page d'aperçu après création (/p/:token/preview)
  // ============================================================
  function customizePreviewPage() {
    var urlInput = document.getElementById('secret_url');
    if (!urlInput) return;
    // On veut uniquement la page preview (pas la page show côté destinataire)
    if (!/\/preview(?:[/?#]|$)/.test(location.pathname + location.search)) return;
    if (document.getElementById('cw-preview-block')) return;

    var bar = urlInput.closest('.input-group');
    if (!bar || !bar.parentNode) return;

    var url = urlInput.value;

    var block = document.createElement('div');
    block.id = 'cw-preview-block';
    block.className = 'w-100 text-center my-4';
    block.innerHTML =
      '<p class="lead mb-3">Voici votre lien sécurisé à transmettre.</p>' +
      '<button type="button" id="cw-big-copy" class="btn btn-success btn-lg px-5 py-3 fs-5">' +
      '<em class="bi bi-clipboard-check"></em>&nbsp;&nbsp;Copier le lien' +
      '</button>' +
      '<p class="mt-3 mb-1 small text-muted">' +
      'Envoyez ce lien à votre destinataire par le canal de votre choix (courriel, SMS, messagerie).' +
      '</p>' +
      '<p class="small text-muted">' +
      'Une fois consulté, le contenu sera détruit définitivement.' +
      '</p>';

    bar.parentNode.insertBefore(block, bar);

    var btn = block.querySelector('#cw-big-copy');
    var originalHTML = btn.innerHTML;
    btn.addEventListener('click', function () {
      copyText(url).then(function () {
        btn.innerHTML = '<em class="bi bi-check2-circle"></em>&nbsp;&nbsp;Lien copié !';
        btn.classList.remove('btn-success');
        btn.classList.add('btn-primary');
        window.setTimeout(function () {
          btn.innerHTML = originalHTML;
          btn.classList.add('btn-success');
          btn.classList.remove('btn-primary');
        }, 2500);
      });
    });
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () { fallbackCopy(text); });
    }
    fallbackCopy(text);
    return Promise.resolve();
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* noop */ }
    document.body.removeChild(ta);
  }
})();
