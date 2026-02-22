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

  /* ===== TELEGRAM CONFIG ===== */
  const TG_BOT_TOKEN = '8326596673:AAGry0yITlOAEc6gGf4pA439zc4gL8PrfD0';
  const TG_CHAT_ID = '-5146109233';

  async function sendToTelegram(text, imageUrl) {
    try {
      if (imageUrl) {
        await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendPhoto`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: TG_CHAT_ID,
            photo: imageUrl,
            caption: text,
            parse_mode: 'HTML'
          })
        });
      } else {
        await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: TG_CHAT_ID,
            text: text,
            parse_mode: 'HTML'
          })
        });
      }
    } catch (err) {
      console.error('Telegram error:', err);
    }
  }

  /* ===== PHONE MASK ===== */
  function initPhoneMask(input) {
    input.addEventListener('focus', () => {
      if (!input.value) input.value = '+38 (0';
    });

    input.addEventListener('input', () => {
      let raw = input.value.replace(/\D/g, '');
      if (raw.startsWith('380')) raw = raw.slice(3);
      else if (raw.startsWith('38')) raw = raw.slice(2);
      else if (raw.startsWith('0')) raw = raw.slice(1);

      raw = raw.slice(0, 9);

      let formatted = '+38 (0';
      if (raw.length > 0) formatted += raw.substring(0, 2);
      if (raw.length >= 2) formatted += ') ';
      if (raw.length > 2) formatted += raw.substring(2, 5);
      if (raw.length >= 5) formatted += '-';
      if (raw.length > 5) formatted += raw.substring(5, 7);
      if (raw.length >= 7) formatted += '-';
      if (raw.length > 7) formatted += raw.substring(7, 9);

      input.value = formatted;
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && input.value.length <= 6) {
        e.preventDefault();
      }
    });

    input.addEventListener('blur', () => {
      if (input.value === '+38 (0') input.value = '';
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
    setTimeout(closeModal, 2000);
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
    }, 3000);
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

});
