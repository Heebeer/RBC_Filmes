document.querySelector('#search').addEventListener('submit', async (event) => {
    event.preventDefault();

    const cepInput = document.querySelector('#cep');
    const button = document.querySelector('#search button'); // Seleciona o botão dentro do formulário
    let cep = cepInput.value.trim().replace(/\D/g, ''); //remove tudo que não for numeros
    
    if (!cep) {
        return showAlert('Digite um CEP...');
    }

    if (!/^\d{8}$/.test(cep)) {
        return showAlert('Digite um CEP válido (apenas números, 8 dígitos).');
    }

    // verifica se já esta salvo no storage
    const storage = localStorage.getItem(cep);
    if(storage){
        //se estiver, mostra os dados
        showInfo(JSON.parse(storage));
        return;
    }

    const apiurl = `https://viacep.com.br/ws/${cep}/json/`;

        // Salva a cor original do botão
        const originalColor = button.style.backgroundColor;
        const originalTextColor = button.style.color;
    
        // Desativa o botão
        button.disabled = true;
        button.style.pointerEvents = 'auto'; 
        button.classList.add('btn-loading');
        button.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Consultando...`;

    try {
        const resultado = await fetch(apiurl);
        const json = await resultado.json();

        if (json.erro) {
            showAlert('CEP não encontrado.');
        } else {
            //salva no storage
            localStorage.setItem(cep, JSON.stringify(json));
            showInfo(json);
        }
    } catch (error) {
        showAlert('Erro ao buscar informações.');
        console.error('Erro na requisição:', error);
    }

    setTimeout(() => {
        button.disabled = false;
        button.innerHTML = `<i class="fa-solid fa-magnifying-glass"></i>`;
    }, 500); // Pequeno delay para melhor UX
});

function showInfo(json) {
    showAlert('');

    //formata o cep com o hifen 
    const formatado = json.cep.replace(/^(\d{5})(\d{3})$/, '$1-$2');

    document.querySelector('#title').innerHTML = json.cep;
    document.querySelector('#logradouro').innerText = json.logradouro;
    document.querySelector('#bairro').innerText = json.bairro;
    document.querySelector('#localidade').innerText = json.localidade;
    document.querySelector('#uf').innerText = json.uf;
    document.querySelector('#ddd').innerText = json.ddd;
    document.querySelector('#cep').value = '';

}

function showAlert(msg) {
    document.querySelector('#alert').innerText = msg;
}
