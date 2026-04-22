/* ============================================================
  MARGO SPACE — main.js
  Interactividad: Highcharts, formulario y filtros de catálogo
  ============================================================ */

document.addEventListener('DOMContentLoaded', function () {

  /* --------------------------------------------------------
     1. Marcar enlace activo en la barra de navegación
     -------------------------------------------------------- */
  const currentFile = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar-ms .nav-link').forEach(function (link) {
    if (link.getAttribute('href') === currentFile) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });



  /* --------------------------------------------------------
     2. Catálogo — filtros por categoría, disponibilidad y precio
     -------------------------------------------------------- */
  (function () {
    var grid = document.getElementById('view-grid');
    if (!grid) {
      return;
    }

    var catCbs = Array.from(document.querySelectorAll('input[data-cat]'));
    var availabilityInputs = Array.from(document.querySelectorAll('input[data-status]'));
    var chips = Array.from(document.querySelectorAll('.category-chips .chip[data-filter]'));
    var cards = Array.from(grid.querySelectorAll('.product-card'));
    var priceGroups = Array.from(document.querySelectorAll('[data-price-filter]'));
    var priceInputs = Array.from(document.querySelectorAll('input[data-range-bound]'));

    if (!catCbs.length || !cards.length) {
      return;
    }

    function normalizeCategory(value) {
      return (value || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    }

    function parsePrice(value) {
      var match = (value || '').match(/\d+(?:[.,]\d+)?/);

      if (!match) {
        return Number.POSITIVE_INFINITY;
      }

      return Number(match[0].replace(',', '.'));
    }

    function normalizeStatus(value) {
      return (value || '').trim().toLowerCase();
    }

    function formatPrice(value) {
      return value + ' €';
    }

    function getInputLabel(input) {
      return document.querySelector('label[for="' + input.id + '"]');
    }

    var priceConfig = {
      min: priceInputs.length ? Number(priceInputs[0].min) || 0 : 0,
      max: priceInputs.length ? Number(priceInputs[0].max) || 100 : 100,
      step: priceInputs.length ? Number(priceInputs[0].step) || 5 : 5
    };

    var currentPriceRange = {
      min: priceConfig.min,
      max: priceConfig.max
    };

    var categoryNames = {};

    catCbs.forEach(function (cb) {
      var key = normalizeCategory(cb.dataset.cat);
      if (!categoryNames[key]) {
        categoryNames[key] = cb.dataset.cat;
      }
    });

    var items = cards.map(function (card) {
      var badge = card.querySelector('.badge-cat');
      var column = card.closest('[data-category]') || card.parentElement;
      var category = normalizeCategory(badge ? badge.textContent : column.dataset.category);
      var price = parsePrice((card.querySelector('.product-price') || {}).textContent);
      var availability = normalizeStatus(card.dataset.availability || column.dataset.availability || 'disponible');

      return {
        card: card,
        column: column,
        category: category,
        price: price,
        availability: availability
      };
    });

    var allCategories = Array.from(new Set(catCbs.map(function (cb) {
      return normalizeCategory(cb.dataset.cat);
    })));

    function renderCatalogCategoryChart() {
      var chartEl = document.getElementById('catalog-category-chart');
      var counts = {};

      if (!chartEl || typeof Highcharts === 'undefined') {
        return;
      }

      allCategories.forEach(function (category) {
        counts[category] = 0;
      });

      items.forEach(function (item) {
        counts[item.category] = (counts[item.category] || 0) + 1;
      });

      Highcharts.chart('catalog-category-chart', {
        accessibility: {
          enabled: false
        },
        chart: {
          type: 'pie',
          backgroundColor: 'transparent',
          style: { fontFamily: "'DM Sans', sans-serif" }
        },
        title: { text: null },
        tooltip: {
          pointFormat: '<b>{point.y} piezas</b>'
        },
        credits: { enabled: false },
        colors: ['#1f4f46', '#c4a882', '#8e6246', '#d9c5a4', '#55605e', '#a77856'],
        legend: {
          align: 'center',
          verticalAlign: 'bottom',
          itemStyle: {
            color: '#1a1a1a',
            fontSize: '0.88rem',
            fontWeight: '500'
          }
        },
        plotOptions: {
          pie: {
            innerSize: '48%',
            showInLegend: true,
            dataLabels: {
              enabled: true,
              format: '<b>{point.name}</b><br>{point.y}',
              style: {
                color: '#1a1a1a',
                textOutline: 'none',
                fontSize: '0.8rem'
              }
            }
          }
        },
        series: [{
          name: 'Piezas',
          colorByPoint: true,
          data: allCategories.filter(function (category) {
            return (counts[category] || 0) > 0;
          }).map(function (category) {
            return {
              name: categoryNames[category] || category,
              y: counts[category]
            };
          })
        }]
      });
    }

    function getActiveCategories() {
      return Array.from(new Set(catCbs.filter(function (cb) {
        return cb.checked;
      }).map(function (cb) {
        return normalizeCategory(cb.dataset.cat);
      })));
    }

    function syncCategoryInputs(changedInput) {
      var changedCategory = normalizeCategory(changedInput.dataset.cat);

      catCbs.forEach(function (cb) {
        if (cb !== changedInput && normalizeCategory(cb.dataset.cat) === changedCategory) {
          cb.checked = changedInput.checked;
        }
      });
    }

    function getActiveAvailability() {
      return Array.from(new Set(availabilityInputs.filter(function (input) {
        return input.checked;
      }).map(function (input) {
        return normalizeStatus(input.dataset.status);
      })));
    }

    function syncAvailabilityInputs(changedInput) {
      var changedStatus = normalizeStatus(changedInput.dataset.status);

      availabilityInputs.forEach(function (input) {
        if (input !== changedInput && normalizeStatus(input.dataset.status) === changedStatus) {
          input.checked = changedInput.checked;
        }
      });
    }

    function snapPriceValue(value) {
      var stepped = Math.round((value - priceConfig.min) / priceConfig.step) * priceConfig.step + priceConfig.min;
      return Math.min(priceConfig.max, Math.max(priceConfig.min, stepped));
    }

    function updatePriceUi() {
      priceGroups.forEach(function (group) {
        var summary = group.querySelector('[data-price-summary]');
        var minValue = group.querySelector('[data-price-value="min"]');
        var maxValue = group.querySelector('[data-price-value="max"]');
        var fill = group.querySelector('[data-range-fill]');
        var left = ((currentPriceRange.min - priceConfig.min) / (priceConfig.max - priceConfig.min)) * 100;
        var right = ((currentPriceRange.max - priceConfig.min) / (priceConfig.max - priceConfig.min)) * 100;

        if (summary) {
          summary.textContent = formatPrice(currentPriceRange.min) + ' - ' + formatPrice(currentPriceRange.max);
        }

        if (minValue) {
          minValue.textContent = formatPrice(currentPriceRange.min);
        }

        if (maxValue) {
          maxValue.textContent = formatPrice(currentPriceRange.max);
        }

        if (fill) {
          fill.style.left = left + '%';
          fill.style.width = Math.max(0, right - left) + '%';
        }
      });
    }

    function syncPriceInputs(changedInput) {
      var bound = changedInput.dataset.rangeBound;
      var nextMin = currentPriceRange.min;
      var nextMax = currentPriceRange.max;
      var changedValue = snapPriceValue(Number(changedInput.value));

      if (bound === 'min') {
        nextMin = changedValue;
        if (nextMin > nextMax) {
          nextMax = nextMin;
        }
      } else {
        nextMax = changedValue;
        if (nextMax < nextMin) {
          nextMin = nextMax;
        }
      }

      currentPriceRange.min = nextMin;
      currentPriceRange.max = nextMax;

      priceInputs.forEach(function (input) {
        input.value = input.dataset.rangeBound === 'min'
          ? String(currentPriceRange.min)
          : String(currentPriceRange.max);
      });

      updatePriceUi();
    }

    function getPriceRange() {
      return currentPriceRange;
    }

    function getBaseFilteredItems() {
      var priceRange = getPriceRange();
      var activeAvailability = getActiveAvailability();

      return items.filter(function (item) {
        var matchesPrice = item.price >= priceRange.min && item.price <= priceRange.max;
        var matchesAvailability = activeAvailability.indexOf(item.availability) !== -1;

        return matchesPrice && matchesAvailability;
      });
    }

    function updateCategoryCounts(baseItems) {
      var counts = {};

      allCategories.forEach(function (category) {
        counts[category] = 0;
      });

      baseItems.forEach(function (item) {
        counts[item.category] = (counts[item.category] || 0) + 1;
      });

      catCbs.forEach(function (cb) {
        var category = normalizeCategory(cb.dataset.cat);
        var label = getInputLabel(cb);

        if (label) {
          label.textContent = categoryNames[category] + ' (' + (counts[category] || 0) + ')';
        }
      });
    }

    function updateChipState(activeCategories) {
      if (!chips.length) {
        return;
      }

      var productCategories = Array.from(new Set(items.map(function (item) {
        return item.category;
      })));
      var allVisible = productCategories.every(function (category) {
        return activeCategories.indexOf(category) !== -1;
      });

      chips.forEach(function (chip) {
        var chipCategory = chip.dataset.filter === '*' ? '*' : normalizeCategory(chip.dataset.filter);
        var isActive = chipCategory === '*'
          ? allVisible
          : activeCategories.length === 1 && activeCategories[0] === chipCategory;

        chip.classList.toggle('active', isActive);
      });
    }

    function applyFilters() {
      var activeCategories = getActiveCategories();
      var baseItems = getBaseFilteredItems();
      var baseItemSet = new Set(baseItems);
      var showAll = allCategories.every(function (category) {
        return activeCategories.indexOf(category) !== -1;
      });

      items.forEach(function (item) {
        var matchesBase = baseItemSet.has(item);
        var matchesCategory = showAll || activeCategories.indexOf(item.category) !== -1;
        var visible = matchesBase && matchesCategory;
        item.column.classList.toggle('d-none', !visible);
      });

      updateCategoryCounts(baseItems);
      updateChipState(activeCategories);
    }

    catCbs.forEach(function (cb) {
      cb.addEventListener('change', function () {
        syncCategoryInputs(cb);
        applyFilters();
      });
    });

    priceInputs.forEach(function (input) {
      input.addEventListener('input', function () {
        syncPriceInputs(input);
        applyFilters();
      });

      input.addEventListener('change', function () {
        syncPriceInputs(input);
        applyFilters();
      });
    });

    availabilityInputs.forEach(function (input) {
      input.addEventListener('change', function () {
        syncAvailabilityInputs(input);
        applyFilters();
      });
    });

    chips.forEach(function (chip) {
      chip.addEventListener('click', function (e) {
        var selectedCategory = chip.dataset.filter;

        e.preventDefault();

        catCbs.forEach(function (cb) {
          cb.checked = selectedCategory === '*'
            ? true
            : normalizeCategory(cb.dataset.cat) === normalizeCategory(selectedCategory);
        });

        applyFilters();
      });
    });

    renderCatalogCategoryChart();
    updatePriceUi();
    applyFilters();

    /* Filtro por parámetro URL: catalogo.html?cat=asiento */
    var urlCat = new URLSearchParams(window.location.search).get('cat');
    if (urlCat) {
      var urlCatNorm = normalizeCategory(urlCat);
      catCbs.forEach(function (cb) {
        cb.checked = normalizeCategory(cb.dataset.cat) === urlCatNorm;
      });
      chips.forEach(function (chip) {
        var chipNorm = normalizeCategory(chip.dataset.filter);
        chip.classList.toggle('active', chipNorm === urlCatNorm);
      });
      applyFilters();
      /* Scroll suave al catálogo */
      var grid = document.getElementById('view-grid');
      if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }());


  /* --------------------------------------------------------
     3. Formulario de contacto con validación y toast
     -------------------------------------------------------- */
  var form  = document.getElementById('contact-form');
  var toast = document.getElementById('form-toast');

  if (form) {
    /* Validación cruzada fecha desde/hasta */
    var dateFrom     = document.getElementById('f-date-from');
    var dateTo       = document.getElementById('f-date-to');
    var dateFromErr  = document.getElementById('f-date-from-error');
    var dateToErr    = document.getElementById('f-date-to-error');

    function validateDates() {
      if (!dateFrom || !dateTo) return;
      var from = dateFrom.value;
      var to   = dateTo.value;

      /* Resetear errores previos */
      dateFrom.setCustomValidity('');
      dateTo.setCustomValidity('');
      if (dateFromErr) dateFromErr.textContent = 'Selecciona una fecha válida.';
      if (dateToErr)   dateToErr.textContent   = 'Selecciona una fecha válida.';

      /* "Hasta" no puede ser anterior a "Desde" */
      if (from && to && to < from) {
        dateTo.setCustomValidity('La fecha de fin debe ser igual o posterior a la de inicio.');
        if (dateToErr) dateToErr.textContent = 'La fecha de fin no puede ser anterior a la fecha de inicio.';
      }

      /* "Desde" no puede ser posterior a "Hasta" */
      if (from && to && from > to) {
        dateFrom.setCustomValidity('La fecha de inicio no puede ser posterior a la fecha de fin.');
        if (dateFromErr) dateFromErr.textContent = 'La fecha de inicio no puede ser posterior a la fecha de fin.';
      }

      /* Actualizar atributos min/max para refuerzo nativo */
      if (from) dateTo.min = from;
      if (to)   dateFrom.max = to;
    }

    if (dateFrom) dateFrom.addEventListener('change', validateDates);
    if (dateTo)   dateTo.addEventListener('change', validateDates);

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      /* Ejecutar validación cruzada antes del checkValidity nativo */
      validateDates();

      /* Validación nativa de Bootstrap */
      if (!form.checkValidity()) {
        /* Bootstrap usa was-validated para enseñar los mensajes de invalid-feedback. */
        form.classList.add('was-validated');
        return;
      }

      /* Mostrar toast de confirmación */
      if (toast) {
        /* Aquí sí llamamos al JS de Bootstrap directamente para arrancar el toast. */
        var bsToast = new bootstrap.Toast(toast, { delay: 5000 });
        bsToast.show();
      }

      form.reset();
      form.classList.remove('was-validated');
    });
  }

  /* --------------------------------------------------------
     4. Highcharts — Gráfico de inventario (nosotros.html)
        Solo se ejecuta si el contenedor existe en el DOM.
     -------------------------------------------------------- */
  if (document.getElementById('inventario-chart') && typeof Highcharts !== 'undefined') {
    Highcharts.chart('inventario-chart', {
      chart: {
        type: 'column',
        backgroundColor: 'transparent',
        style: { fontFamily: "'DM Sans', sans-serif" },
        animation: { duration: 900, easing: 'easeOutBounce' }
      },
      title: {
        text: 'Inventario por categoría',
        style: {
          fontFamily: "'Playfair Display', serif",
          fontSize: '1.5rem',
          color: '#1a1a1a'
        }
      },
      subtitle: {
        text: 'Número de piezas disponibles en la colección actual',
        style: { color: '#6b6b6b', fontSize: '0.88rem' }
      },
      xAxis: {
        categories: ['Asiento', 'Iluminación', 'Mobiliario', 'Menaje', 'Atrezzo', 'Peanas'],
        crosshair: true,
        labels: {
          style: { fontSize: '0.85rem', color: '#1a1a1a', fontWeight: '500' }
        },
        lineColor: '#ddd9d3'
      },
      yAxis: {
        min: 0,
        title: {
          text: 'Número de piezas',
          style: { color: '#6b6b6b', fontSize: '0.82rem' }
        },
        gridLineColor: '#e8e2da',
        labels: { style: { color: '#6b6b6b' } }
      },
      tooltip: {
        headerFormat: '<span style="font-size:0.82rem; color:#6b6b6b">{point.key}</span><br>',
        pointFormat: '<b style="color:#1a1a1a">{point.y} piezas</b>',
        backgroundColor: '#fff',
        borderColor: '#c4a882',
        borderRadius: 2,
        shadow: true,
        padding: 12
      },
      plotOptions: {
        column: {
          pointPadding: 0.12,
          borderWidth: 0,
          borderRadius: 2,
          color: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
              [0, '#c4a882'],
              [1, '#a0805c']
            ]
          },
          dataLabels: {
            enabled: true,
            format: '{point.y}',
            style: { fontSize: '0.8rem', fontWeight: '600', color: '#1a1a1a' }
          }
        }
      },
      series: [{
        name: 'Piezas disponibles',
        data: [42, 18, 25, 31, 47, 14]
      }],
      legend: { enabled: false },
      credits: { enabled: false }
    });
  }

});
