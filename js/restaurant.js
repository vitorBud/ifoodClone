// Funções específicas para a página do restaurante
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se estamos na página do restaurante
    if (!document.querySelector('.restaurant-menu')) return;
    
    // Rolagem suave para as seções do menu
    initMenuNavigation();
    
    // Carregar avaliações dinamicamente (simulação)
    loadReviews();
});

function initMenuNavigation() {
    const menuSections = document.querySelectorAll('.menu-section');
    const categoryLinks = document.querySelectorAll('.menu-categories a');
    
    // Observar seções do menu para destacar a categoria ativa
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const targetId = `#${entry.target.id}`;
                
                categoryLinks.forEach(link => {
                    link.parentElement.classList.remove('active');
                    
                    if (link.getAttribute('href') === targetId) {
                        link.parentElement.classList.add('active');
                    }
                });
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50% 0px'
    });
    
    menuSections.forEach(section => {
        observer.observe(section);
    });
}

function loadReviews() {
    const reviewContainer = document.querySelector('.review-container');
    if (!reviewContainer) return;
    
    // Simular carregamento de avaliações de uma API
    setTimeout(() => {
        // Em um cenário real, isso viria de uma requisição AJAX
        const mockReviews = [
            {
                name: "Carlos Oliveira",
                date: "15/05/2023",
                rating: 4.0,
                comment: "O lanche veio bem quente e rápido. Só achei que poderia ter mais molho.",
                initials: "CO"
            },
            {
                name: "Ana Beatriz",
                date: "02/05/2023",
                rating: 5.0,
                comment: "Adoro o Whopper! Sempre peço quando estou com muita fome. Entrega sempre dentro do prazo.",
                initials: "AB"
            }
        ];
        
        // Adicionar novas avaliações ao container
        mockReviews.forEach(review => {
            const reviewCard = document.createElement('div');
            reviewCard.className = 'review-card';
            reviewCard.innerHTML = `
                <div class="review-header">
                    <div class="reviewer">
                        <div class="reviewer-avatar">${review.initials}</div>
                        <div class="reviewer-info">
                            <h4>${review.name}</h4>
                            <span class="review-date">${review.date}</span>
                        </div>
                    </div>
                    <div class="review-rating">
                        <span>${review.rating.toFixed(1)}</span>
                        <i class="fas fa-star"></i>
                    </div>
                </div>
                <div class="review-content">
                    <p>${review.comment}</p>
                </div>
            `;
            
            reviewContainer.appendChild(reviewCard);
        });
    }, 1000);
}