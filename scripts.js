// === Configuración editable para personalizar el negocio ===
const BUSINESS_CONFIG = {
    businessName: "Barbería Jesús Vilca",
    phoneNumber: "+51974820648",
    mapCoordinates: [-4.5800212, -81.2728562],
    mapZoom: 15,
    mapAddress: "Mariscal Castilla D-12",
    socialLinks: {
        tiktok: "https://tiktok.com/@barberiajesusvilca",
        instagram: "https://instagram.com/barberiajesusvilca",
        facebook: "https://facebook.com/barberiajesusvilca"
    },
    paymentQrImages: {
        yape: "assets/img/qr/yape-qr.png",
        plin: "assets/img/qr/plin-qr.png"
    },
    paymentInstructions: {
        yape: "Escanea el QR de Yape para realizar el pago completo de tu reserva.",
        plin: "Escanea el QR de Plin para realizar el pago completo de tu reserva."
    },
    schedules: {
        monday: [{ start: "09:00", end: "22:00" }],
        tuesday: [{ start: "09:00", end: "22:00" }],
        wednesday: [{ start: "09:00", end: "22:00" }],
        thursday: [{ start: "09:00", end: "22:00" }],
        friday: [{ start: "09:00", end: "22:00" }],
        saturday: [{ start: "09:00", end: "22:00" }],
        sunday: [{ start: "09:00", end: "17:00" }]
    },
    timeInterval: 30,
    servicesImagePath: "assets/img/servicios/",
    placeholderImage: "assets/img/placeholder.jpg"
};
// === Fin de la configuración editable ===

let cart = JSON.parse(localStorage.getItem('cart')) || [];

function loadSection(section) {
    fetch(`${section}.html`)
        .then(response => {
            if (!response.ok) throw new Error(`No se pudo cargar ${section}.html`);
            return response.text();
        })
        .then(data => {
            document.getElementById('content').innerHTML = data;
            if (section === 'servicios') initServicios();
            if (section === 'carrito') initCarrito();
            if (section === 'contacto') initContacto();
            if (section === 'inicio') initInicio();
            updateCartCount();
            localStorage.setItem('currentSection', section);
        })
        .catch(error => {
            console.error('Error al cargar la sección:', error);
            document.getElementById('content').innerHTML = '<p>Error al cargar el contenido. Revisa la consola para más detalles.</p>';
        });
}

document.addEventListener('DOMContentLoaded', () => {
    const lastSection = localStorage.getItem('currentSection') || 'inicio';
    loadSection(lastSection);
    updateCartCount();
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.getAttribute('data-section');
            loadSection(section);
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
});

function showNotification(title, message, action = null) {
    const notification = document.createElement('div');
    notification.classList.add('notification-modal-content');
    notification.innerHTML = `
        <h3>${title}</h3>
        <p>${message}</p>
        ${action ? `<button id="notification-action">${action.text}</button>` : ''}
    `;
    const modal = document.createElement('div');
    modal.classList.add('notification-modal', 'flex');
    modal.appendChild(notification);
    document.body.appendChild(modal);
    if (action) {
        document.getElementById('notification-action').addEventListener('click', () => {
            action.callback();
            modal.remove();
        });
    }
    setTimeout(() => modal.remove(), 5000);
}

function triggerCartJump() {
    const cartIcon = document.getElementById('cart-icon');
    if (cartIcon) {
        cartIcon.classList.add('cart-jump');
        setTimeout(() => cartIcon.classList.remove('cart-jump'), 300);
    }
}

function updateCartCount() {
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
        cartCount.classList.toggle('hidden', totalItems === 0);
    }
}

