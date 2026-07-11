// --- Configuração do Supabase ---
const SUPABASE_URL = 'https://yfwbikxtcjmatrgonnqy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlmd2Jpa3h0Y2ptYXRyZ29ubnF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2NTM2NTMsImV4cCI6MjA5NzIyOTY1M30.lDeYy7juOx1m6DcwjBGNyTPJFGBbxFgl_sZ-LxUet4Q';

// Credenciais administrativas fixas
const ADMIN_EMAIL = 'adm@institutobelem.org.br';
const ADMIN_PASSWORD = 'Adm@357';
const ADMIN_SESSION_KEY = 'institutoBelemAdminSession';

let supabase = null;
let supabaseReady = false;
let pageInitialized = false;

function initSupabaseClient() {
    try {
        if (typeof window.supabase?.createClient === 'function') {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false
                }
            });
            supabaseReady = true;
            console.info('Supabase conectado com sucesso.');
            return true;
        }
    } catch (e) {
        console.error('Erro ao inicializar Supabase: verifique a URL e a chave anônima.', e);
    }

    supabaseReady = false;
    return false;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidCPF(cpf) {
    cpf = String(cpf).replace(/\D/g, '');
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    const digits = cpf.split('').map(Number);
    for (let t = 9; t <= 10; t++) {
        let sum = 0;
        for (let i = 0; i < t; i++) {
            sum += digits[i] * ((t + 1) - i);
        }
        let check = (sum * 10) % 11;
        if (check === 10) check = 0;
        if (check !== digits[t]) return false;
    }
    return true;
}

function isValidPhoneNumber(phone) {
    const digits = String(phone).replace(/\D/g, '');
    return digits.length === 10 || digits.length === 11;
}

function hasAtLeastTwoWords(name) {
    const normalized = String(name || '').trim().replace(/\s+/g, ' ');
    if (!normalized) return false;
    return normalized.split(' ').length >= 2;
}

function formatCPF(value) {
    const digits = String(value || '').replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatPhone(value) {
    const digits = String(value || '').replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 10) {
        if (digits.length <= 2) return digits;
        if (digits.length <= 6) return digits.replace(/(\d{2})(\d{0,4})/, '($1) $2').trim();
        if (digits.length <= 10) return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
    }
    if (digits.length <= 11) {
        return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
    }
    return digits;
}

function setFieldError(input, message) {
    if (!input) return;
    input.setCustomValidity(message || '');
    input.style.borderColor = message ? '#d9534f' : '';
    input.style.boxShadow = message ? '0 0 0 2px rgba(217,83,79,0.15)' : '';
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
}

window.validarEmail = function(input) {
    const value = String(input.value || '').trim();
    const sanitized = value.replace(/\s+/g, '');
    if (sanitized !== value) input.value = sanitized;
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized);
    setFieldError(input, sanitized ? (!isValid ? 'Informe um e-mail válido.' : '') : 'E-mail é obrigatório.');
    if (sanitized && !isValid) input.reportValidity();
    return isValid;
}

window.aplicarMascaraCPF = function(input) {
    const digits = String(input.value || '').replace(/\D/g, '').slice(0, 11);
    input.value = formatCPF(digits);
    if (digits.length === 0) {
        setFieldError(input, 'CPF é obrigatório.');
    } else if (digits.length < 11) {
        setFieldError(input, 'CPF incompleto.');
    } else {
        setFieldError(input, isValidCPF(digits) ? '' : 'CPF inválido.');
    }
    return digits;
}

window.validarCPF = function(input) {
    const digits = String(input.value || '').replace(/\D/g, '');
    const isValid = digits.length === 11 ? isValidCPF(digits) : false;
    setFieldError(input, digits.length === 0 ? 'CPF é obrigatório.' : (digits.length < 11 ? 'CPF incompleto.' : (!isValid ? 'CPF inválido.' : '')));
    input.reportValidity();
    return isValid;
}

window.aplicarMascaraTelefone = function(input) {
    const digits = String(input.value || '').replace(/\D/g, '').slice(0, 11);
    input.value = formatPhone(digits);
    const isValid = digits.length === 10 || digits.length === 11;
    setFieldError(input, digits.length > 0 && !isValid ? 'Informe um telefone com 10 ou 11 dígitos.' : '');
    return digits;
}

window.validarTelefone = function(input) {
    const digits = String(input.value || '').replace(/\D/g, '');
    const isValid = digits.length === 10 || digits.length === 11;
    setFieldError(input, digits.length === 0 ? 'Telefone é obrigatório.' : (!isValid ? 'Informe um telefone com 10 ou 11 dígitos.' : ''));
    input.reportValidity();
    return isValid;
}

function validateVoluntarioForm(form) {
    try {
        const nomeInput = form.querySelector('[name="vol_nome"]');
        const emailInput = form.querySelector('[name="vol_email"]');
        const dataNascInput = form.querySelector('[name="vol_data_nasc"]');
        const cpfInput = form.querySelector('[name="vol_cpf"]');
        const rgInput = form.querySelector('[name="vol_rg"]');
        const telefoneInput = form.querySelector('[name="vol_tel_principal"]');
        const whatsappInput = form.querySelector('[name="vol_whatsapp"]');
        const telAltInput = form.querySelector('[name="vol_tel_alternativo"]');
        const ruaInput = form.querySelector('[name="vol_rua"]');
        const numeroInput = form.querySelector('[name="vol_numero"]');
        const bairroInput = form.querySelector('[name="vol_bairro"]');
        const cidadeInput = form.querySelector('[name="vol_cidade"]');
        const estadoInput = form.querySelector('[name="vol_estado"]');
        const horariosInput = form.querySelector('[name="horarios_disponiveis"]');
        const termoInput = form.querySelector('[name="termo_vol"]');
        const codigoInput = form.querySelector('[name="codigo_conduta"]');
        const confidencialidadeInput = form.querySelector('[name="confidencialidade"]');
        const nome = nomeInput?.value.trim() || '';
        const email = emailInput?.value.trim() || '';
        const dataNasc = dataNascInput?.value || '';
        const cpf = cpfInput?.value.trim() || '';
        const rg = rgInput?.value.trim() || '';
        const telefone = telefoneInput?.value.trim() || '';
        const cep = form.querySelector('[name="vol_cep"]')?.value.replace(/\D/g, '') || '';
        const diasSelecionados = form.querySelectorAll('[name="dias_disponiveis"]:checked');
        const horarios = form.querySelector('[name="horarios_disponiveis"]')?.value.trim() || '';
        const whatsapp = whatsappInput?.value.trim() || '';
        const telAlt = telAltInput?.value.trim() || '';

        console.log('Validando:', { nome, email, dataNasc, cpf, telefone, dias: diasSelecionados.length, horarios });

        const failField = (input, message) => {
            if (input) {
                input.reportValidity();
                input.focus();
            }
            return message;
        };

        if (!nome) {
            if (nomeInput) setFieldError(nomeInput, 'Nome completo é obrigatório.');
            return failField(nomeInput, 'Preencha o campo Nome completo.');
        }
        if (!hasAtLeastTwoWords(nome)) {
            if (nomeInput) setFieldError(nomeInput, 'Informe nome e sobrenome.');
            return failField(nomeInput, 'O campo Nome completo deve conter pelo menos duas palavras.');
        }
        if (nomeInput) setFieldError(nomeInput, '');
        if (!dataNasc) {
            if (dataNascInput) setFieldError(dataNascInput, 'Data de nascimento é obrigatória.');
            return failField(dataNascInput, 'Preencha o campo Data de nascimento.');
        }
        if (dataNascInput) setFieldError(dataNascInput, '');

        if (!email) {
            if (emailInput) {
                setFieldError(emailInput, 'E-mail é obrigatório.');
            }
            return failField(emailInput, 'Preencha o campo E-mail.');
        }
        if (!window.validarEmail(emailInput)) {
            return failField(emailInput, 'Preencha o campo E-mail com um formato válido.');
        }
        if (!rg) {
            if (rgInput) {
                setFieldError(rgInput, 'RG é obrigatório.');
            }
            return failField(rgInput, 'Preencha o campo RG.');
        }
        if (rgInput) setFieldError(rgInput, '');
        if (!cpf) {
            if (cpfInput) {
                setFieldError(cpfInput, 'CPF é obrigatório.');
            }
            return failField(cpfInput, 'Preencha o campo CPF.');
        }
        if (!window.validarCPF(cpfInput)) {
            return failField(cpfInput, 'Preencha o campo CPF com um formato válido.');
        }
        if (!telefone) {
            if (telefoneInput) {
                setFieldError(telefoneInput, 'Telefone principal é obrigatório.');
            }
            return failField(telefoneInput, 'Preencha o campo Telefone principal.');
        }
        if (!window.validarTelefone(telefoneInput)) {
            return failField(telefoneInput, 'Preencha o campo Telefone principal com um formato válido (10 ou 11 dígitos).');
        }
        if (telAlt) {
            if (!window.validarTelefone(telAltInput)) {
                return failField(telAltInput, 'Telefone alternativo inválido. Use 10 ou 11 dígitos ou deixe em branco.');
            }
        } else if (telAltInput) {
            setFieldError(telAltInput, '');
        }
        if (whatsapp) {
            if (!window.validarTelefone(whatsappInput)) {
                return failField(whatsappInput, 'WhatsApp inválido. Use 10 ou 11 dígitos ou deixe em branco.');
            }
        } else if (whatsappInput) {
            setFieldError(whatsappInput, '');
        }
        if (!cep || cep.length !== 8) {
            const cepInput = form.querySelector('[name="vol_cep"]');
            if (cepInput) setFieldError(cepInput, 'CEP inválido. Use 8 dígitos.');
            return failField(cepInput, 'Preencha o campo CEP com 8 dígitos.');
        }
        if (ruaInput && !ruaInput.value.trim()) {
            setFieldError(ruaInput, 'Rua é obrigatória.');
            return failField(ruaInput, 'Preencha o campo Rua.');
        }
        if (ruaInput) setFieldError(ruaInput, '');
        if (numeroInput && !numeroInput.value.trim()) {
            setFieldError(numeroInput, 'Número é obrigatório.');
            return failField(numeroInput, 'Preencha o campo Número.');
        }
        if (numeroInput) setFieldError(numeroInput, '');
        if (bairroInput && !bairroInput.value.trim()) {
            setFieldError(bairroInput, 'Bairro é obrigatório.');
            return failField(bairroInput, 'Preencha o campo Bairro.');
        }
        if (bairroInput) setFieldError(bairroInput, '');
        if (cidadeInput && !cidadeInput.value.trim()) {
            setFieldError(cidadeInput, 'Cidade é obrigatória.');
            return failField(cidadeInput, 'Preencha o campo Cidade.');
        }
        if (cidadeInput) setFieldError(cidadeInput, '');
        if (estadoInput && !estadoInput.value.trim()) {
            setFieldError(estadoInput, 'Estado é obrigatório.');
            return failField(estadoInput, 'Preencha o campo Estado.');
        }
        if (estadoInput) setFieldError(estadoInput, '');
        if (diasSelecionados.length === 0) {
            const primeiroDia = form.querySelector('[name="dias_disponiveis"]');
            return failField(primeiroDia, 'Selecione pelo menos um dia da semana disponível.');
        }
        if (!horarios) {
            if (horariosInput) setFieldError(horariosInput, 'Horário disponível é obrigatório.');
            return failField(horariosInput, 'Preencha o campo Horários disponíveis.');
        }
        if (horariosInput) setFieldError(horariosInput, '');
        if (termoInput && !termoInput.checked) {
            setFieldError(termoInput, 'Aceite o termo de voluntariado.');
            return failField(termoInput, 'Aceite o campo Termo de voluntariado.');
        }
        if (termoInput) setFieldError(termoInput, '');
        if (codigoInput && !codigoInput.checked) {
            setFieldError(codigoInput, 'Aceite o código de conduta.');
            return failField(codigoInput, 'Aceite o campo Código de conduta.');
        }
        if (codigoInput) setFieldError(codigoInput, '');
        if (confidencialidadeInput && !confidencialidadeInput.checked) {
            setFieldError(confidencialidadeInput, 'Aceite o termo de confidencialidade.');
            return failField(confidencialidadeInput, 'Aceite o campo Termo de confidencialidade.');
        }
        if (confidencialidadeInput) setFieldError(confidencialidadeInput, '');

        return null;
    } catch (error) {
        console.error('Erro ao validar formulário:', error);
        return 'Erro ao validar o formulário. Tente novamente.';
    }
}

