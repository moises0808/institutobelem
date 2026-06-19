// --- Configuração do Supabase ---
// Substitua pelos seus dados reais do painel do Supabase (Project Settings > API)
const SUPABASE_URL = 'https://yfwbikxtcjmatrgonnqy.supabase.co';
const SUPABASE_ANON_KEY = 'SUA_ANON_KEY_AQUI'; // Use a chave "anon", não a "service_role"

// Credenciais administrativas fixas
const ADMIN_EMAIL = 'adm@institutobelem.org.br';
const ADMIN_PASSWORD = 'Adm@357';

let supabase = null;
try {
    // Só tenta inicializar se as chaves não forem os placeholders padrão
    if (SUPABASE_URL.indexOf('SUA_URL_AQUI') === -1 && typeof window.supabase !== 'undefined') {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
} catch (e) {
    console.error("Erro ao inicializar Supabase: Verifique as chaves de API.", e);
}

document.addEventListener('DOMContentLoaded', () => {
    initForms();
    initCEP();
    initAuth();
    initAcoes();
});

/**
 * Inicializa a submissão dos formulários de cadastro
 */
function initForms() {
    const configurarFormulario = (formId, statusId) => {
        const form = document.getElementById(formId);
        const status = document.getElementById(statusId);

        if (form && status && supabase) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                status.innerHTML = "<p style='color: blue;'>Enviando para o banco de dados... Aguarde.</p>";
                const formData = new FormData(form);
                const dados = {};
                formData.forEach((value, key) => {
                    // Ignora arquivos por enquanto (vol_foto, doc_cnh, etc)
                    if (value instanceof File && value.name === "") return;
                    if (value instanceof File) return;

                    if (dados[key] !== undefined) {
                        if (!Array.isArray(dados[key])) dados[key] = [dados[key]];
                        dados[key].push(value);
                    } else {
                        dados[key] = (value === 'on') ? true : (value === '' ? null : value);
                    }
                });

                const tabela = formId === 'formBeneficiario' ? 'beneficiarios' : 'voluntarios';
                const { error } = await supabase.from(tabela).insert([dados]);

                if (!error) {
                    status.innerHTML = "<p style='color: green;'><strong>Sucesso!</strong> Cadastro realizado com sucesso no Instituto Belém.</p>";
                    form.reset();
                } else {
                    status.innerHTML = `<p style='color: red;'>Erro ao salvar: ${error.message}</p>`;
                }
            });
        }
    };
    configurarFormulario('formBeneficiario', 'membroStatus');
    configurarFormulario('formVoluntario', 'voluntarioStatus');
}

/**
 * Configura a busca automática de CEP
 */
function initCEP() {
    const configurarCEP = (cepId, campos) => {
        const input = document.getElementById(cepId);
        if (input) {
            input.addEventListener('blur', () => {
                const cep = input.value.replace(/\D/g, '');
                if (cep.length === 8) {
                    fetch(`https://viacep.com.br/ws/${cep}/json/`)
                        .then(res => res.json())
                        .then(data => {
                            if (data.erro) {
                                alert("CEP não encontrado.");
                                input.value = '';
                                return;
                            }
                            if (campos.rua) document.getElementById(campos.rua).value = data.logradouro;
                            if (campos.bairro) document.getElementById(campos.bairro).value = data.bairro;
                            if (campos.cidade) document.getElementById(campos.cidade).value = data.localidade;
                            if (campos.estado) document.getElementById(campos.estado).value = data.uf;
                        }).catch(err => console.error("Erro na busca do CEP", err));
                }
            });
        }
    };

    // IDs conforme definidos em seja-membro.html
    configurarCEP('vol_cep', { rua: 'vol_rua', bairro: 'vol_bairro', cidade: 'vol_cidade', estado: 'vol_estado' });
}

/**
 * Inicializa a lógica de autenticação da Área Restrita
 */
function initAuth() {
    const form = document.getElementById('loginForm');
    const status = document.getElementById('loginStatus');

    if (form && status) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('email').value.trim();
            const senhaInput = document.getElementById('senha').value.trim();

            if (emailInput === ADMIN_EMAIL && senhaInput === ADMIN_PASSWORD) {
                status.innerHTML = "<p style='color: green; font-weight: bold;'>Sucesso! Acesso concedido. Redirecionando...</p>";
                // Simula o redirecionamento após 1.5 segundos
                setTimeout(() => {
                    alert("Login realizado! Aqui você redirecionaria para a página de gestão.");
                }, 1500);
            } else {
                status.innerHTML = "<p style='color: red;'>E-mail ou senha incorretos. Tente novamente.</p>";
            }
        });
    }
}

/**
 * Stub para evitar erros caso a função de ações ainda não tenha sido definida
 */
function initAcoes() {}