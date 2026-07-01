import { supabase } from './supabase.js';

export async function salvarPedido(dados){

    const { data, error } =
    await supabase
        .from('pedidos')
        .insert([dados])
        .select();

    if(error){
        console.error(error);
        throw error;
    }

    return data[0];
}

export async function listarPedidos(){

    const { data, error } =
    await supabase
    .from('pedidos')
    .select('*')
    .order(
        'numero_pedido',
        {
            ascending:false
        }
    );

    if(error)
        throw error;

    return data;
}

export async function listarPedidosPorPeriodo(
inicio,
fim
){

    const { data,error } =
    await supabase
    .from('pedidos')
    .select('*')
    .gte('criado_em',inicio)
    .lte('criado_em',fim);

    if(error)
        throw error;

    return data;
}