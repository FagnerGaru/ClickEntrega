import { supabase } from './supabase.js';

const telaLogin = document.getElementById('telaLogin');
const telaMenu  = document.getElementById('telaMenu');

function mostrarMenu(email) {
    telaLogin.style.display = 'none';
    telaMenu.style.display  = 'block';
    document.getElementById('emailLogado').textContent = `Logado como ${email}`;
}

// Verifica se já está logado ao carregar a página
supabase.auth.getSession().then(({ data }) => {
    if (data?.session?.user) {
        mostrarMenu(data.session.user.email);
    }
});

// Login
document.getElementById('btnLogin').addEventListener('click', async () => {
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;
    const btn   = document.getElementById('btnLogin');

    if (!email || !senha) {
        alert('Preencha email e senha.');
        return;
    }

    btn.textContent = 'Entrando...';
    btn.disabled    = true;

    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

    btn.textContent = 'Entrar';
    btn.disabled    = false;

    if (error) {
        alert('Email ou senha incorretos.');
        return;
    }

    const { data } = await supabase.auth.getSession();
    mostrarMenu(data.session.user.email);
});

// Enter no campo de senha faz login
document.getElementById('senha').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('btnLogin').click();
});

// Sair
document.getElementById('btnSair').addEventListener('click', async () => {
    await supabase.auth.signOut();
    telaMenu.style.display  = 'none';
    telaLogin.style.display = 'flex';
    document.getElementById('email').value = '';
    document.getElementById('senha').value = '';
});