function renderCart() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const cartEmpty = document.getElementById('cart-empty');
    const clearCartBtn = document.getElementById('clear-cart-btn');
    const checkoutBtn = document.getElementById('checkout-btn');

    if (!cartItems || !cartTotal || !cartEmpty || !clearCartBtn || !checkoutBtn) return;

    if (cart.length === 0) {
        cartItems.classList.add('hidden');
        cartTotal.classList.add('hidden');
        cartEmpty.classList.remove('hidden');
        clearCartBtn.classList.add('hidden');
        checkoutBtn.classList.add('hidden');
    } else {
        cartItems.classList.remove('hidden');
        cartTotal.classList.remove('hidden');
        cartEmpty.classList.add('hidden');
        clearCartBtn.classList.remove('hidden');
        checkoutBtn.classList.remove('hidden');

        cartItems.innerHTML = '';
        let total = 0;

        cart.forEach((item, index) => {
            const li = document.createElement('li');
            li.classList.add('cart-item');
            const imageSrc = item.image && item.image.trim() !== "" ? item.image : BUSINESS_CONFIG.placeholderImage;
            li.innerHTML = `
                <img src="${imageSrc}" alt="${item.name}" class="cart-item-image" onerror="this.src='${BUSINESS_CONFIG.placeholderImage}'">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>S/ ${(item.price * item.quantity).toFixed(2)}</p>
                </div>
                <div class="cart-item-actions">
                    <button class="remove-btn" data-index="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            cartItems.appendChild(li);
            total += item.price * item.quantity;
        });

        cartTotal.textContent = `Total: S/ ${total.toFixed(2)}`;
    }
    updateCartCount();
    localStorage.setItem('cart', JSON.stringify(cart));
}

function generateTimeOptions(date) {
    const timeSelect = document.getElementById('order-time');
    if (!timeSelect) return;

    timeSelect.innerHTML = '<option value="">Selecciona una hora</option>';
    const selectedDate = new Date(date + 'T00:00:00-05:00');
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const selectedDay = dayNames[selectedDate.getDay()];
    const daySchedule = BUSINESS_CONFIG.schedules[selectedDay] || [];

    if (daySchedule.length === 0) {
        timeSelect.innerHTML = '<option value="">Día no disponible</option>';
        return;
    }

    daySchedule.forEach(shift => {
        let startTime = parseTime(shift.start);
        const endTime = parseTime(shift.end);

        while (startTime < endTime) {
            const timeString = formatTime(startTime);
            const option = document.createElement('option');
            option.value = timeString;
            option.textContent = timeString;
            timeSelect.appendChild(option);
            startTime.setMinutes(startTime.getMinutes() + BUSINESS_CONFIG.timeInterval);
        }
    });
}

function parseTime(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const time = new Date();
    time.setHours(hours, minutes, 0, 0);
    return time;
}

function formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

function initCarrito() {
    renderCart();

    const confirmationModal = document.getElementById('confirmation-modal');
    if (confirmationModal) {
        confirmationModal.classList.add('hidden');
        confirmationModal.classList.remove('flex');
    }

    const cartItems = document.getElementById('cart-items');
    if (cartItems) {
        cartItems.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-btn') || e.target.parentElement.classList.contains('remove-btn')) {
                const index = e.target.closest('.remove-btn').getAttribute('data-index');
                cart.splice(index, 1);
                renderCart();
            }
        });
    }

    const clearCartBtn = document.getElementById('clear-cart-btn');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', () => {
            cart = [];
            renderCart();
            showNotification('Carrito vacío', 'Todos los servicios han sido eliminados.');
        });
    }

    const goToServicesBtn = document.getElementById('go-to-services');
    if (goToServicesBtn) {
        goToServicesBtn.addEventListener('click', () => loadSection('servicios'));
    }

    const checkoutBtn = document.getElementById('checkout-btn');
    const detailsStep = document.getElementById('step-details');
    const itemsStep = document.getElementById('step-items');
    const detailsBack = document.getElementById('details-back');
    const orderForm = document.getElementById('order-form');
    const paymentSelect = document.getElementById('order-payment');
    const qrImage = document.getElementById('qr-image');
    const qrInstruction = document.getElementById('qr-instruction');
    const paymentQr = document.getElementById('payment-qr');
    const modalMessage = document.getElementById('modal-message');
    const modalCancel = document.getElementById('modal-cancel');
    const modalConfirm = document.getElementById('modal-confirm');
    const dateInput = document.getElementById('order-date');

    if (checkoutBtn && detailsStep && itemsStep && detailsBack && orderForm) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                showNotification('Carrito vacío', 'Añade al menos un servicio para continuar.');
                return;
            }
            itemsStep.classList.add('hidden');
            detailsStep.classList.remove('hidden');
        });

        detailsBack.addEventListener('click', () => {
            detailsStep.classList.add('hidden');
            itemsStep.classList.remove('hidden');
            if (paymentQr) paymentQr.classList.add('hidden');
        });

        if (paymentSelect && paymentQr && qrImage && qrInstruction) {
            paymentSelect.addEventListener('change', () => {
                const payment = paymentSelect.value;
                if (payment === "QR de Yape" || payment === "QR de Plin") {
                    const paymentKey = payment === "QR de Yape" ? "yape" : "plin";
                    paymentQr.classList.remove('hidden');
                    qrImage.src = BUSINESS_CONFIG.paymentQrImages[paymentKey];
                    qrInstruction.textContent = BUSINESS_CONFIG.paymentInstructions[paymentKey];
                } else {
                    paymentQr.classList.add('hidden');
                }
            });
        }

        if (dateInput) {
            const today = new Date().toLocaleDateString('es-PE', { timeZone: 'America/Lima' }).split('/').reverse().join('-');
            dateInput.setAttribute('min', today);
            dateInput.addEventListener('change', (e) => {
                generateTimeOptions(e.target.value);
            });
        }

        orderForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('order-name').value;
            const date = document.getElementById('order-date').value;
            const time = document.getElementById('order-time').value;
            const barber = document.getElementById('order-barber').value;
            const payment = document.getElementById('order-payment').value;

            if (!time) {
                showNotification('Hora inválida', 'Por favor selecciona una hora válida.');
                return;
            }

            if (payment === "") {
                showNotification('Método de pago inválido', 'Por favor selecciona un medio de pago.');
                return;
            }

            const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

            let modalText = `
                <div class="text-left">
                    <p class="mb-2"><strong class="text-yellow-400">Cliente:</strong> ${name}</p>
                    <p class="mb-2"><strong class="text-yellow-400">Fecha:</strong> ${date}</p>
                    <p class="mb-2"><strong class="text-yellow-400">Hora:</strong> ${time}</p>
                    <p class="mb-2"><strong class="text-yellow-400">Barbero:</strong> ${barber}</p>
                    <p class="mb-2"><strong class="text-yellow-400">Servicios:</strong></p>
                    <ul class="list-disc list-inside mb-2">
                        ${cart.map(item => `<li>${item.name}: S/ ${item.price.toFixed(2)}</li>`).join('')}
                    </ul>
                    <p class="mb-2"><strong class="text-yellow-400">Total a pagar:</strong> S/ ${total.toFixed(2)}</p>
                    <p class="mb-2"><strong class="text-yellow-400">Método de pago:</strong> ${payment}</p>
                    <p class="text-sm text-gray-300">Por favor, realiza el pago completo para confirmar tu reserva.</p>
                </div>
            `;
            if (modalMessage) {
                modalMessage.innerHTML = modalText;
            } else {
                console.error('Elemento #modal-message no encontrado');
            }
            if (confirmationModal) {
                confirmationModal.classList.remove('hidden');
                confirmationModal.classList.add('flex');
            }

            if (modalCancel) {
                modalCancel.onclick = () => {
                    confirmationModal.classList.add('hidden');
                    confirmationModal.classList.remove('flex');
                };
            } else {
                console.error('Botón #modal-cancel no encontrado');
            }

            if (modalConfirm) {
                modalConfirm.onclick = () => {
                    let message = `💈 *${BUSINESS_CONFIG.businessName} - Nueva Reserva* 💈\n\n`;
                    message += `👤 *Cliente:* ${name}\n`;
                    message += `📅 *Fecha:* ${date}\n`;
                    message += `⏰ *Hora:* ${time}\n`;
                    message += `💇‍♂️ *Barbero:* ${barber}\n`;
                    message += `📍 *Ubicación:* ${BUSINESS_CONFIG.mapAddress}\n`;
                    message += `📋 *Servicios:*\n`;
                    cart.forEach(item => {
                        message += `- ${item.name}: S/ ${item.price.toFixed(2)}\n`;
                    });
                    message += `\n💵 *Total a pagar:* S/ ${total.toFixed(2)}\n`;
                    message += `💳 *Método de pago:* ${payment}\n`;
                    message += `📲 *Instrucción:* ${payment === "QR de Yape" ? BUSINESS_CONFIG.paymentInstructions.yape : BUSINESS_CONFIG.paymentInstructions.plin} Envía el comprobante al WhatsApp para confirmar tu reserva.\n`;

                    const whatsappUrl = `https://wa.me/${BUSINESS_CONFIG.phoneNumber}?text=${encodeURIComponent(message)}`;
                    window.open(whatsappUrl, '_blank');
                    cart = [];
                    renderCart();
                    detailsStep.classList.add('hidden');
                    itemsStep.classList.remove('hidden');
                    if (paymentQr) paymentQr.classList.add('hidden');
                    confirmationModal.classList.add('hidden');
                    confirmationModal.classList.remove('flex');
                    showNotification('Reserva enviada', 'Tu reserva ha sido enviada por WhatsApp. ¡Gracias por elegirnos!');
                };
            } else {
                console.error('Botón #modal-confirm no encontrado');
            }
        });
    }
}

