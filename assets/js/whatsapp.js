import { salvarPedido } from './pedidos.js';
import { calcular } from './calculo.js';

function v(val, fallback = '') {
    if (!val || val === 'null' || val.trim() === '') return fallback;
    return val.trim();
}

function linha(label, val) {
    const texto = v(val);
    return texto ? `${label}: ${texto}\n` : '';
}

export async function enviar() {

    const whatsapp  = '5548996483551';
    const principal = document.getElementById('principal');

    const nome        = v(document.getElementById('nomeColeta')?.value);
    const telefone    = v(document.getElementById('telefoneColeta')?.value);
    const rua         = v(document.getElementById('ruaColeta')?.value);
    const numero      = v(document.getElementById('numeroColeta')?.value);
    const complemento = v(document.getElementById('complementoColeta')?.value);
    const bairro      = v(document.getElementById('bairroColeta')?.value);
    const cidade      = v(document.getElementById('cidadeColeta')?.value);

    const nomeDestino        = v(document.getElementById('nomeDestino')?.value);
    const telefoneDestino    = v(document.getElementById('telefoneDestino')?.value);
    const ruaDestino         = v(document.getElementById('ruaDestino')?.value);
    const numeroDestino      = v(document.getElementById('numeroDestino')?.value);
    const complementoDestino = v(document.getElementById('complementoDestino')?.value);
    const cidadeDestino      = v(document.getElementById('cidadeDestino')?.value);
    const bairroDestino      = v(principal?.value);

    const dataEntrega = v(document.getElementById('dataEntrega')?.value);
    const horaEntrega = v(document.getElementById('horaEntrega')?.value);

    localStorage.setItem('nomeCliente', nome);
    localStorage.setItem('telefoneCliente', telefone);

    // ── Destinos extras ──────────────────────────────
    const destinosExtras = [];
    document.querySelectorAll('.dadosExtra').forEach((box, index) => {
        destinosExtras.push({
            nome:        v(box.querySelector('.extraNome')?.value),
            telefone:    v(box.querySelector('.extraTelefone')?.value),
            rua:         v(box.querySelector('.extraRua')?.value),
            numero:      v(box.querySelector('.extraNumero')?.value),
            complemento: v(box.querySelector('.extraComplemento')?.value),
            cidade:      v(document.querySelectorAll('.extraCidade')[index]?.value),
            bairro:      v(document.querySelectorAll('.extra')[index]?.value),
        });
    });

    const total = calcular();
    const codigoRastreio = Math.random().toString(36).substring(2, 10).toUpperCase();

    let pedidoBanco;
    try {
        pedidoBanco = await salvarPedido({
            nome_coleta:        nome || null,
            telefone_coleta:    telefone || null,
            cidade_coleta:      cidade || null,
            bairro_coleta:      bairro || null,
            rua_coleta:         rua || null,
            numero_coleta:      numero || null,
            complemento_coleta: complemento || null,

            nome_destino:        nomeDestino || null,
            telefone_destino:    telefoneDestino || null,
            cidade_destino:      cidadeDestino || null,
            bairro_destino:      bairroDestino || null,
            rua_destino:         ruaDestino || null,
            numero_destino:      numeroDestino || null,
            complemento_destino: complementoDestino || null,

            destinos_extras: destinosExtras.length > 0
                ? JSON.stringify(destinosExtras)
                : null,

            data_entrega:    dataEntrega || null,
            horario_entrega: horaEntrega || null,
            valor_total:     total,
            codigo_rastreio: codigoRastreio,
            status:          'Recebido',
        });
    } catch (err) {
        console.error(err);
        alert('Erro ao salvar pedido.');
        return;
    }

    const numeroPedido = pedidoBanco.numero_pedido;
    const linkRastreio = `${window.location.origin}${window.location.pathname.replace(/\/[^/]*$/, '')}/rastreio.html?codigo=${codigoRastreio}`;

    // ── Montar mensagem limpa ────────────────────────
    let msg = `🚚 *SOLICITAÇÃO DE ENTREGA*\n\n`;

    msg += `📦 *COLETA — Pedido #${numeroPedido}*\n`;
    msg += linha('Nome', nome);
    msg += linha('Telefone', telefone);
    msg += linha('Rua', rua + (numero ? `, ${numero}` : ''));
    msg += linha('Complemento', complemento);
    msg += linha('Bairro', bairro);
    msg += linha('Cidade', cidade);

    if (dataEntrega || horaEntrega) {
        msg += `\n📅 *AGENDAMENTO*\n`;
        msg += linha('Data', dataEntrega);
        msg += linha('Horário', horaEntrega);
    }

    msg += `\n📍 *DESTINO PRINCIPAL*\n`;
    msg += linha('Nome', nomeDestino);
    msg += linha('Telefone', telefoneDestino);
    msg += linha('Rua', ruaDestino + (numeroDestino ? `, ${numeroDestino}` : ''));
    msg += linha('Complemento', complementoDestino);
    msg += linha('Bairro', bairroDestino);
    msg += linha('Cidade', cidadeDestino);

    destinosExtras.forEach((d, i) => {
        msg += `\n📍 *DESTINO EXTRA #${i + 1}*\n`;
        msg += linha('Nome', d.nome);
        msg += linha('Telefone', d.telefone);
        msg += linha('Rua', d.rua + (d.numero ? `, ${d.numero}` : ''));
        msg += linha('Complemento', d.complemento);
        msg += linha('Bairro', d.bairro);
        msg += linha('Cidade', d.cidade);
    });

    msg += `\n🔎 *RASTREAMENTO*\n`;
    msg += `Código: ${codigoRastreio}\n`;
    msg += `Link: ${linkRastreio}\n`;
    msg += `\n💰 *Total: R$ ${total.toFixed(2)}*\n`;

    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
}
