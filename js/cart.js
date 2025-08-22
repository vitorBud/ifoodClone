// Gerenciamento do carrinho de compras
class ShoppingCart {
    constructor() {
        this.cart = [];
        this.loadCart();
        this.updateCartUI();
        this.initCartEvents();
    }
    
    loadCart() {
        const savedCart = localStorage.getItem('shoppingCart');
        if (savedCart) {
            this.cart = JSON.parse(savedCart);
        }
    }
    
    saveCart() {
        localStorage.setItem('shoppingCart', JSON.stringify(this.cart));
    }
    
    addItem(id, name, price, quantity = 1) {
        const existingItem = this.cart.find(item => item.id === id);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.cart.push({ id, name, price, quantity });
        }
        
        this.saveCart();
        this.updateCartUI();
        this.showAddedNotification(name);
    }
    
    removeItem(id) {
        this.cart = this.cart.filter(item => item.id !== id);
        this.saveCart();
        this.updateCartUI();
    }
    
    updateQuantity(id, newQuantity) {
        const item = this.cart.find(item => item.id === id);
        
        if (item) {
            if (newQuantity > 0) {
                item.quantity = newQuantity;
            } else {
                this.removeItem(id);
            }
            
            this.saveCart();
            this.updateCartUI();
        }
    }
    
    getTotalItems() {
        return this.cart.reduce((total, item) => total + item.quantity, 0);
    }
    
    getSubtotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }
    
    getDeliveryFee() {
        return 5.90; // Taxa fixa para simplificação
    }
    
    getTotal() {
        return this.getSubtotal() + this.getDeliveryFee();
    }
    
    updateCartUI() {
        // Atualizar contador no ícone do carrinho
        const cartCounters = document.querySelectorAll('.cart-count, .cart-badge');
        const totalItems = this.getTotalItems();
        
        cartCounters.forEach(counter => {
            counter.textContent = totalItems;
        });
        
        // Atualizar total flutuante
        const floatingCartTotal = document.querySelector('.floating-cart .cart-total');
        if (floatingCartTotal) {
            floatingCartTotal.textContent = `R$ ${this.getTotal().toFixed(2)}`;
        }
        
        // Atualizar modal do carrinho se estiver visível
        this.updateCartModal();
    }
    
    updateCartModal() {
        const cartItemsContainer = document.querySelector('.cart-items');
        const subtotalElement = document.querySelector('.subtotal-amount');
        const deliveryElement = document.querySelector('.delivery-amount');
        const totalElement = document.querySelector('.total-amount');
        
        if (cartItemsContainer) {
            // Limpar itens existentes
            cartItemsContainer.innerHTML = '';
            
            // Adicionar itens ao carrinho
            if (this.cart.length === 0) {
                cartItemsContainer.innerHTML = '<p class="empty-cart">Seu carrinho está vazio</p>';
            } else {
                this.cart.forEach(item => {
                    const cartItem = document.createElement('div');
                    cartItem.className = 'cart-item';
                    cartItem.innerHTML = `
                        <div class="item-details">
                            <h4>${item.name}</h4>
                            <p>R$ ${item.price.toFixed(2)}</p>
                        </div>
                        <div class="item-price">
                            R$ ${(item.price * item.quantity).toFixed(2)}
                        </div>
                        <div class="item-quantity">
                            <button class="quantity-btn minus" data-id="${item.id}">-</button>
                            <span class="quantity-value">${item.quantity}</span>
                            <button class="quantity-btn plus" data-id="${item.id}">+</button>
                        </div>
                        <div class="remove-item" data-id="${item.id}">
                            <i class="fas fa-trash"></i>
                        </div>
                    `;
                    cartItemsContainer.appendChild(cartItem);
                });
            }
            
            // Atualizar totais
            if (subtotalElement && deliveryElement && totalElement) {
                subtotalElement.textContent = `R$ ${this.getSubtotal().toFixed(2)}`;
                deliveryElement.textContent = `R$ ${this.getDeliveryFee().toFixed(2)}`;
                totalElement.textContent = `R$ ${this.getTotal().toFixed(2)}`;
            }
        }
    }
    
    showAddedNotification(itemName) {
        // Criar notificação
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${itemName} adicionado ao carrinho!</span>
        `;
        
        document.body.appendChild(notification);
        
        // Mostrar notificação
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Esconder notificação após 3 segundos
        setTimeout(() => {
            notification.classList.remove('show');
            
            // Remover notificação do DOM após a animação
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    initCartEvents() {
        // Adicionar itens ao carrinho
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-to-cart')) {
                const button = e.target;
                const id = button.getAttribute('data-id');
                const name = button.getAttribute('data-name');
                const price = parseFloat(button.getAttribute('data-price'));
                
                this.addItem(id, name, price);
            }
        });
        
        // Manipular eventos dentro do modal do carrinho
        document.addEventListener('click', (e) => {
            const cartModal = document.querySelector('.cart-modal');
            if (!cartModal || cartModal.style.display !== 'flex') return;
            
            // Aumentar quantidade
            if (e.target.classList.contains('plus') || e.target.parentElement.classList.contains('plus')) {
                const button = e.target.classList.contains('plus') ? e.target : e.target.parentElement;
                const id = button.getAttribute('data-id');
                const item = this.cart.find(item => item.id === id);
                
                if (item) {
                    this.updateQuantity(id, item.quantity + 1);
                }
            }
            
            // Diminuir quantidade
            if (e.target.classList.contains('minus') || e.target.parentElement.classList.contains('minus')) {
                const button = e.target.classList.contains('minus') ? e.target : e.target.parentElement;
                const id = button.getAttribute('data-id');
                const item = this.cart.find(item => item.id === id);
                
                if (item) {
                    this.updateQuantity(id, item.quantity - 1);
                }
            }
            
            // Remover item
            if (e.target.classList.contains('remove-item') || 
                e.target.classList.contains('fa-trash') || 
                e.target.parentElement.classList.contains('remove-item')) {
                const element = e.target.classList.contains('remove-item') ? e.target : 
                              e.target.classList.contains('fa-trash') ? e.target.parentElement : 
                              e.target.parentElement;
                const id = element.getAttribute('data-id');
                this.removeItem(id);
            }
        });
        
        // Finalizar pedido
        const checkoutButton = document.querySelector('.checkout-button');
        if (checkoutButton) {
            checkoutButton.addEventListener('click', () => {
                if (this.cart.length > 0) {
                    window.location.href = 'checkout.html';
                } else {
                    alert('Seu carrinho está vazio. Adicione itens antes de finalizar o pedido.');
                }
            });
        }
    }
}

// Inicializar o carrinho quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.shoppingCart = new ShoppingCart();
});