function validateBeneficiarioForm(form) {
    try {
        const nomeInput = form.querySelector('[name="ben_nome"]');
        const emailInput = form.querySelector('[name="ben_email"]');
        const dataNascInput = form.querySelector('[name="ben_data_nasc"]');
        const cpfInput = form.querySelector('[name="ben_cpf"]');
        const telefoneInput = form.querySelector('[name="ben_telefone"]');
        const cepInput = form.querySelector('[name="ben_cep"]');
        const ruaInput = form.querySelector('[name="ben_rua"]');
        const numeroInput = form.querySelector('[name="ben_numero"]');
        const bairroInput = form.querySelector('[name="ben_bairro"]');
        const cidadeInput = form.querySelector('[name="ben_cidade"]');
        const estadoInput = form.querySelector('[name="ben_estado"]');
        const necessidadeInput = form.querySelector('[name="necessidade"]');
        const rendaInput = form.querySelector('[name="ben_renda"]');
        const familiaresInput = form.querySelector('[name="ben_familiares"]');
        const termoInput = form.querySelector('[name="termo"]');

        const nome = nomeInput?.value.trim() || '';
        const email = emailInput?.value.trim() || '';
        const dataNasc = dataNascInput?.value || '';
        const cpf = cpfInput?.value.trim() || '';
        const telefone = telefoneInput?.value.trim() || '';
        const cep = cepInput?.value.replace(/\D/g, '') || '';

        if (!nome) return 'Nome é obrigatório.';
        if (!hasAtLeastTwoWords(nome)) return 'O campo Nome completo deve conter pelo menos duas palavras.';
        if (!email || !window.validarEmail(emailInput)) return 'E-mail inválido.';
        if (!dataNasc) return 'Data de nascimento é obrigatória.';
        if (!cpf || !window.validarCPF(cpfInput)) return 'CPF inválido.';
        if (!telefone || !window.validarTelefone(telefoneInput)) return 'Telefone inválido.';
        if (!cep || cep.length !== 8) return 'CEP inválido. Use 8 dígitos.';
        if (!ruaInput?.value.trim()) return 'Preencha a rua.';
        if (!numeroInput?.value.trim()) return 'Preencha o número.';
        if (!bairroInput?.value.trim()) return 'Preencha o bairro.';
        if (!cidadeInput?.value.trim()) return 'Preencha a cidade.';
        if (!estadoInput?.value.trim()) return 'Preencha o estado.';
        if (!necessidadeInput?.value.trim()) return 'Descreva a necessidade.';
        if (!rendaInput?.value.trim()) return 'Informe a renda familiar aproximada.';
        if (!familiaresInput?.value.trim()) return 'Informe a composição familiar.';
        if (!termoInput?.checked) return 'Aceite o termo de atendimento.';

        return null;
    } catch (error) {
        console.error('Erro ao validar beneficiário:', error);
        return 'Erro ao validar o formulário. Tente novamente.';
    }
}

function cleanupLegacyInlineHandlers() {
    const fields = document.querySelectorAll('input[name="vol_cpf"], input[name="vol_email"], input[name="vol_tel_principal"], input[name="vol_tel_alternativo"], input[name="vol_whatsapp"], input[name="ben_cpf"], input[name="ben_email"], input[name="ben_telefone"]');
    fields.forEach((field) => {
        field.removeAttribute('oninput');
        field.removeAttribute('onblur');
    });
}

function initializePage() {
    if (pageInitialized) return;
    pageInitialized = true;

    cleanupLegacyInlineHandlers();

    const hasSupabaseForm = document.getElementById('formVoluntario') || document.getElementById('formBeneficiario');

    if (hasSupabaseForm) {
        if (!initSupabaseClient()) {
            const retryInterval = setInterval(() => {
                if (initSupabaseClient()) {
                    clearInterval(retryInterval);
                }
            }, 250);

            setTimeout(() => clearInterval(retryInterval), 5000);
        }
    }

    try {
        initForms();
        initCEP();
        initFieldMasks();
        initAuth();
        initPainelRestrito();
        initListaMembros();
        initListaBeneficiarios();
        initAcoes();
    } catch (error) {
        console.error('Erro ao inicializar a página:', error);
    }
}

function startPageInitialization() {
    try {
        initializePage();
    } catch (error) {
        console.error('Erro ao iniciar a página:', error);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startPageInitialization, { once: true });
} else {
    startPageInitialization();
}

window.initializePage = initializePage;

