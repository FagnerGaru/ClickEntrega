import { cidades } from './dados.js';

import {
    calcular,
    carregarCidades,
    carregarBairros
} from './calculo.js';

import { enviar } from './whatsapp.js';
const cidadeColeta =
document.getElementById('cidadeColeta');

const bairroColeta =
document.getElementById('bairroColeta');

const cidadeDestino =
document.getElementById('cidadeDestino');

const principal =
document.getElementById('principal');

carregarCidades(cidadeColeta);
carregarCidades(cidadeDestino);

carregarBairros(cidadeColeta.value, bairroColeta);
carregarBairros(cidadeDestino.value, principal);

cidadeColeta.addEventListener('change', () => {

    carregarBairros(
        cidadeColeta.value,
        bairroColeta
    );

    calcular();
});

cidadeDestino.addEventListener('change', () => {

    carregarBairros(
        cidadeDestino.value,
        principal
    );

    calcular();
});

window.onload = () => {

    calcular();

    const campoData =
    document.getElementById('dataEntrega');

    if(campoData){

        const hoje = new Date();

        campoData.min =
        hoje.toISOString().split('T')[0];

        const maxDate =
        new Date();

        maxDate.setMonth(
            maxDate.getMonth() + 1
        );

        campoData.max =
        maxDate.toISOString().split('T')[0];

    }

};

document.addEventListener('DOMContentLoaded', () => {

    const nome =
    localStorage.getItem('nomeCliente');

    const telefone =
    localStorage.getItem('telefoneCliente');

    if(nome){
       document.getElementById('nomeColeta').value = nome;
    }

    if(telefone){
       document.getElementById('telefoneColeta').value = telefone;
    }

});

function mostrarFormulario(){

    document.getElementById('dadosColeta').style.display = 'block';

    document.getElementById('dadosDestino').style.display = 'block';

    document.getElementById('dadosEntrega').style.display = 'block';

    document.getElementById('continuarBtn').style.display = 'none';

    document.querySelectorAll('.dadosExtra').forEach(div => {
        div.style.display = 'block';
    });

}


function addExtra(){

 const div = document.createElement('div');

 div.className = 'extra-box';

 div.innerHTML = `
<hr>

<h4>📍 Destino Extra</h4>

<button
type="button"
onclick="this.parentElement.remove(); calcular();">

🗑 Remover

</button>

<label>Cidade</label>
<select class="extraCidade"></select>

<label>Bairro</label>
<select class="extra"></select>

<div class="dadosExtra" style="display:none;">

<input
class="extraNome"
placeholder="Nome (opcional)">

<input
class="extraTelefone"
placeholder="Telefone (opcional)">

<input
class="extraRua"
placeholder="Rua">

<input
class="extraNumero"
placeholder="Número">

<input
class="extraComplemento"
placeholder="Complemento">

</div>
`;

 document.getElementById('extras')
 .appendChild(div);

 const cidadeExtra =
 div.querySelector('.extraCidade');

 const bairroExtra =
 div.querySelector('.extra');

 carregarCidades(cidadeExtra);

 carregarBairros(
    cidadeExtra.value,
    bairroExtra
 );

 cidadeExtra.addEventListener(
 'change',
 () => {

    carregarBairros(
       cidadeExtra.value,
       bairroExtra
    );

    calcular();
 });

 calcular();
}

window.calcular = calcular;
window.enviar = enviar;
window.addExtra = addExtra;
window.mostrarFormulario = mostrarFormulario;