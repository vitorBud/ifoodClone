// Funções específicas para registro
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se estamos na página de registro
    if (!document.getElementById('register-form')) return;
    
    // Inicializar funcionalidades
    initRegisterForm();
    initPasswordToggle();
    initPasswordStrength();
    initInputMasks();
    initSocialRegister();
});

function initRegisterForm() {
    const registerForm = document.getElementById('register-form');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const cpfInput = document.getElementById('cpf');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const termsCheckbox = document.getElementById('terms');
    
    const successModal = document.getElementById('success-modal');
    const errorModal = document.getElementById('error-modal');
    const closeError = document.getElementById('close-error');
    
    // Fechar modal de erro
    if (closeError) {
        closeError.addEventListener('click', function() {
            errorModal.style.display = 'none';
        });
    }
    
    // Validar formulário
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Resetar mensagens de erro
        clearErrorMessages();
        
        // Validar campos
        let isValid = true;
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const phone = phoneInput.value.trim().replace(/\D/g, '');
        const cpf = cpfInput.value.trim().replace(/\D/g, '');
        const password = passwordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();
        
        // Validar nome
        if (!name) {
            showError('name-error', 'Por favor, insira seu nome completo');
            isValid = false;
        } else if (name.split(' ').length < 2) {
            showError('name-error', 'Por favor, insira seu nome completo');
            isValid = false;
        }
        
        // Validar e-mail
        if (!email) {
            showError('email-error', 'Por favor, insira seu e-mail');
            isValid = false;
        } else if (!isValidEmail(email)) {
            showError('email-error', 'Por favor, insira um e-mail válido');
            isValid = false;
        }
        
        // Validar telefone
        if (!phone) {
            showError('phone-error', 'Por favor, insira seu telefone');
            isValid = false;
        } else if (phone.length < 11) {
            showError('phone-error', 'Por favor, insira um telefone válido');
            isValid = false;
        }
        
        // Validar CPF
        if (!cpf) {
            showError('cpf-error', 'Por favor, insira seu CPF');
            isValid = false;
        } else if (!isValidCPF(cpf)) {
            showError('cpf-error', 'Por favor, insira um CPF válido');
            isValid = false;
        }
        
        // Validar senha
        if (!password) {
            showError('password-error', 'Por favor, insira uma senha');
            isValid = false;
        } else if (password.length < 6) {
            showError('password-error', 'A senha deve ter pelo menos 6 caracteres');
            isValid = false;
        }
        
        // Validar confirmação de senha
        if (!confirmPassword) {
            showError('confirm-password-error', 'Por favor, confirme sua senha');
            isValid = false;
        } else if (password !== confirmPassword) {
            showError('confirm-password-error', 'As senhas não coincidem');
            isValid = false;
        }
        
        // Validar termos
        if (!termsCheckbox.checked) {
            showError('terms-error', 'Você deve aceitar os termos para continuar');
            isValid = false;
        }
        
        if (!isValid) return;
        
        // Simular cadastro (em um sistema real, seria uma chamada AJAX)
        simulateRegister(name, email, phone, cpf, password);
    });
    
    function simulateRegister(name, email, phone, cpf, password) {
        // Mostrar loading
        const submitButton = registerForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Criando conta...';
        submitButton.disabled = true;
        
        // Simular atraso de rede
        setTimeout(function() {
            // Verificar se o e-mail já está cadastrado (simulação)
            const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
            const userExists = registeredUsers.some(user => user.email === email);
            
            if (userExists) {
                // E-mail já cadastrado
                document.getElementById('error-message').textContent = 'Este e-mail já está cadastrado.';
                errorModal.style.display = 'flex';
            } else {
                // Cadastro bem-sucedido
                const newUser = {
                    name,
                    email,
                    phone,
                    cpf,
                    password // Em um sistema real, a senha seria hasheada
                };
                
                registeredUsers.push(newUser);
                localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
                
                // Mostrar modal de sucesso
                successModal.style.display = 'flex';
            }
            
            // Restaurar botão
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }, 2000);
    }
    
    function clearErrorMessages() {
        const errorMessages = document.querySelectorAll('.error-message');
        errorMessages.forEach(el => el.textContent = '');
    }
    
    function showError(id, message) {
        const element = document.getElementById(id);
        if (element) element.textContent = message;
    }
    
    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    function isValidCPF(cpf) {
        // Validação simplificada de CPF (apenas formato)
        return cpf.length === 11;
    }
}

function initPasswordStrength() {
    const passwordInput = document.getElementById('password');
    if (!passwordInput) return;
    
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        const strengthContainer = this.parentElement.parentElement;
        const strengthBars = strengthContainer.querySelectorAll('.strength-bar');
        const strengthLevel = strengthContainer.querySelector('#strength-level');
        
        // Resetar
        strengthContainer.className = 'password-strength';
        strengthLevel.textContent = 'fraca';
        
        if (password.length === 0) return;
        
        // Calcular força da senha
        let strength = 0;
        
        // Comprimento mínimo
        if (password.length >= 6) strength += 1;
        
        // Contém números
        if (/\d/.test(password)) strength += 1;
        
        // Contém caracteres especiais
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 1;
        
        // Contém letras maiúsculas e minúsculas
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1;
        
        // Atualizar UI
        if (strength >= 4) {
            strengthContainer.classList.add('password-strong');
            strengthLevel.textContent = 'forte';
        } else if (strength >= 2) {
            strengthContainer.classList.add('password-medium');
            strengthLevel.textContent = 'média';
        } else {
            strengthContainer.classList.add('password-weak');
        }
    });
}

function initInputMasks() {
    const phoneInput = document.getElementById('phone');
    const cpfInput = document.getElementById('cpf');
    
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = this.value.replace(/\D/g, '');
            
            if (value.length > 11) value = value.substring(0, 11);
            
            if (value.length > 0) {
                value = `(${value.substring(0, 2)}) ${value.substring(2)}`;
                
                if (value.length > 9) {
                    value = `${value.substring(0, 10)} ${value.substring(10)}`;
                }
                
                if (value.length > 15) {
                    value = `${value.substring(0, 15)}-${value.substring(15)}`;
                }
            }
            
            this.value = value;
        });
    }
    
    if (cpfInput) {
        cpfInput.addEventListener('input', function(e) {
            let value = this.value.replace(/\D/g, '');
            
            if (value.length > 11) value = value.substring(0, 11);
            
            if (value.length > 0) {
                value = `${value.substring(0, 3)}.${value.substring(3)}`;
                
                if (value.length > 7) {
                    value = `${value.substring(0, 7)}.${value.substring(7)}`;
                }
                
                if (value.length > 11) {
                    value = `${value.substring(0, 11)}-${value.substring(11)}`;
                }
            }
            
            this.value = value;
        });
    }
}

function initSocialRegister() {
    const googleButton = document.querySelector('.auth-social.google');
    const facebookButton = document.querySelector('.auth-social.facebook');
    const errorModal = document.getElementById('error-modal');
    const errorMessage = document.getElementById('error-message');
    
    if (googleButton) {
        googleButton.addEventListener('click', function() {
            // Simular cadastro com Google
            errorMessage.textContent = 'Cadastro com Google não está disponível no momento.';
            errorModal.style.display = 'flex';
        });
    }
    
    if (facebookButton) {
        facebookButton.addEventListener('click', function() {
            // Simular cadastro com Facebook
            errorMessage.textContent = 'Cadastro com Facebook não está disponível no momento.';
            errorModal.style.display = 'flex';
        });
    }
}