function initServicios() {
    const categories = document.querySelectorAll('.category');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const allItemsContainer = document.querySelector('.category[data-category="todos"] .items');

    if (allItemsContainer) {
        const promoItems = document.querySelectorAll('.category[data-category="promociones"] .item');
        promoItems.forEach(item => allItemsContainer.appendChild(item.cloneNode(true)));
        const otherItems = document.querySelectorAll('.category[data-category="cortes"] .item, .category[data-category="cuidado"] .item');
        otherItems.forEach(item => allItemsContainer.appendChild(item.cloneNode(true)));
    }

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.getAttribute('data-category');
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            categories.forEach(cat => {
                cat.classList.add('hidden');
                if (cat.getAttribute('data-category') === category) {
                    cat.classList.remove('hidden');
                }
            });
        });
    });

    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', () => {
            const item = button.closest('.item');
            const name = button.getAttribute('data-name');
            const price = parseFloat(button.getAttribute('data-price'));
            const image = button.getAttribute('data-image') || BUSINESS_CONFIG.placeholderImage;

            const existingItem = cart.find(i => i.name === name);
            if (existingItem) {
                showNotification('Servicio ya añadido', `${name} ya está en tu carrito.`);
                return;
            }

            cart.push({ name, price, image, quantity: 1 });
            triggerCartJump();
            updateCartCount();
            localStorage.setItem('cart', JSON.stringify(cart));

            if (name.includes('Corte')) {
                showNotification(
                    'Servicio añadido',
                    `${name} se ha añadido al carrito. ¿Te gustaría agregar un afeitado por S/ 15.00?`,
                    {
                        text: 'Añadir afeitado',
                        callback: () => {
                            cart.push({ name: 'Afeitado', price: 15.00, image: `${BUSINESS_CONFIG.servicesImagePath}afeitado1.jpg`, quantity: 1 });
                            triggerCartJump();
                            updateCartCount();
                            localStorage.setItem('cart', JSON.stringify(cart));
                            showNotification('Afeitado añadido', 'Se añadió un afeitado al carrito.');
                        }
                    }
                );
            } else if (cart.length === 2) {
                showNotification(
                    'Oferta especial',
                    'Has añadido 2 servicios. ¿Quieres el combo Corte + Afeitado por S/ 30.00?',
                    {
                        text: 'Aceptar promoción',
                        callback: () => {
                            cart = [{ name: 'Corte + Afeitado', price: 30.00, image: `${BUSINESS_CONFIG.servicesImagePath}promo1.jpg`, quantity: 1 }];
                            triggerCartJump();
                            updateCartCount();
                            localStorage.setItem('cart', JSON.stringify(cart));
                            showNotification('Promoción añadida', 'Se aplicó el combo Corte + Afeitado.');
                        }
                    }
                );
            } else {
                showNotification('Servicio añadido', `${name} se ha añadido al carrito.`);
            }
        });
    });

    const modal = document.getElementById('service-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalDescription = document.getElementById('modal-description');
    const modalClose = document.getElementById('modal-close');

    if (modal && modalTitle && modalDescription && modalClose) {
        document.querySelectorAll('.view-details-btn').forEach(button => {
            button.addEventListener('click', () => {
                const name = button.getAttribute('data-name');
                const description = button.getAttribute('data-description');

                modalTitle.textContent = name;
                modalDescription.textContent = description;
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            });
        });

        modalClose.addEventListener('click', () => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        });
    }
}

