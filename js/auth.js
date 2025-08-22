// Funções de autenticação
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se estamos na página de login
    if (!document.getElementById('login-form')) return;
    
    // Inicializar funcionalidades
    initLoginForm();
    initPasswordToggle();
    initSocialLogin();
});

function initLoginForm() {
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const emailError = document.getElementById('email-error');
    const passwordError = document.getElementById('password-error');
    const successModal = document.getElementById('success-modal');
    const errorModal = document.getElementById('error-modal');
    const closeError = document.getElementById('close-error');
    
    // Fechar modal de erro
    if (closeError) {
        closeError.addEventListener('click', function() {
            errorModal.style.display = 'none';
        });
    }
    
    // Validar e-mail enquanto digita
    emailInput.addEventListener('input', function() {
        if (!isValidEmail(this.value)) {
            emailError.textContent = 'Por favor, insira um e-mail válido';
        } else {
            emailError.textContent = '';
        }
    });
    
    // Validar senha enquanto digita
    passwordInput.addEventListener('input', function() {
        if (this.value.length < 6) {
            passwordError.textContent = 'A senha deve ter pelo menos 6 caracteres';
        } else {
            passwordError.textContent = '';
        }
    });
    
    // Submeter formulário
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Resetar mensagens de erro
        emailError.textContent = '';
        passwordError.textContent = '';
        
        // Validar campos
        let isValid = true;
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        
        if (!email) {
            emailError.textContent = 'Por favor, insira seu e-mail';
            isValid = false;
        } else if (!isValidEmail(email)) {
            emailError.textContent = 'Por favor, insira um e-mail válido';
            isValid = false;
        }
        
        if (!password) {
            passwordError.textContent = 'Por favor, insira sua senha';
            isValid = false;
        } else if (password.length < 6) {
            passwordError.textContent = 'A senha deve ter pelo menos 6 caracteres';
            isValid = false;
        }
        
        if (!isValid) return;
        
        // Simular requisição de login (em um sistema real, seria uma chamada AJAX)
        simulateLogin(email, password);
    });
    
    function simulateLogin(email, password) {
        // Mostrar loading (simulação)
        const submitButton = loginForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
        submitButton.disabled = true;
        
        // Simular atraso de rede
        setTimeout(function() {
            // Verificar credenciais mockadas
            const mockUsers = [
                { email: 'usuario@exemplo.com', password: 'senha123' }
            ];
            
            const user = mockUsers.find(u => u.email === email && u.password === password);
            
            if (user) {
                // Login bem-sucedido
                successModal.style.display = 'flex';
                
                // Redirecionar após 2 segundos
                setTimeout(function() {
                    window.location.href = 'index.html';
                }, 2000);
                
                // Salvar sessão (em um sistema real, seria um token JWT)
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userEmail', email);
            } else {
                // Login falhou
                errorModal.style.display = 'flex';
            }
            
            // Restaurar botão
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }, 1500);
    }
    
    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
}

function initPasswordToggle() {
    const toggleButtons = document.querySelectorAll('.toggle-password');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
}

function initSocialLogin() {
    const googleButton = document.querySelector('.auth-social.google');
    const facebookButton = document.querySelector('.auth-social.facebook');
    const errorModal = document.getElementById('error-modal');
    const errorMessage = document.getElementById('error-message');
    
    if (googleButton) {
        googleButton.addEventListener('click', function() {
            // Simular login com Google
            errorMessage.textContent = 'Login com Google não está disponível no momento.';
            errorModal.style.display = 'flex';
        });
    }
    
    if (facebookButton) {
        facebookButton.addEventListener('click', function() {
            // Simular login com Facebook
            errorMessage.textContent = 'Login com Facebook não está disponível no momento.';
            errorModal.style.display = 'flex';
        });
    }
}

// Verificar se o usuário está logado ao carregar outras páginas
function checkAuth() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    // Atualizar links de navegação
    const authLinks = document.querySelectorAll('.navbar-links .nav-link');
    
    authLinks.forEach(link => {
        if (link.querySelector('.fa-user')) {
            if (isLoggedIn) {
                const userEmail = localStorage.getItem('userEmail');
                link.innerHTML = `<i class="fas fa-user"></i> ${userEmail}`;
                link.href = '#';
            } else {
                link.innerHTML = '<i class="fas fa-user"></i> Entrar';
                link.href = 'login.html';
            }
        }
    });
}

// Chamar checkAuth quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', checkAuth);