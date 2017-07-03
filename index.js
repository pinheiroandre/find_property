import { create } from 'rung-sdk';
import { String as Text, Double, array, OneOf } from 'rung-cli/dist/types';
import agent from 'superagent';
import promisifyAgent from 'superagent-promise';
import Bluebird from 'bluebird';

const request = promisifyAgent(agent, Bluebird)
const { map, join, repeat, isNil, length } = require('ramda');

function render(price,descricao,image){

	return `<style> #imagem { position:absolute;width:165px;height:125px;top:0px;left:0px;z-index:-1;filter:brightness(40%);} #texto {position:center;margin-top: 35px}</style>
	       <img id="imagem" src="${image}"/> <div id="texto">${descricao} <br> ${price}</div>`
}

function main(context, done) {
    const {espc, price, localidad, estado, tp_mvl, tipo } = context.params;

	var cidade = localidad;
	var bairro = '';
	var nPos   = localidad.indexOf(",");
	var tpType = '';
	var tpUse  = '';
	var cUseTy = fRetTPDesc(tp_mvl);

	if (nPos >= 0){
		cidade = localidad.substring(0, nPos);
		bairro = localidad.substring(nPos+2,length(localidad));
	}

	nPos = cUseTy.indexOf(",");
	if (nPos >= 0){
		tpType = cUseTy.substring(0, nPos);
		tpUse  = cUseTy.substring(nPos+1,length(cUseTy));
	}

	var cGet = 'https://api.vivareal.com/api/1.0/locations/listings?'+
	           'apiKey=183d98b9-fc81-4ef1-b841-7432c610b36e&'+
			   'portal=VR_BR&'+
			   'business=' + fRetTpo(tipo)+'&'+
			   'page=1&'+
			   'exactLocation=false&'+
			   'rankingId=DEFAULT&'+
			   'maxResults=200&'+
			   'locationIds=BR%3E'+ fRetSTDesc(estado) +
			   '%3ENULL%3E'+ removerAcentos(cidade.replace(' ', '+')) +
			   '%3EBarrios%3E'+ removerAcentos(bairro.replace(' ', '+'))+ '&'+
			   'finalBasePrice='+price+'&'+
			   'listingType=' + tpType + '&';

	if (espc != ''){
		cGet += 'q=' + removerAcentos(espc) + '&';
	}

	cGet += 'listingUse=' + tpUse + '&'+
		    'usingFacetsCount=true&'+
		    'mixedDevelopmentsFirst=false&'+
		    'expandWhenLess=40&'+
			'expandFeatures=true';

    request.get(cGet)
	.then(resultado => {
		var residencias = resultado.body.listings;
		var i = 0;
		var j = 0;
        var alertas = [];
		var cComment = ``;

        for(i = 0; i < residencias.length; i++) {
			cComment = `[Acesse aqui e tenha mais informações](${residencias[i].siteUrl})`
			for(j = 0; j < residencias[i].thumbnails.length;j++){
				cComment += `![Acessar](${residencias[i].thumbnails[j]})\n`
			}

            alertas.push({
                title: 'Olá, encontramos o imóvel que você procura.',
                content: render(residencias[i].price, residencias[i].propertyTypeName + " - " + residencias[i].neighborhoodName, residencias[i].image),
				comment: cComment
            });
        }

        done({alerts: alertas});
    });
}

const mapa={'â':'a','Â':'A','à':'a','À':'A','á':'a','Á':'A','ã':'a','Ã':'A','ê':'e','Ê':'E','è':'e','È':'E','é':'e','É':'E','î':'i','Î':'I','ì':'i','Ì':'I','í':'i','Í':'I','õ':'o','Õ':'O','ô':'o','Ô':'O','ò':'o','Ò':'O','ó':'o','Ó':'O','ü':'u','Ü':'U','û':'u','Û':'U','ú':'u','Ú':'U','ù':'u','Ù':'U','ç':'c','Ç':'C'};
const mapa_imovel= {}

function removerAcentos(s){ return s.replace(/[\W\[\] ]/g,function(a){return mapa[a]||a})};

const stats     = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO','MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI','RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
const tp_ngo    = ['Comprar','Alugar']
const tp_imovel = ['Casa','Apartamento','Chácara','Casa de Condomínio','Flat','Lote/Terreno','Sobrado','Cobertura','Kitnet','Consultorio','Edifício residencial','Sala comercial','Fazenda/Sítio','Galpão/Depósito/Armazém','Imóvel comercial','Loja','Ponto Comercial']

function fRetTpo(tip_ng){

	var cDesc = 'VENTA';
	if (tip_ng == 'Alugar'){
		cDesc = 'RENTA';
	}

	return cDesc;

}

