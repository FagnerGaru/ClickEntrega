import { supabase } from './supabase.js';
import { listarPedidos, listarPedidosPorPeriodo } from './pedidos.js';

function atualizarContadores(pedidos) {
    const total       = pedidos.length;
    const recebidos   = pedidos.filter(p => p.status === 'Recebido').length;
    const entregues   = pedidos.filter(p => p.status === 'Entregue').length;
    const emRota      = pedidos.filter(p => p.status === 'Em Rota').length;
    const faturamento = pedidos.reduce((acc, p) => acc + Number(p.valor_total || 0), 0);

    const el = id => document.getElementById(id);
    if (el('totalPedidos'))  el('totalPedidos').textContent  = total;
    if (el('totalRecebidos')) el('totalRecebidos').textContent = recebidos;
    if (el('totalEntregues')) el('totalEntregues').textContent = entregues;
    if (el('totalRota'))     el('totalRota').textContent     = emRota;
    if (el('faturamento'))   el('faturamento').textContent   =
        'R$ ' + faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

function corStatus(status) {
    return { 'Recebido': '#F59E0B', 'Em Coleta': '#3B82F6', 'Em Rota': '#8B5CF6', 'Entregue': '#10B981' }[status] || '#64748B';
}

function renderizarPedidos(pedidos, filtroTexto = '') {
    const div = document.getElementById('pedidos');
    div.innerHTML = '';

    const filtrados = filtroTexto
        ? pedidos.filter(p =>
            p.numero_pedido.toString().includes(filtroTexto) ||
            (p.nome_coleta || '').toLowerCase().includes(filtroTexto.toLowerCase())
          )
        : pedidos;

    if (filtrados.length === 0) {
        div.innerHTML = '<p class="vazio">Nenhum pedido encontrado.</p>';
        return;
    }

    filtrados.forEach(pedido => {
        const cor = corStatus(pedido.status);
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-header">
                <h3>Pedido #${pedido.numero_pedido}</h3>
                <span class="badge" style="background:${cor}20;color:${cor};">${pedido.status}</span>
            </div>
            <div class="card-body">
                <div class="info-row"><span>👤 Cliente</span><strong>${pedido.nome_coleta || '-'}</strong></div>
                <div class="info-row"><span>📞 Telefone</span><strong>${pedido.telefone_coleta || '-'}</strong></div>
                <div class="info-row"><span>📍 Cidade</span><strong>${pedido.cidade_coleta || '-'}</strong></div>
                <div class="info-row"><span>💰 Valor</span><strong>R$ ${Number(pedido.valor_total || 0).toFixed(2)}</strong></div>
            </div>
            <div class="card-footer">
                <label>Alterar status:</label>
                <select data-id="${pedido.id}">
                    <option value="Recebido"  ${pedido.status === 'Recebido'  ? 'selected' : ''}>Recebido</option>
                    <option value="Em Coleta" ${pedido.status === 'Em Coleta' ? 'selected' : ''}>Em Coleta</option>
                    <option value="Em Rota"   ${pedido.status === 'Em Rota'   ? 'selected' : ''}>Em Rota</option>
                    <option value="Entregue"  ${pedido.status === 'Entregue'  ? 'selected' : ''}>Entregue</option>
                </select>
            </div>`;

        // addEventListener no select — sem onclick inline
        card.querySelector('select').addEventListener('change', e => {
            alterarStatus(pedido.id, e.target.value);
        });

        div.appendChild(card);
    });
}

let todosPedidos = [];

async function carregarPedidos() {
    try {
        todosPedidos = await listarPedidos();
        atualizarContadores(todosPedidos);
        const busca = document.getElementById('busca') || document.getElementById('buscaPedido');
        renderizarPedidos(todosPedidos, busca ? busca.value : '');
    } catch (e) {
        console.error(e);
        const div = document.getElementById('pedidos');
        if (div) div.innerHTML = '<p class="vazio">Erro ao carregar pedidos.</p>';
    }
}

async function filtrarPedidos() {
    const inicio = document.getElementById('dataInicio')?.value;
    const fim    = document.getElementById('dataFim')?.value;

    if (!inicio || !fim) {
        alert('Selecione a data inicial e a data final para filtrar.');
        return;
    }

    try {
        const pedidos = await listarPedidosPorPeriodo(inicio, fim + 'T23:59:59');
        todosPedidos = pedidos;
        atualizarContadores(pedidos);
        renderizarPedidos(pedidos);
    } catch (e) {
        console.error(e);
        alert('Erro ao filtrar pedidos.');
    }
}

async function alterarStatus(id, status) {
    const { error } = await supabase
        .from('pedidos')
        .update({ status })
        .eq('id', id);

    if (error) {
        alert('Erro ao atualizar status');
        console.error(error);
        return;
    }

    carregarPedidos();
}

document.addEventListener('DOMContentLoaded', () => {
    carregarPedidos();

    // Botões por ID — sem onclick no HTML
    document.getElementById('btnFiltrar')  ?.addEventListener('click', filtrarPedidos);
    document.getElementById('btnAtualizar')?.addEventListener('click', carregarPedidos);

    // Busca em tempo real
    const busca = document.getElementById('busca') || document.getElementById('buscaPedido');
    if (busca) {
        busca.addEventListener('input', () => renderizarPedidos(todosPedidos, busca.value));
    }

    // Auto-refresh a cada 10s
    setInterval(carregarPedidos, 10000);
});
