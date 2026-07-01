import { cidades, regioes } from './dados.js';

export function carregarCidades(select){

    select.innerHTML = '';

    Object.keys(cidades).forEach(cidade => {

        const option = document.createElement('option');

        option.value = cidade;
        option.textContent = cidade;

        select.appendChild(option);

    });

}

export function carregarBairros(cidade, select){

    select.innerHTML = '';

    Object.keys(cidades[cidade])
    .sort()
    .forEach(bairro => {

        const option = document.createElement('option');

        option.value = bairro;

        option.textContent =
        `${bairro} - R$ ${(cidades[cidade][bairro]/2).toFixed(2)}`;

        select.appendChild(option);

    });

}

export function getRegiao(bairro){

    for(const regiao in regioes){

        if(regioes[regiao].includes(bairro)){
            return regiao;
        }

    }

    return null;
}

export function getValorBairro(nomeBairro){

    for(const cidade in cidades){

        if(cidades[cidade][nomeBairro] !== undefined){
            return cidades[cidade][nomeBairro];
        }

    }

    return 0;
}

export function calcular(){

    let total = 0;

    const coleta =
    document.getElementById('bairroColeta')?.value;

    const destino =
    document.getElementById('principal')?.value;

    const regiaoColeta =
    getRegiao(coleta);

    const regiaoDestino =
    getRegiao(destino);

    if(
        regiaoColeta &&
        regiaoDestino &&
        regiaoColeta === regiaoDestino
    ){

        total = 10;

    }else{

        total += getValorBairro(coleta) / 2;

        total += getValorBairro(destino) / 2;

    }

    document.querySelectorAll('.extra').forEach(select => {

        total += getValorBairro(select.value) / 2;

    });

    const valor =
    document.getElementById('valorTotal');

    if(valor){

        valor.textContent =
        total.toLocaleString('pt-BR',{
            minimumFractionDigits:2,
            maximumFractionDigits:2
        });

    }

    return total;
}