import { supabase } from './supabase.js';
import { listarPedidos } from './pedidos.js';

const { data: { session } } = await supabase.auth.getSession();
if (!session) {
    window.location.href = 'login.html';
    throw new Error('Não autenticado');
}

let todosPedidos   = [];
let watchId        = null;
let locAtiva       = false;

const el = id => document.getElementById(id);

function corStatus(s) {
    return { 'Recebido':'#F59E0B','Em Coleta':'#3B82F6','Em Rota':'#8B5CF6','Entregue':'#10B981' }[s] || '#94a3b8';
}

function formatarHora(iso) {
    if (!iso) return '-';
    return new Date(iso).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
}

// ── Contadores ───────────────────────────────────────
function atualizarContadores(pedidos) {
    const hoje = new Date().toDateString();
    const d = pedidos.filter(p => new Date(p.criado_em).toDateString() === hoje);
    el('totalPedidos').textContent   = d.length;
    el('totalRecebidos').textContent = d.filter(p => p.status === 'Recebido').length;
    el('totalRota').textContent      = d.filter(p => p.status === 'Em Rota').length;
    el('totalEntregues').textContent = d.filter(p => p.status === 'Entregue').length;
    const now = new Date();
    el('dataAtual').textContent = now.toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long' });
}

// ── Botão de navegar ─────────────────────────────────
function btnNavegar(label, rua, numero, bairro, cidade) {
    const btn = document.createElement('button');
    btn.className = 'btn-nav';
    btn.textContent = `🗺 ${label}`;
    btn.addEventListener('click', () => {
        const end = encodeURIComponent(`${rua || ''} ${numero || ''}, ${bairro || ''}, ${cidade || ''}`);
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${end}`, '_blank');
    });
    return btn;
}

// ── Renderizar pedidos ───────────────────────────────
function renderizarPedidos(pedidos) {
    const div = el('pedidos');
    div.innerHTML = '';

    const ativos    = pedidos.filter(p => p.status !== 'Entregue');
    const entregues = pedidos.filter(p => p.status === 'Entregue');

    if (ativos.length === 0 && entregues.length === 0) {
        div.innerHTML = '<p class="vazio">Nenhum pedido hoje.</p>';
        return;
    }

    [...ativos, ...entregues].forEach(pedido => {
        const cor  = corStatus(pedido.status);

        // parse destinos extras
        let extras = [];
        try {
            if (pedido.destinos_extras) {
                extras = typeof pedido.destinos_extras === 'string'
                    ? JSON.parse(pedido.destinos_extras)
                    : pedido.destinos_extras;
            }
        } catch(e) { extras = []; }

        const card = document.createElement('div');
        card.className = 'card-pedido' + (pedido.status === 'Entregue' ? ' entregue-card' : '');

        card.innerHTML = `
            <div class="cp-header" style="border-left:4px solid ${cor}">
                <div>
                    <span class="cp-numero">#${pedido.numero_pedido}</span>
                    <span class="cp-badge" style="background:${cor}22;color:${cor}">${pedido.status}</span>
                </div>
                <span class="cp-hora">${formatarHora(pedido.criado_em)}</span>
            </div>

            <div class="cp-body">
                <div class="destino-bloco">
                    <span class="destino-label">📦 Coleta</span>
                    <div class="cp-row">📍 <span>${pedido.bairro_coleta || '-'}, ${pedido.cidade_coleta || '-'}</span></div>
                    <div class="cp-row">👤 <span>${pedido.nome_coleta || '-'}</span></div>
                    <div class="cp-row">📞 <span>${pedido.telefone_coleta || '-'}</span></div>
                </div>

                <div class="destino-bloco principal">
                    <span class="destino-label">📍 Destino Principal</span>
                    <div class="cp-row">🏠 <span>${pedido.rua_destino || '-'}, ${pedido.numero_destino || ''}</span></div>
                    <div class="cp-row">📍 <span>${pedido.bairro_destino || '-'}, ${pedido.cidade_destino || '-'}</span></div>
                    <div class="cp-row">👤 <span>${pedido.nome_destino || '-'}</span></div>
                    <div class="cp-row">📞 <span>${pedido.telefone_destino || '-'}</span></div>
                </div>

                <div class="cp-row valor-row">💰 <span>R$ ${Number(pedido.valor_total || 0).toFixed(2)}</span></div>
            </div>

            <div class="cp-navs" id="navs-${pedido.id}"></div>

            <div class="cp-footer">
                <select class="sel-status" data-id="${pedido.id}">
                    <option value="Recebido"  ${pedido.status==='Recebido' ?'selected':''}>Recebido</option>
                    <option value="Em Coleta" ${pedido.status==='Em Coleta'?'selected':''}>Em Coleta</option>
                    <option value="Em Rota"   ${pedido.status==='Em Rota'  ?'selected':''}>Em Rota</option>
                    <option value="Entregue"  ${pedido.status==='Entregue' ?'selected':''}>Entregue</option>
                </select>
            </div>`;

        // Botões de navegação
        const navsDiv = card.querySelector(`#navs-${pedido.id}`);

        // Coleta
        navsDiv.appendChild(btnNavegar(
            'Ir à Coleta',
            pedido.rua_coleta, pedido.numero_coleta,
            pedido.bairro_coleta, pedido.cidade_coleta
        ));

        // Destino principal
        navsDiv.appendChild(btnNavegar(
            'Destino Principal',
            pedido.rua_destino, pedido.numero_destino,
            pedido.bairro_destino, pedido.cidade_destino
        ));

        // Destinos extras
        extras.forEach((d, i) => {
            navsDiv.appendChild(btnNavegar(
                `Extra #${i + 1} — ${d.bairro || d.cidade || ''}`,
                d.rua, d.numero, d.bairro, d.cidade
            ));
        });

        card.querySelector('.sel-status').addEventListener('change', e => {
            alterarStatus(pedido.id, e.target.value);
        });

        div.appendChild(card);
    });
}