function initContacto() {
    const directionsBtn = document.getElementById('directions-btn');
    const locationModal = document.getElementById('location-modal');
    const visitBtn = document.getElementById('visit-btn');

    if (directionsBtn && locationModal && visitBtn) {
        directionsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            locationModal.classList.remove('hidden');
            locationModal.classList.add('flex');
        });

        visitBtn.addEventListener('click', () => {
            // Abrir Google Maps directamente con la dirección del negocio
            const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(BUSINESS_CONFIG.mapAddress)}`;
            window.open(mapsUrl, '_blank');
            locationModal.classList.add('hidden');
            locationModal.classList.remove('flex');
        });

        locationModal.addEventListener('click', (e) => {
            if (e.target === locationModal) {
                locationModal.classList.add('hidden');
                locationModal.classList.remove('flex');
            }
        });
    }

    const mapContainer = document.getElementById('map');
    if (mapContainer) {
        mapContainer.classList.remove('hidden');
        const map = L.map('map').setView(BUSINESS_CONFIG.mapCoordinates, BUSINESS_CONFIG.mapZoom);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);
        L.marker(BUSINESS_CONFIG.mapCoordinates).addTo(map)
            .bindPopup(BUSINESS_CONFIG.businessName)
            .openPopup();
        setTimeout(() => map.invalidateSize(), 100);
    }
}

function initInicio() {
    const slides = document.querySelectorAll('.slide');
    let currentSlide = 0;

    if (slides.length === 0) return;

    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
        });
    }

    showSlide(currentSlide);
    setInterval(() => {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }, 5000);
}