document.addEventListener('DOMContentLoaded', () => {

  /* ===== VALIDATION MESSAGES (UK) ===== */
  document.querySelectorAll('input[required]').forEach(input => {
    input.addEventListener('invalid', () => {
      input.setCustomValidity('Будь ласка, заповніть це поле');
    });
    input.addEventListener('input', () => {
      input.setCustomValidity('');
    });
  });

  /* ===== TELEGRAM PROXY ===== */
  const TG_WORKER = 'https://tg-proxy.rostislavtruhim013.workers.dev';

  async function sendToTelegram(text, imageUrl) {
    try {
      await fetch(TG_WORKER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: imageUrl ? 'photo' : 'message',
          text: text,
          imageUrl: imageUrl || null
        })
      });
    } catch (err) {
      console.error('Telegram error:', err);
    }
  }

  /* ===== PHONE MASK ===== */
  function initPhoneMask(input) {
    function normalize(val) {
      let d = val.replace(/\D/g, '');
      if (d.startsWith('380')) d = d.slice(3);
      else if (d.startsWith('38')) d = d.slice(2);
      else if (d.startsWith('80') && d.length > 2) d = d.slice(2);
      else if (d.startsWith('0')) d = d.slice(1);
      return d.slice(0, 9);
    }

    function format(d) {
      if (d.length === 0) return '+38 (0';
      if (d.length <= 2) return '+38 (0' + d;
      if (d.length <= 5) return '+38 (0' + d.slice(0, 2) + ') ' + d.slice(2);
      if (d.length <= 7) return '+38 (0' + d.slice(0, 2) + ') ' + d.slice(2, 5) + '-' + d.slice(5);
      return '+38 (0' + d.slice(0, 2) + ') ' + d.slice(2, 5) + '-' + d.slice(5, 7) + '-' + d.slice(7);
    }

    function apply(digits) {
      const formatted = format(digits);
      input.value = formatted;
      input.setSelectionRange(formatted.length, formatted.length);
    }

    input.addEventListener('focus', () => {
      if (!input.value) {
        input.value = '+38 (0';
        setTimeout(() => input.setSelectionRange(6, 6), 0);
      }
    });

    input.addEventListener('beforeinput', (e) => {
      if (e.inputType === 'insertFromPaste') return;
      if (e.inputType && e.inputType.startsWith('insert') && e.data) {
        e.preventDefault();
        const newDigits = e.data.replace(/\D/g, '');
        if (!newDigits) return;
        const current = normalize(input.value);
        const combined = current + newDigits;
        apply(combined.slice(0, 9));
      }
    });

    input.addEventListener('input', (e) => {
      apply(normalize(input.value));
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace') {
        e.preventDefault();
        const d = normalize(input.value);
        if (d.length === 0) return;
        apply(d.slice(0, -1));
      }
      if (e.key === 'Delete') {
        e.preventDefault();
      }
    });

    input.addEventListener('blur', () => {
      if (normalize(input.value).length === 0) input.value = '';
    });

    input.addEventListener('click', () => {
      const len = input.value.length;
      input.setSelectionRange(len, len);
    });
  }

  function validatePhone(value) {
    const digits = value.replace(/\D/g, '');
    return digits.length === 12;
  }

  function showFieldError(input, message) {
    clearFieldError(input);
    input.classList.add('input-error');
    const err = document.createElement('div');
    err.className = 'error-msg';
    err.textContent = message;
    input.parentNode.appendChild(err);
  }

  function clearFieldError(input) {
    input.classList.remove('input-error');
    const existing = input.parentNode.querySelector('.error-msg');
    if (existing) existing.remove();
  }

  const contactPhoneInput = document.getElementById('contactPhone');
  const modalPhoneInput = document.getElementById('modalPhone');
  initPhoneMask(contactPhoneInput);
  initPhoneMask(modalPhoneInput);

  /* ===== BURGER MENU ===== */
  const burger = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobileMenu');
  burger.addEventListener('click', () => {
    burger.classList.toggle('active');
    mobileMenu.classList.toggle('open');
  });

  /* ===== MODAL ===== */
  const overlay = document.getElementById('modalOverlay');
  const modalFormWrap = document.getElementById('modalFormWrap');
  const modalSuccess = document.getElementById('modalSuccess');
  const modalForm = document.getElementById('modalForm');
  let currentProduct = null;

  function openModal(product) {
    currentProduct = product || null;
    modalFormWrap.classList.remove('hidden');
    modalSuccess.classList.add('hidden');
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    clearFieldError(document.getElementById('modalName'));
    clearFieldError(modalPhoneInput);
    modalForm.reset();
  }

  function closeModal() {
    overlay.classList.add('hidden');
    document.body.style.overflow = '';
    currentProduct = null;
  }

  document.getElementById('modalClose').addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

  modalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('modalName');
    const name = nameInput.value.trim();
    const phone = modalPhoneInput.value.trim();
    let valid = true;

    clearFieldError(nameInput);
    clearFieldError(modalPhoneInput);

    if (!name) {
      showFieldError(nameInput, "Введіть ваше ім'я");
      valid = false;
    }
    if (!validatePhone(phone)) {
      showFieldError(modalPhoneInput, 'Введіть повний номер телефону');
      valid = false;
    }
    if (!valid) return;

    let text = '';
    let imageUrl = null;

    if (currentProduct) {
      text = `🛒 <b>Замовлення з сайту!</b>\n\n📦 ${currentProduct.title}\n💰 ${currentProduct.price} грн/м²\n\n🧑 Ім'я: ${name}\n📞 Телефон: ${phone}`;
      imageUrl = currentProduct.image;
    } else {
      text = `📮 <b>Зворотній дзвінок</b>\n\n🧑 Ім'я: ${name}\n📞 Телефон: ${phone}`;
    }

    await sendToTelegram(text, imageUrl);

    modalFormWrap.classList.add('hidden');
    modalSuccess.classList.remove('hidden');
    setTimeout(closeModal, 4000);
  });

  document.getElementById('headerCta').addEventListener('click', () => openModal());
  document.getElementById('mobileCta').addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    burger.classList.remove('active');
    openModal();
  });
  document.getElementById('heroCta').addEventListener('click', () => openModal());

  document.querySelectorAll('.order-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      openModal({
        title: btn.dataset.title,
        price: btn.dataset.price,
        image: btn.dataset.image
      });
    });
  });

  /* ===== CONTACT FORM (section) ===== */
  const contactForm = document.getElementById('contactForm');
  const contactSuccess = document.getElementById('contactSuccess');

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('contactName');
    const name = nameInput.value.trim();
    const phone = contactPhoneInput.value.trim();
    let valid = true;

    clearFieldError(nameInput);
    clearFieldError(contactPhoneInput);

    if (!name) {
      showFieldError(nameInput, "Введіть ваше ім'я");
      valid = false;
    }
    if (!validatePhone(phone)) {
      showFieldError(contactPhoneInput, 'Введіть повний номер телефону');
      valid = false;
    }
    if (!valid) return;

    const text = `📮 <b>Зворотній дзвінок</b>\n\n🧑 Ім'я: ${name}\n📞 Телефон: ${phone}`;
    await sendToTelegram(text);

    contactForm.classList.add('hidden');
    contactSuccess.classList.remove('hidden');
    setTimeout(() => {
      contactSuccess.classList.add('hidden');
      contactForm.classList.remove('hidden');
      contactForm.reset();
    }, 4000);
  });

  /* ===== FLOATING CONTACT ===== */
  const floatingBtn = document.getElementById('floatingBtn');
  const floatingMenu = document.getElementById('floatingMenu');

  floatingBtn.addEventListener('click', () => {
    floatingMenu.classList.toggle('hidden');
    floatingBtn.classList.toggle('active');
  });

  document.getElementById('floatingCallback').addEventListener('click', () => {
    floatingMenu.classList.add('hidden');
    floatingBtn.classList.remove('active');
    openModal();
  });

  document.addEventListener('click', e => {
    const floating = document.getElementById('floating');
    if (!floating.contains(e.target)) {
      floatingMenu.classList.add('hidden');
      floatingBtn.classList.remove('active');
    }
  });

  /* ===== FAQ ACCORDION ===== */
  const faqPadding = window.innerWidth >= 640 ? 20 : 16;

  document.querySelectorAll('.faq__item').forEach(item => {
    const summary = item.querySelector('.faq__question');
    const answer = item.querySelector('.faq__answer');

    summary.addEventListener('click', e => {
      e.preventDefault();
      if (item.open) {
        item.classList.remove('faq__item--open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
        answer.style.paddingBottom = faqPadding + 'px';
        requestAnimationFrame(() => {
          answer.style.maxHeight = '0';
          answer.style.paddingBottom = '0';
        });
        answer.addEventListener('transitionend', function handler(ev) {
          if (ev.propertyName !== 'max-height') return;
          answer.removeEventListener('transitionend', handler);
          item.open = false;
          answer.style.removeProperty('max-height');
          answer.style.removeProperty('padding-bottom');
        });
      } else {
        item.open = true;
        item.classList.add('faq__item--open');
        answer.style.maxHeight = '0';
        answer.style.paddingBottom = '0';
        const h = answer.scrollHeight + faqPadding;
        requestAnimationFrame(() => {
          answer.style.maxHeight = h + 'px';
          answer.style.paddingBottom = faqPadding + 'px';
        });
        answer.addEventListener('transitionend', function handler(ev) {
          if (ev.propertyName !== 'max-height') return;
          answer.removeEventListener('transitionend', handler);
          answer.style.removeProperty('max-height');
          answer.style.removeProperty('padding-bottom');
        });
      }
    });
  });

});