// ── Alterar status ───────────────────────────────────
async function alterarStatus(id, status) {
    const { error } = await supabase.from('pedidos').update({ status }).eq('id', id);
    if (error) { alert('Erro ao atualizar'); return; }
    carregarPedidos();
}

// ── Carregar pedidos ─────────────────────────────────
async function carregarPedidos() {
    try {
        todosPedidos = await listarPedidos();
        atualizarContadores(todosPedidos);
        renderizarPedidos(todosPedidos);
    } catch(e) { console.error(e); }
}

// ── Localização GPS ──────────────────────────────────
async function salvarLocalizacao(lat, lng) {
    await supabase.from('motoboy_localizacao').upsert({
        id: 'motoboy1', lat, lng,
        atualizado_em: new Date().toISOString()
    });
}

function ativarLocalizacao() {
    if (!navigator.geolocation) {
        alert('Seu navegador não suporta geolocalização.');
        return;
    }

    if (locAtiva) {
        navigator.geolocation.clearWatch(watchId);
        locAtiva = false;
        el('btnLocalizacao').textContent = '📍 Compartilhar Localização';
        el('btnLocalizacao').classList.remove('ativo');
        el('statusLoc').textContent = 'Localização desativada';
        el('statusLoc').className = 'status-loc off';
        return;
    }

    el('btnLocalizacao').textContent = '⏳ Obtendo GPS...';

    watchId = navigator.geolocation.watchPosition(
        async (pos) => {
            locAtiva = true;
            const { latitude: lat, longitude: lng } = pos.coords;
            await salvarLocalizacao(lat, lng);
            el('btnLocalizacao').textContent = '🟢 Localização Ativa — Toque para pausar';
            el('btnLocalizacao').classList.add('ativo');
            el('statusLoc').textContent = `📡 Transmitindo (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
            el('statusLoc').className = 'status-loc on';
        },
        err => {
            alert('Não foi possível obter a localização. Verifique as permissões do navegador.');
            console.error(err);
            el('btnLocalizacao').textContent = '📍 Compartilhar Localização';
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
}

// ── Init ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    carregarPedidos();
    el('btnLocalizacao').addEventListener('click', ativarLocalizacao);
    setInterval(carregarPedidos, 15000);
});