function fRetTPDesc(tipo_imov){

	var cDesc = '';

	switch (tipo_imov) {
			case 'Casa':
				cDesc = 'HOME,RESIDENCIAL';
				break;
			case 'Apartamento':
				cDesc = 'APART,RESIDENCIAL';
				break;
			case 'Chácara':
				cDesc = 'FINCA,RESIDENCIAL';
				break;
			case 'Casa de Condomínio':
				cDesc = 'CONDO,RESIDENCIAL';
				break;
			case 'Flat':
				cDesc = 'FLAT,RESIDENCIAL';
				break;
			case 'Lote/Terreno':
				cDesc = 'LOTE,RESIDENCIAL';
				break;
			case 'Sobrado':
				cDesc = 'SOBRADO,RESIDENCIAL';
				break;
			case 'Cobertura':
				cDesc = 'COBERTURA,RESIDENCIAL';
				break;
			case 'Kitnet':
				cDesc = 'KITNET,RESIDENCIAL';
				break;
			case 'Consultorio':
				cDesc = 'CONSULTORIO,COMERCIAL';
				break;
			case 'Edifício residencial':
				cDesc = 'EDIRES,COMERCIAL';
				break;
			case 'Sala comercial':
				cDesc = 'OFFICE,COMERCIAL';
				break;
			case 'Fazenda/Sítio':
				cDesc = 'AGRI,COMERCIAL';
				break;
			case 'Galpão/Depósito/Armazém':
				cDesc = 'BODEGA,COMERCIAL';
				break;
			case 'Imóvel comercial':
				cDesc = 'EDICOM,COMERCIAL';
				break;
			case 'Loja':
				cDesc = 'LOCAL,COMERCIAL';
				break;
			case 'Ponto Comercial':
				cDesc = 'BUSINESS,COMERCIAL';
				break;
		}
	return cDesc;
}

function fRetSTDesc(sigla){

	var cDesc = '';

	switch (sigla) {
			case 'AC':
				cDesc = 'Acre';
				break;
			case 'AL':
				cDesc = 'Alagoas';
				break;
			case 'AP':
				cDesc = 'Amapa';
				break;
			case 'AM':
				cDesc = 'Amazonas';
				break;
			case 'BA':
				cDesc = 'Bahia';
				break;
			case 'CE':
				cDesc = 'Ceara';
				break;
			case 'DF':
				cDesc = 'Distrito+Federal';
				break;
			case 'ES':
				cDesc = 'Espirito+Santo';
				break;
			case 'GO':
				cDesc = 'Goias';
				break;
			case 'MA':
				cDesc = 'Maranhao';
				break;
			case 'MT':
				cDesc = 'Mato+Grosso';
				break;
			case 'MS':
				cDesc = 'Mato+Grosso+do+Sul';
				break;
			case 'MG':
				cDesc = 'Minas+Gerais';
				break;
			case 'PA':
				cDesc = 'Para';
				break;
			case 'PB':
				cDesc = 'Paraiba';
				break;
			case 'PR':
				cDesc = 'Parana';
				break;
			case 'PE':
				cDesc = 'Pernambuco';
				break;
			case 'PI':
				cDesc = 'Piaui';
				break;
			case 'RJ':
				cDesc = 'Rio+de+Janeiro';
				break;
			case 'RN':
				cDesc = 'Rio+Grande+do+Norte';
				break;
			case 'RS':
				cDesc = 'Rio+Grande+do+Sul';
				break;
			case 'RO':
				cDesc = 'Rondonia';
				break;
			case 'RR':
				cDesc = 'Roraima';
				break;
			case 'SC':
				cDesc = 'Santa+Catarina';
				break;
			case 'SP':
				cDesc = 'Sao+Paulo';
				break;
			case 'SE':
				cDesc = 'Sergipe';
				break;
			case 'TO':
				cDesc = 'Tocantins';
				break;
		}
	return cDesc;
}

const params = {
    espc: {
        description: 'Especificação',
        type: Text,
        default: ''
    },
    price: {
        description: 'Valor máximo:',
        type: Double,
        required: true
    },
    localidad: {
        description: 'Cidade, bairro',
        type: Text,
        required: true
    },
    estado: {
        description: 'Estado',
        type: OneOf(stats),
        default: 'AC'
    },
    tp_mvl: {
        description: 'Tipo de imóvel',
        type: OneOf(tp_imovel),
        default: 'Casa'
    },
    tipo: {
        description: 'Tipo de negócio',
        type: OneOf(tp_ngo),
        default: 'Comprar'
    },
};

export default create(main, {
    params,
    primaryKey: true,
    title: 'Encontre uma propriedade',
    description: 'Receba alertas de novos imóveis.',
    preview: render('R$ 200.000','Apartamento - Centro', 'https://s-media-cache-ak0.pinimg.com/736x/39/30/f0/3930f0351e7c810eff3ab1fd94080502--home-ideas-final.jpg')
});

