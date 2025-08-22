// Funções gerais do site
document.addEventListener('DOMContentLoaded', function() {
    // Menu mobile (se necessário)
    initMobileMenu();
    
    // Carrinho flutuante
    initFloatingCart();
    
    // Slider de ofertas
    initOfferSlider();
    
    // Verificar se estamos na página do restaurante
    if (document.querySelector('.restaurant-menu')) {
        initRestaurantPage();
    }
    
    // Verificar se estamos na página de checkout
    if (document.querySelector('.checkout-container')) {
        initCheckoutPage();
    }
});

function initMobileMenu() {
    // Implementação do menu mobile se necessário
    console.log('Inicializando menu mobile...');
}

function initFloatingCart() {
    const floatingCart = document.querySelector('.floating-cart');
    const cartModal = document.querySelector('.cart-modal');
    const closeCart = document.querySelector('.close-cart');
    
    if (floatingCart && cartModal) {
        floatingCart.addEventListener('click', function() {
            cartModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        });
        
        closeCart.addEventListener('click', function() {
            cartModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
        
        cartModal.addEventListener('click', function(e) {
            if (e.target === cartModal) {
                cartModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }
}

function initOfferSlider() {
    const slider = document.querySelector('.offer-slider');
    if (!slider) return;
    
    const slides = document.querySelectorAll('.offer-slide');
    let currentSlide = 0;
    
    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.style.opacity = i === index ? '1' : '0';
            slide.style.zIndex = i === index ? '1' : '0';
        });
    }
    
    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }
    
    // Mostrar primeiro slide
    showSlide(currentSlide);
    
    // Trocar slide a cada 5 segundos
    setInterval(nextSlide, 5000);
}

function initRestaurantPage() {
    // Navegação por categorias no menu
    const categoryLinks = document.querySelectorAll('.menu-categories li a');
    
    categoryLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remover classe active de todos os links
            categoryLinks.forEach(l => {
                l.parentElement.classList.remove('active');
            });
            
            // Adicionar classe active ao link clicado
            this.parentElement.classList.add('active');
            
            // Rolar até a seção correspondente
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
}

function initCheckoutPage() {
    // Validação do formulário de endereço
    const addressForm = document.getElementById('address-form');
    
    if (addressForm) {
        addressForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validação simples - na prática, seria mais robusta
            const cep = document.getElementById('cep').value.trim();
            const street = document.getElementById('street').value.trim();
            const number = document.getElementById('number').value.trim();
            const neighborhood = document.getElementById('neighborhood').value.trim();
            const city = document.getElementById('city').value.trim();
            const state = document.getElementById('state').value.trim();
            
            if (!cep || !street || !number || !neighborhood || !city || !state) {
                alert('Por favor, preencha todos os campos obrigatórios.');
                return;
            }
            
            // Avançar para a próxima etapa (simulação)
            const currentStep = document.querySelector('.checkout-steps .step.active');
            const nextStep = currentStep.nextElementSibling;
            
            if (nextStep) {
                currentStep.classList.remove('active');
                nextStep.classList.add('active');
                
                // Simular mudança de conteúdo
                document.querySelector('.checkout-form h2').textContent = 'Pagamento';
                document.querySelector('.continue-button').textContent = 'Finalizar Pedido';
            }
        });
    }
    
    // Busca automática de CEP (simulação)
    const cepInput = document.getElementById('cep');
    
    if (cepInput) {
        cepInput.addEventListener('blur', function() {
            const cep = this.value.replace(/\D/g, '');
            
            if (cep.length === 8) {
                // Simular busca de CEP
                console.log(`Buscando endereço para CEP: ${cep}`);
                
                // Simular retorno da API
                setTimeout(() => {
                    document.getElementById('street').value = 'Avenida Paulista';
                    document.getElementById('neighborhood').value = 'Bela Vista';
                    document.getElementById('city').value = 'São Paulo';
                    document.getElementById('state').value = 'SP';
                    
                    // Focar no campo número
                    document.getElementById('number').focus();
                }, 1000);
            }
        });
    }
}