window.formatarCEP = function(valor) {
    const digits = String(valor || '').replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

window.preencherEnderecoPorCEP = function(data) {
    const setValue = (id, value) => {
        const el = document.getElementById(id) || document.querySelector(`[name="${id}"]`);
        if (el) el.value = value || '';
    };

    setValue('vol_rua', data.logradouro || '');
    setValue('vol_bairro', data.bairro || '');
    setValue('vol_cidade', data.localidade || '');
    setValue('vol_estado', data.uf || '');
    setValue('ben_rua', data.logradouro || '');
    setValue('ben_bairro', data.bairro || '');
    setValue('ben_cidade', data.localidade || '');
    setValue('ben_estado', data.uf || '');
}

window.buscarEnderecoPorCEP = function(input) {
    const cep = String(input.value || '').replace(/\D/g, '');
    if (cep.length !== 8) return;

    fetch(`https://viacep.com.br/ws/${cep}/json/`, { cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
            if (data.erro) {
                alert('CEP não encontrado.');
                input.value = '';
                return;
            }
            window.preencherEnderecoPorCEP(data);
        })
        .catch(err => console.error('Erro na busca do CEP', err));
}

window.formatarEBuscarCEP = function(input) {
    input.value = window.formatarCEP(input.value);
    if (input.value.replace(/\D/g, '').length === 8) {
        window.buscarEnderecoPorCEP(input);
    }
}

/**
 * Inicializa a submissão dos formulários de cadastro
 */
async function buildSubmitPayload(form) {
    const formData = new FormData(form);
    const dados = {};
    const isBeneficiarioForm = form.id === 'formBeneficiario';
    const benFoto = formData.get('ben_foto');
    const allowedFields = [
        'vol_nome', 'vol_email', 'vol_data_nasc', 'vol_cpf', 'vol_rg',
        'vol_tel_principal', 'vol_tel_alternativo', 'vol_whatsapp',
        'vol_cep', 'vol_rua', 'vol_numero', 'vol_bairro', 'vol_cidade', 'vol_estado',
        'tipo_membro', 'area_outro', 'horarios_disponiveis', 'frequencia_vol',
        'formacao', 'cursos', 'experiencia', 'habilidades', 'data_entrada', 'projetos', 'part_anteriores', 'avaliacao',
        'termo_vol', 'codigo_conduta', 'confidencialidade', 'uso_imagem',
        'ben_nome', 'ben_email', 'ben_data_nasc', 'ben_cpf', 'ben_telefone', 'ben_cep', 'ben_rua', 'ben_numero', 'ben_bairro', 'ben_cidade', 'ben_estado',
        'necessidade', 'ben_renda', 'ben_familiares', 'observacoes', 'termo', 'ben_foto_nome', 'ben_foto_url'
    ];

    formData.forEach((value, key) => {
        if (value instanceof File && value.name === "") return;
        if (value instanceof File) return;
        if (!allowedFields.includes(key)) return;

        if (value === 'on') {
            dados[key] = true;
        } else if (value === '') {
            dados[key] = null;
        } else {
            dados[key] = String(value);
        }
    });

    if (isBeneficiarioForm) {
        if (benFoto instanceof File && benFoto.name) {
            dados.ben_foto_nome = benFoto.name;
            dados.ben_foto_url = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result || ''));
                reader.onerror = () => reject(new Error('Não foi possível ler a imagem selecionada.'));
                reader.readAsDataURL(benFoto);
            });
        }
        dados.nome = dados.ben_nome || null;
        dados.email = dados.ben_email || null;
        dados.telefone = dados.ben_telefone || null;
    } else {
        const areas = formData.getAll('area').filter(Boolean).map(String);
        const dias = formData.getAll('dias_disponiveis').filter(Boolean).map(String);
        dados.area = areas.length ? areas.join(', ') : null;
        dados.dias_disponiveis = dias.length ? dias.join(', ') : null;

        // Compatibilidade com colunas antigas
        dados.nome = dados.vol_nome || null;
        dados.email = dados.vol_email || null;
        dados.telefone = dados.vol_tel_principal || null;
        dados.disponibilidade = dados.horarios_disponiveis || null;
    }

    return dados;
}

function buildMinimalPayload(dados) {
    const columns = Object.keys(dados);

    return Object.fromEntries(columns.filter((column) => Object.prototype.hasOwnProperty.call(dados, column)).map((column) => [column, dados[column]]));
}

function pruneMissingColumnFromPayload(payload, errorText) {
    if (!payload || !errorText) return null;

    const columnMatch = String(errorText).match(/Could not find the '([^']+)' column/i)
        || String(errorText).match(/column\s+"([^"]+)"/i)
        || String(errorText).match(/column\s+([a-zA-Z0-9_]+)\s+does not exist/i);

    const missingColumn = columnMatch?.[1];
    if (!missingColumn || !Object.prototype.hasOwnProperty.call(payload, missingColumn)) {
        return null;
    }

    const nextPayload = { ...payload };
    delete nextPayload[missingColumn];
    return nextPayload;
}

async function insertFormData(supabaseClient, tabela, dados, statusElement) {
    const payloads = [dados, buildMinimalPayload(dados)];

    for (const originalPayload of payloads) {
        let payload = { ...originalPayload };

        while (Object.keys(payload).length) {
            const { error } = await supabaseClient.from(tabela).insert([payload]);
            if (!error) return { success: true, payload };

            const detail = error?.message || '';
            const isSchemaError = /column/i.test(detail) || /schema/i.test(detail);
            const prunedPayload = isSchemaError ? pruneMissingColumnFromPayload(payload, detail) : null;

            if (prunedPayload) {
                payload = prunedPayload;
                continue;
            }

            if (!isSchemaError || originalPayload === payloads[payloads.length - 1]) {
                return { success: false, error };
            }

            break;
        }
    }

    return { success: false, error: new Error('Não foi possível salvar os dados.') };
}

