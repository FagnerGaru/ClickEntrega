import { supabase } from './supabase.js';

const params = new URLSearchParams(window.location.search);
const codigo = params.get('codigo');

function montarTimeline(status) {
    const etapas = ['Recebido', 'Em Coleta', 'Em Rota', 'Entregue'];
    const atual = etapas.indexOf(status);
    return etapas.map((etapa, index) => {
        let classe = 'pendente';
        if (index < atual) classe = 'concluido';
        if (index === atual) classe = 'atual';
        const icones = ['📥', '🏍️', '🚦', '✅'];
        return `
            <div class="etapa ${classe}">
                <div class="bolinha">${icones[index]}</div>
                <div class="etapa-info">
                    <span class="etapa-nome">${etapa}</span>
                </div>
            </div>`;
    }).join('');
}

async function carregarLocalizacaoMotoboy(pedidoStatus) {
    const divLoc = document.getElementById('localizacao');
    if (!divLoc) return;

    if (pedidoStatus !== 'Em Coleta' && pedidoStatus !== 'Em Rota') {
        divLoc.innerHTML = '';
        return;
    }

    const { data, error } = await supabase
        .from('motoboy_localizacao')
        .select('lat, lng, atualizado_em')
        .eq('id', 'motoboy1')
        .single();

    if (error || !data) {
        divLoc.innerHTML = '';
        return;
    }

    const atualizadoHa = Math.floor((Date.now() - new Date(data.atualizado_em)) / 1000);
    const tempoTexto = atualizadoHa < 60
        ? `${atualizadoHa}s atrás`
        : `${Math.floor(atualizadoHa/60)}min atrás`;

    divLoc.innerHTML = `
        <div class="loc-card">
            <div class="loc-header">
                <span>🏍️ Localização do Motoboy</span>
                <span class="loc-tempo">atualizado ${tempoTexto}</span>
            </div>
            <a
                class="btn-mapa"
                href="https://www.google.com/maps?q=${data.lat},${data.lng}"
                target="_blank">
                📍 Ver no Google Maps
            </a>
        </div>`;
}

async function carregarPedido() {
    const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('codigo_rastreio', codigo)
        .single();

    const div = document.getElementById('pedido');

    if (error || !data) {
        div.innerHTML = '<div class="erro">Pedido não encontrado.</div>';
        return;
    }

    div.innerHTML = `
        <div class="card-rastreio">
            <div class="r-header">
                <h2>Pedido #${data.numero_pedido}</h2>
                <span class="r-codigo">🔑 ${data.codigo_rastreio}</span>
            </div>
            <div class="r-info">
                <div class="r-row">👤 <span>${data.nome_coleta || '-'}</span></div>
                <div class="r-row">💰 <span>R$ ${Number(data.valor_total || 0).toFixed(2)}</span></div>
            </div>
            <div class="timeline">${montarTimeline(data.status)}</div>
        </div>
        <div id="localizacao"></div>`;

    await carregarLocalizacaoMotoboy(data.status);
}

await carregarPedido();
setInterval(carregarPedido, 6000);