async function insertFormDataViaRest(tabela, dados) {
    const payloads = [dados, buildMinimalPayload(dados)];

    for (const originalPayload of payloads) {
        let payload = { ...originalPayload };

        while (Object.keys(payload).length) {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/${tabela}`, {
                method: 'POST',
                headers: {
                    apikey: SUPABASE_ANON_KEY,
                    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    Prefer: 'return=minimal'
                },
                body: JSON.stringify([payload])
            });

            if (response.ok) {
                return { success: true, payload };
            }

            const detail = await response.text();
            const isSchemaError = /column/i.test(detail) || /schema/i.test(detail);
            const prunedPayload = isSchemaError ? pruneMissingColumnFromPayload(payload, detail) : null;

            if (prunedPayload) {
                payload = prunedPayload;
                continue;
            }

            if (!isSchemaError || originalPayload === payloads[payloads.length - 1]) {
                return { success: false, error: new Error(detail || `HTTP ${response.status}`) };
            }

            break;
        }
    }

    return { success: false, error: new Error('Não foi possível salvar os dados.') };
}

function initForms() {
    const redirectAfterBeneficiarioSuccess = () => {
        window.setTimeout(() => {
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = 'painel-restrito.html';
            }
        }, 900);
    };

    // Prévia de foto no formulário de beneficiário
    const benFotoInput = document.getElementById('ben_foto_input');
    const benFotoPreview = document.getElementById('ben_foto_preview');
    if (benFotoInput && benFotoPreview) {
        benFotoInput.addEventListener('change', function () {
            const file = benFotoInput.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    benFotoPreview.src = e.target.result;
                    benFotoPreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else {
                benFotoPreview.src = '';
                benFotoPreview.style.display = 'none';
            }
        });
    }

    const configurarFormulario = (formId, statusId) => {
        const form = document.getElementById(formId);
        const status = document.getElementById(statusId);

        console.log(`Configurando formulário: ${formId}`, { formFound: !!form, statusFound: !!status });

        if (form && status) {
            const submitHandler = async (e) => {
                if (e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                }
                console.log('Formulário enviado:', formId);
                const validationError = formId === 'formVoluntario' ? validateVoluntarioForm(form) : (formId === 'formBeneficiario' ? validateBeneficiarioForm(form) : null);
                if (validationError) {
                    console.log('Erro de validação:', validationError);
                    status.innerHTML = `<p style='color: red;'>${validationError}</p>`;
                    return;
                }
                if (!supabaseReady || !supabase) {
                    status.innerHTML = "<p style='color: blue;'>Enviando para o banco de dados... Aguarde.</p>";
                    const tabela = formId === 'formBeneficiario' ? 'beneficiarios' : 'voluntarios';
                    const restResult = await insertFormDataViaRest(tabela, await buildSubmitPayload(form));
                    if (restResult.success) {
                        status.innerHTML = "<p style='color: green;'><strong>Sucesso!</strong> Cadastro realizado com sucesso no Instituto Belém.</p>";
                        status.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        form.reset();
                        if (formId === 'formBeneficiario') {
                            redirectAfterBeneficiarioSuccess();
                        }
                    } else {
                        status.innerHTML = `<p style='color: red;'>Erro ao salvar: ${restResult.error?.message || 'Erro desconhecido.'}</p>`;
                    }
                    return;
                }
                status.innerHTML = "<p style='color: blue;'>Enviando para o banco de dados... Aguarde.</p>";
                const dados = await buildSubmitPayload(form);
                const tabela = formId === 'formBeneficiario' ? 'beneficiarios' : 'voluntarios';
                try {
                    const { error } = await supabase.from(tabela).insert([dados]);
                    if (!error) {
                        status.innerHTML = "<p style='color: green;'><strong>Sucesso!</strong> Cadastro realizado com sucesso no Instituto Belém.</p>";
                        status.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        form.reset();
                        if (formId === 'formBeneficiario') {
                            redirectAfterBeneficiarioSuccess();
                        }
                    } else {
                        const detail = error?.message || 'Erro desconhecido.';
                        const hint = /column/i.test(detail) ? " Execute o SQL de supabase-schema.sql no painel do Supabase para criar/adicionar as colunas da tabela." : '';
                        status.innerHTML = `<p style='color: red;'>Erro ao salvar: ${detail}${hint}</p>`;
                    }
                } catch (error) {
                    status.innerHTML = `<p style='color: red;'>Erro ao salvar: ${error?.message || 'Erro desconhecido.'}</p>`;
                }
            };

            if (formId === 'formVoluntario') {
                window.__handleVoluntarioSubmit = submitHandler;
            }

            if (formId === 'formBeneficiario') {
                window.__handleBeneficiarioSubmit = submitHandler;
            }

            form.addEventListener('submit', submitHandler);

            const button = document.getElementById(formId === 'formVoluntario' ? 'btnEnviarVoluntario' : 'btnEnviarBeneficiario');
            if (button) {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    submitHandler();
                });
            }

            if (formId === 'formVoluntario') {
                form.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                        const active = document.activeElement;
                        if (active && active.tagName === 'INPUT') {
                            e.preventDefault();
                            submitHandler();
                        }
                    }
                });
            }

        }
    };
    configurarFormulario('formBeneficiario', 'membroStatus');
    configurarFormulario('formVoluntario', 'voluntarioStatus');
}

/**
 * Configura a busca automática de CEP
 */
function initCEP() {
    const inputs = [document.getElementById('vol_cep'), document.getElementById('ben_cep')].filter(Boolean);
    if (!inputs.length) return;

    inputs.forEach((input) => {
        input.addEventListener('input', () => formatarEBuscarCEP(input));
        input.addEventListener('blur', () => buscarEnderecoPorCEP(input));
    });
}

function initFieldMasks() {
    const cpfInput = document.querySelector('input[name="vol_cpf"]');
    const benCpfInput = document.querySelector('input[name="ben_cpf"]');
    const emailInput = document.querySelector('input[name="vol_email"]');
    const benEmailInput = document.querySelector('input[name="ben_email"]');
    const telPrincipalInput = document.querySelector('input[name="vol_tel_principal"]');
    const benTelInput = document.querySelector('input[name="ben_telefone"]');
    const telAltInput = document.querySelector('input[name="vol_tel_alternativo"]');
    const whatsappInput = document.querySelector('input[name="vol_whatsapp"]');

    if (cpfInput) {
        cpfInput.addEventListener('input', () => window.aplicarMascaraCPF(cpfInput));
        cpfInput.addEventListener('blur', () => window.validarCPF(cpfInput));
    }

    if (benCpfInput) {
        benCpfInput.addEventListener('input', () => window.aplicarMascaraCPF(benCpfInput));
        benCpfInput.addEventListener('blur', () => window.validarCPF(benCpfInput));
    }
    if (benEmailInput) {
        benEmailInput.addEventListener('input', () => window.validarEmail(benEmailInput));
        benEmailInput.addEventListener('blur', () => window.validarEmail(benEmailInput));
    }

    if (emailInput) {
        emailInput.addEventListener('input', () => window.validarEmail(emailInput));
        emailInput.addEventListener('blur', () => window.validarEmail(emailInput));
    }

    if (benEmailInput) {
        benEmailInput.addEventListener('input', () => window.validarEmail(benEmailInput));
        benEmailInput.addEventListener('blur', () => window.validarEmail(benEmailInput));
    }

    const applyPhoneMask = (input) => {
        if (!input) return;
        input.addEventListener('input', () => window.aplicarMascaraTelefone(input));
        input.addEventListener('blur', () => window.validarTelefone(input));
    };

    applyPhoneMask(telPrincipalInput);
    applyPhoneMask(benTelInput);
    applyPhoneMask(benTelInput);
    applyPhoneMask(telAltInput);
    applyPhoneMask(whatsappInput);
}

/**
 * Inicializa a lógica de autenticação da Área Restrita
 */
function initAuth() {
    const form = document.getElementById('loginForm');
    const status = document.getElementById('loginStatus');
    const dashboardPath = 'painel-restrito.html';

    if (form && status && window.location.pathname.endsWith('area-restrita.html')) {
        const session = window.localStorage.getItem(ADMIN_SESSION_KEY);
        if (session === 'active') {
            window.location.replace(dashboardPath);
            return;
        }

    }

    if (form && status) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('email').value.trim();
            const senhaInput = document.getElementById('senha').value.trim();

            if (emailInput === ADMIN_EMAIL && senhaInput === ADMIN_PASSWORD) {
                window.localStorage.setItem(ADMIN_SESSION_KEY, 'active');
                status.innerHTML = "<p style='color: green; font-weight: bold;'>Sucesso! Acesso concedido. Redirecionando...</p>";
                setTimeout(() => {
                    window.location.href = dashboardPath;
                }, 900);
            } else {
                status.innerHTML = "<p style='color: red;'>E-mail ou senha incorretos. Tente novamente.</p>";
            }
        });
    }
}

function initPainelRestrito() {
    const painel = document.querySelector('[data-restricted-dashboard]');
    if (!painel) return;

    const session = window.localStorage.getItem(ADMIN_SESSION_KEY);
    if (session !== 'active') {
        window.location.replace('area-restrita.html');
        return;
    }

    const logoutButton = document.getElementById('logoutRestrito');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            window.localStorage.removeItem(ADMIN_SESSION_KEY);
            window.location.href = 'area-restrita.html';
        });
    }
}

function initListaMembros() {
    const membersPage = document.querySelector('[data-members-page]');
    if (!membersPage) return;

    const session = window.localStorage.getItem(ADMIN_SESSION_KEY);
    if (session !== 'active') {
        window.location.replace('area-restrita.html');
        return;
    }

    const status = document.getElementById('membersStatus');
    const count = document.getElementById('membersCount');
    const tbody = document.getElementById('membersTableBody');
    const modal = document.getElementById('memberEditModal');
    const editForm = document.getElementById('memberEditForm');
    const closeModalButton = document.getElementById('closeMemberModal');
    const cancelEditButton = document.getElementById('cancelMemberEdit');
    const detailsModal = document.getElementById('memberDetailsModal');
    const detailsContent = document.getElementById('memberDetailsContent');
    const closeDetailsModalButton = document.getElementById('closeDetailsModal');
    const closeDetailsModalFooter = document.getElementById('closeDetailsModalFooter');
    let currentRows = [];

    const hideModal = () => {
        if (!modal) return;
        modal.setAttribute('hidden', 'hidden');
        modal.setAttribute('aria-hidden', 'true');
    };

    const showModal = () => {
        if (!modal) return;
        modal.removeAttribute('hidden');
        modal.setAttribute('aria-hidden', 'false');
    };

    const hideDetailsModal = () => {
        if (!detailsModal) return;
        detailsModal.setAttribute('hidden', 'hidden');
        detailsModal.setAttribute('aria-hidden', 'true');
    };

    const showDetailsModal = () => {
        if (!detailsModal) return;
        detailsModal.removeAttribute('hidden');
        detailsModal.setAttribute('aria-hidden', 'false');
    };

    const escapeHtml = (value) => String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const formatBool = (value) => value ? 'Sim' : 'Nao';

    const formatDate = (value) => {
        if (!value) return '-';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        return date.toLocaleDateString('pt-BR');
    };

    const fileToDataUrl = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Nao foi possivel ler a imagem selecionada.'));
        reader.readAsDataURL(file);
    });

    const fillDetailsModal = (row) => {
        if (!detailsContent || !row) return;

        const memberName = row.vol_nome || row.nome || 'Membro';
        const initials = memberName
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase())
            .join('') || 'IB';
        const photoCard = row.vol_foto_url
            ? `<div class="member-detail-item" style="grid-column: 1 / -1; display:flex; align-items:center; gap:12px;"><img src="${row.vol_foto_url}" alt="Foto de ${escapeHtml(memberName)}" class="member-photo vol-foto-ampliar" style="width:64px;height:64px;cursor:zoom-in;" title="Clique para ampliar"><span><strong>Foto do membro</strong><span>Clique na imagem para ampliar</span></span></div>`
            : `<div class="member-detail-item" style="grid-column: 1 / -1; display:flex; align-items:center; gap:12px;"><span class="member-avatar" style="width:64px;height:64px;font-size:1rem;">${initials}</span><span><strong>Foto do membro</strong><span>Sem foto cadastrada</span></span></div>`;

        const fields = [
            ['Nome completo', row.vol_nome || row.nome || '-'],
            ['E-mail', row.vol_email || row.email || '-'],
            ['Data de nascimento', formatDate(row.vol_data_nasc)],
            ['CPF', row.vol_cpf || '-'],
            ['RG', row.vol_rg || '-'],
            ['Telefone principal', row.vol_tel_principal || row.telefone || '-'],
            ['Telefone alternativo', row.vol_tel_alternativo || '-'],
            ['WhatsApp', row.vol_whatsapp || '-'],
            ['CEP', row.vol_cep || '-'],
            ['Rua', row.vol_rua || '-'],
            ['Numero', row.vol_numero || '-'],
            ['Bairro', row.vol_bairro || '-'],
            ['Cidade', row.vol_cidade || '-'],
            ['Estado', row.vol_estado || '-'],
            ['Tipo de membro', row.tipo_membro || '-'],
            ['Area', row.area || '-'],
            ['Area (outro)', row.area_outro || '-'],
            ['Dias disponiveis', row.dias_disponiveis || '-'],
            ['Horarios disponiveis', row.horarios_disponiveis || '-'],
            ['Frequencia', row.frequencia_vol || '-'],
            ['Formacao', row.formacao || '-'],
            ['Cursos', row.cursos || '-'],
            ['Experiencia', row.experiencia || '-'],
            ['Habilidades', row.habilidades || '-'],
            ['Data da ultima atuacao', formatDate(row.data_entrada)],
            ['Projetos', row.projetos || '-'],
            ['Participacoes anteriores', row.part_anteriores || '-'],
            ['Avaliacao interna', row.avaliacao || '-'],
            ['Termo de voluntariado', formatBool(row.termo_vol)],
            ['Codigo de conduta', formatBool(row.codigo_conduta)],
            ['Confidencialidade', formatBool(row.confidencialidade)],
            ['Uso de imagem', formatBool(row.uso_imagem)],
            ['Data do cadastro', row.created_at ? new Date(row.created_at).toLocaleString('pt-BR') : '-']
        ];

        detailsContent.innerHTML = fields
            .map(([label, value]) => `<div class="member-detail-item"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(value)}</span></div>`)
            .join('');

        detailsContent.innerHTML = `${photoCard}${detailsContent.innerHTML}`;

        const volFotoEl = detailsContent.querySelector('.vol-foto-ampliar');
        if (volFotoEl) {
            // Reutiliza o mesmo lightbox criado por initListaBeneficiarios, ou cria um novo
            if (!document.getElementById('benFotoLightbox')) {
                const lb = document.createElement('div');
                lb.id = 'benFotoLightbox';
                lb.setAttribute('role', 'dialog');
                lb.setAttribute('aria-label', 'Foto ampliada');
                lb.style.cssText = 'display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.85);align-items:center;justify-content:center;cursor:zoom-out;';
                lb.innerHTML = '<img id="benFotoLightboxImg" alt="Foto ampliada" style="max-width:90vw;max-height:90vh;border-radius:8px;box-shadow:0 4px 32px rgba(0,0,0,0.6);object-fit:contain;">';
                lb.addEventListener('click', () => { lb.style.display = 'none'; });
                document.addEventListener('keydown', (e) => { if (e.key === 'Escape') lb.style.display = 'none'; });
                document.body.appendChild(lb);
            }
            volFotoEl.addEventListener('click', () => {
                const lb = document.getElementById('benFotoLightbox');
                const img = document.getElementById('benFotoLightboxImg');
                if (lb && img) { img.src = volFotoEl.src; img.alt = volFotoEl.alt; lb.style.display = 'flex'; }
            });
        }
    };

    const fillEditForm = (row) => {
        if (!editForm || !row) return;
        const setValue = (id, value) => {
            const input = document.getElementById(id);
            if (input) input.value = value || '';
        };
        const setChecked = (id, value) => {
            const input = document.getElementById(id);
            if (input) input.checked = Boolean(value);
        };

        setValue('edit_id', row.id);
        setValue('edit_vol_nome', row.vol_nome || row.nome || '');
        setValue('edit_vol_email', row.vol_email || row.email || '');
        setValue('edit_vol_data_nasc', row.vol_data_nasc || '');
        setValue('edit_vol_cpf', row.vol_cpf || '');
        setValue('edit_vol_rg', row.vol_rg || '');
        setValue('edit_vol_tel_principal', row.vol_tel_principal || row.telefone || '');
        setValue('edit_vol_tel_alternativo', row.vol_tel_alternativo || '');
        setValue('edit_vol_whatsapp', row.vol_whatsapp || '');
        setValue('edit_vol_cep', row.vol_cep || '');
        setValue('edit_vol_rua', row.vol_rua || '');
        setValue('edit_vol_numero', row.vol_numero || '');
        setValue('edit_vol_bairro', row.vol_bairro || '');
        setValue('edit_vol_cidade', row.vol_cidade || '');
        setValue('edit_vol_estado', row.vol_estado || '');
        setValue('edit_tipo_membro', row.tipo_membro || '');
        setValue('edit_area', row.area || '');
        setValue('edit_area_outro', row.area_outro || '');
        setValue('edit_dias_disponiveis', row.dias_disponiveis || '');
        setValue('edit_horarios_disponiveis', row.horarios_disponiveis || '');
        setValue('edit_frequencia_vol', row.frequencia_vol || '');
        setValue('edit_formacao', row.formacao || '');
        setValue('edit_cursos', row.cursos || '');
        setValue('edit_experiencia', row.experiencia || '');
        setValue('edit_habilidades', row.habilidades || '');
        setValue('edit_data_entrada', row.data_entrada || '');
        setValue('edit_projetos', row.projetos || '');
        setValue('edit_part_anteriores', row.part_anteriores || '');
        setValue('edit_avaliacao', row.avaliacao || '');
        setValue('edit_vol_foto_nome', row.vol_foto_nome || '');
        setValue('edit_vol_foto_url', row.vol_foto_url || '');
        setValue('edit_vol_foto_atual', row.vol_foto_nome || (row.vol_foto_url ? 'Imagem cadastrada' : 'Sem foto cadastrada'));
        const photoFileInput = document.getElementById('edit_vol_foto_file');
        if (photoFileInput) photoFileInput.value = '';

        // Exibir foto atual no preview
        const editFotoPreview = document.getElementById('edit_vol_foto_preview');
        if (editFotoPreview) {
            if (row.vol_foto_url) {
                editFotoPreview.src = row.vol_foto_url;
                editFotoPreview.style.display = 'block';
            } else {
                editFotoPreview.src = '';
                editFotoPreview.style.display = 'none';
            }
            // Lightbox ao clicar na foto atual
            editFotoPreview.onclick = null;
            editFotoPreview.addEventListener('click', () => {
                if (!editFotoPreview.src) return;
                if (!document.getElementById('benFotoLightbox')) return;
                const lb = document.getElementById('benFotoLightbox');
                const img = document.getElementById('benFotoLightboxImg');
                if (lb && img) { img.src = editFotoPreview.src; img.alt = editFotoPreview.alt; lb.style.display = 'flex'; }
            }, { once: false });
        }

        // Preview ao selecionar nova foto
        if (photoFileInput) {
            const handler = () => {
                const file = photoFileInput.files[0];
                if (file && file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        if (editFotoPreview) { editFotoPreview.src = e.target.result; editFotoPreview.style.display = 'block'; }
                    };
                    reader.readAsDataURL(file);
                }
            };
            photoFileInput.removeEventListener('change', photoFileInput._previewHandler);
            photoFileInput._previewHandler = handler;
            photoFileInput.addEventListener('change', handler);
        }

        setChecked('edit_termo_vol', row.termo_vol);
        setChecked('edit_codigo_conduta', row.codigo_conduta);
        setChecked('edit_confidencialidade', row.confidencialidade);
        setChecked('edit_uso_imagem', row.uso_imagem);
    };

    const toUpdatePayload = async (form) => {
        const formData = new FormData(form);
        const asTrim = (key) => (formData.get(key) || '').toString().trim();
        const asNullable = (key) => {
            const value = asTrim(key);
            return value || null;
        };
        const selectedPhoto = formData.get('vol_foto_file');
        let photoName = asNullable('vol_foto_nome');
        let photoUrl = asNullable('vol_foto_url');

        if (selectedPhoto instanceof File && selectedPhoto.size > 0) {
            if (!selectedPhoto.type || !selectedPhoto.type.startsWith('image/')) {
                throw new Error('Selecione um arquivo de imagem valido para a foto.');
            }
            photoName = selectedPhoto.name;
            photoUrl = await fileToDataUrl(selectedPhoto);
        }

        return {
            vol_nome: asTrim('vol_nome'),
            vol_email: asTrim('vol_email'),
            vol_data_nasc: asNullable('vol_data_nasc'),
            vol_cpf: asNullable('vol_cpf'),
            vol_rg: asNullable('vol_rg'),
            vol_tel_principal: asTrim('vol_tel_principal'),
            vol_tel_alternativo: asNullable('vol_tel_alternativo'),
            vol_whatsapp: asNullable('vol_whatsapp'),
            vol_cep: asNullable('vol_cep'),
            vol_rua: asNullable('vol_rua'),
            vol_numero: asNullable('vol_numero'),
            vol_bairro: asNullable('vol_bairro'),
            vol_cidade: asNullable('vol_cidade'),
            vol_estado: asNullable('vol_estado'),
            tipo_membro: asNullable('tipo_membro'),
            area: asNullable('area'),
            area_outro: asNullable('area_outro'),
            dias_disponiveis: asNullable('dias_disponiveis'),
            horarios_disponiveis: asNullable('horarios_disponiveis'),
            frequencia_vol: asNullable('frequencia_vol'),
            formacao: asNullable('formacao'),
            cursos: asNullable('cursos'),
            experiencia: asNullable('experiencia'),
            habilidades: asNullable('habilidades'),
            data_entrada: asNullable('data_entrada'),
            projetos: asNullable('projetos'),
            part_anteriores: asNullable('part_anteriores'),
            avaliacao: asNullable('avaliacao'),
            termo_vol: formData.get('termo_vol') === 'on',
            codigo_conduta: formData.get('codigo_conduta') === 'on',
            confidencialidade: formData.get('confidencialidade') === 'on',
            uso_imagem: formData.get('uso_imagem') === 'on',
            vol_foto_nome: photoName,
            vol_foto_url: photoUrl,
            nome: asTrim('vol_nome'),
            email: asTrim('vol_email'),
            telefone: asTrim('vol_tel_principal')
        };
    };

    const validateEditPayload = (payload) => {
        if (!payload.vol_nome) return 'Preencha o campo Nome completo.';
        if (!hasAtLeastTwoWords(payload.vol_nome)) return 'O campo Nome completo deve conter pelo menos duas palavras.';
        if (!payload.vol_email || !isValidEmail(payload.vol_email)) return 'Preencha o campo E-mail com um formato válido.';
        if (!isValidPhoneNumber(payload.vol_tel_principal)) return 'Preencha o campo Telefone principal com 10 ou 11 dígitos.';
        return null;
    };

    const renderEmpty = (message) => {
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="11">${message}</td></tr>`;
        }
    };

    const renderRows = (rows) => {
        if (!tbody) return;

        if (!rows.length) {
            renderEmpty('Nenhum membro cadastrado ainda.');
            return;
        }

        tbody.innerHTML = rows.map((row) => {
            const cityState = [row.vol_cidade || row.cidade || '', row.vol_estado || row.estado || ''].filter(Boolean).join('/');
                        const memberName = row.nome || row.vol_nome || '';
                        const initials = memberName
                                .split(' ')
                                .filter(Boolean)
                                .slice(0, 2)
                                .map((part) => part.charAt(0).toUpperCase())
                                .join('') || 'IB';
                        const photoHtml = row.vol_foto_url
                                ? `<img src="${row.vol_foto_url}" alt="Foto de ${memberName || 'membro'}" class="member-photo">`
                                : `<span class="member-avatar" aria-label="Foto do membro">${initials}</span>`;

            return `
              <tr>
                                <td>
                                    ${photoHtml}
                                </td>
                <td>${row.created_at ? new Date(row.created_at).toLocaleString('pt-BR') : '-'}</td>
                <td>${row.nome || row.vol_nome || '-'}</td>
                <td>${row.email || row.vol_email || '-'}</td>
                <td>${row.telefone || row.vol_tel_principal || '-'}</td>
                <td>${row.vol_cpf || row.cpf || '-'}</td>
                <td>${cityState || '-'}</td>
                <td>${row.area || '-'}</td>
                <td>${row.dias_disponiveis || '-'}</td>
                <td>${row.frequencia_vol || '-'}</td>
                                                                <td>
                                                                    <div class="member-actions">
                                                                        <button type="button" class="btn-enviar btn-small" data-edit-member-id="${row.id}">Editar cadastro</button>
                                                                        <button type="button" class="btn-enviar btn-secondary btn-small" data-view-member-id="${row.id}">Abrir detalhes</button>
                                                                    </div>
                                                                </td>
              </tr>`;
        }).join('');

        if (count) {
            count.textContent = `${rows.length} membro(s) encontrado(s).`;
        }
    };

    const loadMembers = async () => {
        if (status) {
            status.innerHTML = "<p style='color: blue;'>Carregando membros cadastrados...</p>";
        }

        try {
            const headers = {
                'Accept': 'application/json',
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlmd2Jpa3h0Y2ptYXRyZ29ubnF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2NTM2NTMsImV4cCI6MjA5NzIyOTY1M30.lDeYy7juOx1m6DcwjBGNyTPJFGBbxFgl_sZ-LxUet4Q',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlmd2Jpa3h0Y2ptYXRyZ29ubnF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2NTM2NTMsImV4cCI6MjA5NzIyOTY1M30.lDeYy7juOx1m6DcwjBGNyTPJFGBbxFgl_sZ-LxUet4Q'
            };
            const queryWithPhoto = 'https://yfwbikxtcjmatrgonnqy.supabase.co/rest/v1/voluntarios?select=id,created_at,nome,email,telefone,vol_nome,vol_email,vol_data_nasc,vol_cpf,vol_rg,vol_tel_principal,vol_tel_alternativo,vol_whatsapp,vol_cep,vol_rua,vol_numero,vol_bairro,vol_cidade,vol_estado,tipo_membro,area,area_outro,dias_disponiveis,horarios_disponiveis,frequencia_vol,formacao,cursos,experiencia,habilidades,data_entrada,projetos,part_anteriores,avaliacao,termo_vol,codigo_conduta,confidencialidade,uso_imagem,vol_foto_url,vol_foto_nome&order=created_at.desc&limit=100';
            const queryWithoutPhoto = 'https://yfwbikxtcjmatrgonnqy.supabase.co/rest/v1/voluntarios?select=id,created_at,nome,email,telefone,vol_nome,vol_email,vol_data_nasc,vol_cpf,vol_rg,vol_tel_principal,vol_tel_alternativo,vol_whatsapp,vol_cep,vol_rua,vol_numero,vol_bairro,vol_cidade,vol_estado,tipo_membro,area,area_outro,dias_disponiveis,horarios_disponiveis,frequencia_vol,formacao,cursos,experiencia,habilidades,data_entrada,projetos,part_anteriores,avaliacao,termo_vol,codigo_conduta,confidencialidade,uso_imagem&order=created_at.desc&limit=100';

            let response = await fetch(queryWithPhoto, { headers });
            if (!response.ok) {
                const detail = await response.text();
                const missingPhotoColumn = /vol_foto_url|vol_foto_nome|column/i.test(detail);
                if (missingPhotoColumn) {
                    response = await fetch(queryWithoutPhoto, { headers });
                } else {
                    if (status) {
                        status.innerHTML = `<p style='color: red;'>Erro ao carregar membros: ${detail}</p>`;
                    }
                    renderEmpty('Falha ao carregar a lista.');
                    return;
                }
            }

            if (!response.ok) {
                const detail = await response.text();
                if (status) {
                    status.innerHTML = `<p style='color: red;'>Erro ao carregar membros: ${detail}</p>`;
                }
                renderEmpty('Falha ao carregar a lista.');
                return;
            }

            const rows = await response.json();
            currentRows = rows;
            renderRows(rows);
            if (status) {
                status.innerHTML = "<p style='color: green;'>Lista carregada com sucesso.</p>";
            }
        } catch (error) {
            if (status) {
                status.innerHTML = `<p style='color: red;'>Erro ao carregar membros: ${error?.message || 'Erro desconhecido.'}</p>`;
            }
            renderEmpty('Falha ao carregar a lista.');
        }
    };

    loadMembers();

    const btnAtualizarMembros = document.getElementById('btnAtualizarMembros');
    if (btnAtualizarMembros) {
        btnAtualizarMembros.addEventListener('click', () => loadMembers());
    }

    if (tbody) {
        tbody.addEventListener('click', (event) => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) return;

            const button = target.closest('[data-edit-member-id]');
            const detailsButton = target.closest('[data-view-member-id]');
            if (!button && !detailsButton) return;

            const memberId = button
                ? button.getAttribute('data-edit-member-id')
                : detailsButton.getAttribute('data-view-member-id');
            const row = currentRows.find((item) => item.id === memberId);
            if (!row) return;

            if (button) {
                fillEditForm(row);
                showModal();
                return;
            }

            fillDetailsModal(row);
            showDetailsModal();
        });
    }

    if (closeModalButton) {
        closeModalButton.addEventListener('click', hideModal);
    }

    if (cancelEditButton) {
        cancelEditButton.addEventListener('click', hideModal);
    }

    if (modal) {
        modal.addEventListener('click', (event) => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) return;
            if (target.matches('[data-close-modal]')) {
                hideModal();
            }
        });
    }

    if (closeDetailsModalButton) {
        closeDetailsModalButton.addEventListener('click', hideDetailsModal);
    }

    if (closeDetailsModalFooter) {
        closeDetailsModalFooter.addEventListener('click', hideDetailsModal);
    }

    if (detailsModal) {
        detailsModal.addEventListener('click', (event) => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) return;
            if (target.matches('[data-close-details-modal]')) {
                hideDetailsModal();
            }
        });
    }

    if (editForm) {
        editForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const memberId = (new FormData(editForm).get('id') || '').toString();
            if (!memberId) {
                if (status) status.innerHTML = "<p style='color: red;'>Não foi possível identificar o membro para edição.</p>";
                return;
            }

            let payload;
            try {
                payload = await toUpdatePayload(editForm);
            } catch (error) {
                if (status) status.innerHTML = `<p style='color: red;'>${error?.message || 'Erro ao processar a foto selecionada.'}</p>`;
                return;
            }

            const validationError = validateEditPayload(payload);
            if (validationError) {
                if (status) status.innerHTML = `<p style='color: red;'>${validationError}</p>`;
                return;
            }

            if (status) status.innerHTML = "<p style='color: blue;'>Salvando alterações...</p>";

            try {
                const response = await fetch(`https://yfwbikxtcjmatrgonnqy.supabase.co/rest/v1/voluntarios?id=eq.${memberId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Prefer': 'return=minimal',
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const detail = await response.text();
                    if (status) status.innerHTML = `<p style='color: red;'>Erro ao atualizar membro: ${detail}</p>`;
                    return;
                }

                hideModal();
                if (status) status.innerHTML = "<p style='color: green;'>Membro atualizado com sucesso.</p>";
                loadMembers();
            } catch (error) {
                if (status) status.innerHTML = `<p style='color: red;'>Erro ao atualizar membro: ${error?.message || 'Erro desconhecido.'}</p>`;
            }
        });
    }

    const logoutButton = document.getElementById('logoutRestrito');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            window.localStorage.removeItem(ADMIN_SESSION_KEY);
            window.location.href = 'area-restrita.html';
        });
    }
}

function initListaBeneficiarios() {
    const page = document.querySelector('[data-beneficiarios-page]');
    if (!page) return;

    const session = window.localStorage.getItem(ADMIN_SESSION_KEY);
    if (session !== 'active') {
        window.location.replace('area-restrita.html');
        return;
    }

    const status = document.getElementById('beneficiariosStatus');
    const count = document.getElementById('beneficiariosCount');
    const tbody = document.getElementById('beneficiariosTableBody');
    const modal = document.getElementById('beneficiarioEditModal');
    const editForm = document.getElementById('beneficiarioEditForm');
    const closeModalBtn = document.getElementById('closeBeneficiarioModal');
    const cancelEditBtn = document.getElementById('cancelBeneficiarioEdit');
    const detailsModal = document.getElementById('beneficiarioDetailsModal');
    const detailsContent = document.getElementById('beneficiarioDetailsContent');
    const closeDetailsBtn = document.getElementById('closeBeneficiarioDetailsModal');
    const closeDetailsFooter = document.getElementById('closeBeneficiarioDetailsFooter');
    let currentRows = [];

    const hideModal = () => { if (modal) { modal.setAttribute('hidden', 'hidden'); modal.setAttribute('aria-hidden', 'true'); } };
    const showModal = () => { if (modal) { modal.removeAttribute('hidden'); modal.setAttribute('aria-hidden', 'false'); } };
    const hideDetails = () => { if (detailsModal) { detailsModal.setAttribute('hidden', 'hidden'); detailsModal.setAttribute('aria-hidden', 'true'); } };
    const showDetails = () => { if (detailsModal) { detailsModal.removeAttribute('hidden'); detailsModal.setAttribute('aria-hidden', 'false'); } };

    const escapeHtml = (v) => String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    const formatDate = (v) => { if (!v) return '-'; const d = new Date(v); return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('pt-BR'); };
    const fileToDataUrl = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
        reader.readAsDataURL(file);
    });

    // Lightbox reutilizável para ampliar foto do beneficiário
    const ensureLightbox = () => {
        if (document.getElementById('benFotoLightbox')) return;
        const lb = document.createElement('div');
        lb.id = 'benFotoLightbox';
        lb.setAttribute('role', 'dialog');
        lb.setAttribute('aria-label', 'Foto ampliada');
        lb.style.cssText = 'display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.85);align-items:center;justify-content:center;cursor:zoom-out;';
        lb.innerHTML = '<img id="benFotoLightboxImg" alt="Foto ampliada" style="max-width:90vw;max-height:90vh;border-radius:8px;box-shadow:0 4px 32px rgba(0,0,0,0.6);object-fit:contain;">';
        lb.addEventListener('click', () => { lb.style.display = 'none'; });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') lb.style.display = 'none'; });
        document.body.appendChild(lb);
    };
    ensureLightbox();

    const openLightbox = (src, alt) => {
        const lb = document.getElementById('benFotoLightbox');
        const img = document.getElementById('benFotoLightboxImg');
        if (!lb || !img) return;
        img.src = src;
        img.alt = alt || 'Foto ampliada';
        lb.style.display = 'flex';
    };

    const fillDetailsModal = (row) => {
        if (!detailsContent || !row) return;
        const name = row.ben_nome || row.nome || 'Beneficiário';
        const initials = name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('') || 'IB';
        const photoCard = row.ben_foto_url
            ? `<div class="member-detail-item" style="grid-column:1/-1;display:flex;align-items:center;gap:12px;"><img src="${row.ben_foto_url}" alt="Foto de ${escapeHtml(name)}" class="member-photo ben-foto-ampliar" style="width:64px;height:64px;cursor:zoom-in;" title="Clique para ampliar"><span><strong>Foto</strong><span>Clique na imagem para ampliar</span></span></div>`
            : `<div class="member-detail-item" style="grid-column:1/-1;display:flex;align-items:center;gap:12px;"><span class="member-avatar" style="width:64px;height:64px;font-size:1rem;">${initials}</span><span><strong>Foto</strong><span>Sem foto cadastrada</span></span></div>`;

        const fields = [
            ['Nome completo', row.ben_nome || '-'],
            ['E-mail', row.ben_email || '-'],
            ['Data de nascimento', formatDate(row.ben_data_nasc)],
            ['CPF', row.ben_cpf || '-'],
            ['Telefone', row.ben_telefone || '-'],
            ['CEP', row.ben_cep || '-'],
            ['Rua', row.ben_rua || '-'],
            ['Número', row.ben_numero || '-'],
            ['Bairro', row.ben_bairro || '-'],
            ['Cidade', row.ben_cidade || '-'],
            ['Estado', row.ben_estado || '-'],
            ['Necessidade', row.necessidade || '-'],
            ['Renda familiar', row.ben_renda || '-'],
            ['Composição familiar', row.ben_familiares || '-'],
            ['Observações', row.observacoes || '-'],
            ['Autorizou cadastro', row.termo ? 'Sim' : 'Não'],
            ['Data do cadastro', row.created_at ? new Date(row.created_at).toLocaleString('pt-BR') : '-']
        ];

        detailsContent.innerHTML = photoCard + fields
            .map(([label, value]) => {
                const extraStyle = label === 'Observações' ? ' style="grid-row:span 2;"' : '';
                return `<div class="member-detail-item"${extraStyle}><strong>${escapeHtml(label)}</strong><span>${escapeHtml(value)}</span></div>`;
            })
            .join('');

        const fotoEl = detailsContent.querySelector('.ben-foto-ampliar');
        if (fotoEl) {
            fotoEl.addEventListener('click', () => openLightbox(fotoEl.src, fotoEl.alt));
        }
    };

    const fillEditForm = (row) => {
        if (!editForm || !row) return;
        const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ''; };
        set('edit_ben_id', row.id);
        set('edit_ben_nome', row.ben_nome || '');
        set('edit_ben_email', row.ben_email || '');
        set('edit_ben_data_nasc', row.ben_data_nasc || '');
        set('edit_ben_cpf', row.ben_cpf || '');
        set('edit_ben_telefone', row.ben_telefone || '');
        set('edit_ben_cep', row.ben_cep || '');
        set('edit_ben_rua', row.ben_rua || '');
        set('edit_ben_numero', row.ben_numero || '');
        set('edit_ben_bairro', row.ben_bairro || '');
        set('edit_ben_cidade', row.ben_cidade || '');
        set('edit_ben_estado', row.ben_estado || '');
        set('edit_ben_necessidade', row.necessidade || '');
        set('edit_ben_renda', row.ben_renda || '');
        set('edit_ben_familiares', row.ben_familiares || '');
        set('edit_ben_observacoes', row.observacoes || '');
        set('edit_ben_foto_nome', row.ben_foto_nome || '');
        set('edit_ben_foto_url', row.ben_foto_url || '');
        set('edit_ben_foto_atual', row.ben_foto_nome || (row.ben_foto_url ? 'Imagem cadastrada' : 'Sem foto cadastrada'));
        const cb = document.getElementById('edit_ben_termo');
        if (cb) cb.checked = Boolean(row.termo);
        const fileInput = document.getElementById('edit_ben_foto_file');
        if (fileInput) fileInput.value = '';
        const preview = document.getElementById('edit_ben_foto_preview');
        if (preview) {
            if (row.ben_foto_url) { preview.src = row.ben_foto_url; preview.style.display = 'block'; }
            else { preview.src = ''; preview.style.display = 'none'; }
        }
    };

    const renderRows = (rows) => {
        if (!tbody) return;
        if (!rows.length) {
            tbody.innerHTML = `<tr><td colspan="9">Nenhum beneficiário cadastrado ainda.</td></tr>`;
            return;
        }
        tbody.innerHTML = rows.map((row) => {
            const name = row.ben_nome || '-';
            const initials = name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('') || 'IB';
            const photoHtml = row.ben_foto_url
                ? `<img src="${row.ben_foto_url}" alt="Foto de ${escapeHtml(name)}" class="member-photo">`
                : `<span class="member-avatar" aria-label="Foto do beneficiário">${initials}</span>`;
            const cityState = [row.ben_cidade || '', row.ben_estado || ''].filter(Boolean).join('/');
            const necessidade = row.necessidade ? (row.necessidade.length > 40 ? row.necessidade.substring(0, 40) + '…' : row.necessidade) : '-';
            return `<tr>
                <td>${photoHtml}</td>
                <td>${escapeHtml(name)}</td>
                <td>${escapeHtml(row.ben_telefone || '-')}</td>
                <td>${escapeHtml(row.ben_cpf || '-')}</td>
                <td>${escapeHtml(cityState || '-')}</td>
                <td>${escapeHtml(necessidade)}</td>
                <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeHtml(row.ben_email || '')}">${escapeHtml(row.ben_email || '-')}</td>
                <td>${row.created_at ? new Date(row.created_at).toLocaleDateString('pt-BR') : '-'}</td>
                <td>
                  <div class="member-actions">
                    <button type="button" class="btn-enviar btn-small" data-edit-ben-id="${row.id}">Editar</button>
                    <button type="button" class="btn-enviar btn-secondary btn-small" data-view-ben-id="${row.id}">Detalhes</button>
                  </div>
                </td>
            </tr>`;
        }).join('');
        if (count) count.textContent = `${rows.length} beneficiário(s) encontrado(s).`;
    };

    const loadBeneficiarios = async () => {
        if (status) status.innerHTML = "<p style='color:blue;'>Carregando beneficiários...</p>";
        try {
            const headers = {
                'Accept': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            };
            const url = `${SUPABASE_URL}/rest/v1/beneficiarios?select=id,created_at,ben_nome,ben_email,ben_data_nasc,ben_cpf,ben_telefone,ben_foto_nome,ben_foto_url,ben_cep,ben_rua,ben_numero,ben_bairro,ben_cidade,ben_estado,necessidade,ben_renda,ben_familiares,observacoes,termo&order=created_at.desc&limit=200`;
            const response = await fetch(url, { headers });
            if (!response.ok) {
                const detail = await response.text();
                if (status) status.innerHTML = `<p style='color:red;'>Erro ao carregar beneficiários: ${detail}</p>`;
                if (tbody) tbody.innerHTML = `<tr><td colspan="9">Falha ao carregar a lista.</td></tr>`;
                return;
            }
            const rows = await response.json();
            currentRows = rows;
            renderRows(rows);
            if (status) status.innerHTML = "<p style='color:green;'>Lista carregada com sucesso.</p>";
        } catch (err) {
            if (status) status.innerHTML = `<p style='color:red;'>Erro: ${err?.message || 'Erro desconhecido.'}</p>`;
            if (tbody) tbody.innerHTML = `<tr><td colspan="9">Falha ao carregar a lista.</td></tr>`;
        }
    };

    loadBeneficiarios();

    // Preview ao trocar foto no modal de edição
    const editFotoFile = document.getElementById('edit_ben_foto_file');
    const editFotoPreview = document.getElementById('edit_ben_foto_preview');
    if (editFotoFile && editFotoPreview) {
        editFotoFile.addEventListener('change', () => {
            const file = editFotoFile.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => { editFotoPreview.src = e.target.result; editFotoPreview.style.display = 'block'; };
                reader.readAsDataURL(file);
            } else {
                editFotoPreview.src = ''; editFotoPreview.style.display = 'none';
            }
        });
    }

    if (tbody) {
        tbody.addEventListener('click', (e) => {
            const editBtn = e.target.closest('[data-edit-ben-id]');
            const viewBtn = e.target.closest('[data-view-ben-id]');
            if (!editBtn && !viewBtn) return;
            const id = editBtn ? editBtn.getAttribute('data-edit-ben-id') : viewBtn.getAttribute('data-view-ben-id');
            const row = currentRows.find(r => r.id === id);
            if (!row) return;
            if (editBtn) { fillEditForm(row); showModal(); }
            else { fillDetailsModal(row); showDetails(); }
        });
    }

    if (closeModalBtn) closeModalBtn.addEventListener('click', hideModal);
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', hideModal);
    if (modal) modal.addEventListener('click', (e) => { if (e.target.matches('[data-close-ben-modal]')) hideModal(); });
    if (closeDetailsBtn) closeDetailsBtn.addEventListener('click', hideDetails);
    if (closeDetailsFooter) closeDetailsFooter.addEventListener('click', hideDetails);
    if (detailsModal) detailsModal.addEventListener('click', (e) => { if (e.target.matches('[data-close-ben-details-modal]')) hideDetails(); });

    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(editForm);
            const id = (formData.get('id') || '').toString().trim();
            if (!id) { if (status) status.innerHTML = "<p style='color:red;'>ID não encontrado.</p>"; return; }

            const asNullable = (key) => { const v = (formData.get(key) || '').toString().trim(); return v || null; };
            let photoName = asNullable('ben_foto_nome');
            let photoUrl = asNullable('ben_foto_url');
            const newFile = formData.get('ben_foto_file');
            if (newFile instanceof File && newFile.size > 0) {
                if (!newFile.type.startsWith('image/')) { if (status) status.innerHTML = "<p style='color:red;'>Selecione uma imagem válida.</p>"; return; }
                photoName = newFile.name;
                photoUrl = await fileToDataUrl(newFile);
            }

            const payload = {
                ben_nome: (formData.get('ben_nome') || '').toString().trim(),
                ben_email: asNullable('ben_email'),
                ben_data_nasc: asNullable('ben_data_nasc'),
                ben_cpf: asNullable('ben_cpf'),
                ben_telefone: asNullable('ben_telefone'),
                ben_cep: asNullable('ben_cep'),
                ben_rua: asNullable('ben_rua'),
                ben_numero: asNullable('ben_numero'),
                ben_bairro: asNullable('ben_bairro'),
                ben_cidade: asNullable('ben_cidade'),
                ben_estado: asNullable('ben_estado'),
                necessidade: asNullable('necessidade'),
                ben_renda: asNullable('ben_renda'),
                ben_familiares: asNullable('ben_familiares'),
                observacoes: asNullable('observacoes'),
                termo: formData.get('termo') === 'on',
                ben_foto_nome: photoName,
                ben_foto_url: photoUrl,
                nome: (formData.get('ben_nome') || '').toString().trim() || null,
                email: asNullable('ben_email'),
                telefone: asNullable('ben_telefone')
            };

            if (!payload.ben_nome) { if (status) status.innerHTML = "<p style='color:red;'>Preencha o Nome completo.</p>"; return; }

            if (status) status.innerHTML = "<p style='color:blue;'>Salvando alterações...</p>";
            try {
                const response = await fetch(`${SUPABASE_URL}/rest/v1/beneficiarios?id=eq.${id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Prefer': 'return=minimal',
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                    },
                    body: JSON.stringify(payload)
                });
                if (!response.ok) {
                    const detail = await response.text();
                    if (status) status.innerHTML = `<p style='color:red;'>Erro ao atualizar: ${detail}</p>`;
                    return;
                }
                hideModal();
                if (status) status.innerHTML = "<p style='color:green;'>Beneficiário atualizado com sucesso.</p>";
                loadBeneficiarios();
            } catch (err) {
                if (status) status.innerHTML = `<p style='color:red;'>Erro: ${err?.message || 'Erro desconhecido.'}</p>`;
            }
        });
    }

    const btnAtualizar = document.getElementById('btnAtualizarBeneficiarios');
    if (btnAtualizar) {
        btnAtualizar.addEventListener('click', () => loadBeneficiarios());
    }

    const logoutButton = document.getElementById('logoutRestrito');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            window.localStorage.removeItem(ADMIN_SESSION_KEY);
            window.location.href = 'area-restrita.html';
        });
    }
}

/**
 * Stub para evitar erros caso a função de ações ainda não tenha sido definida
 */
function initAcoes() {}