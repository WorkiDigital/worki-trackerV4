
async function testWebhook() {
    const url = 'http://127.0.0.1:3001/api/webhook/whatsapp?secret=segredo_webhook';

    // Exemplo de Payload vindo da Evolution API
    const payload = {
        event: 'messages.upsert',
        data: {
            key: {
                remoteJid: '5511999999999@s.whatsapp.net',
                fromMe: false,
            },
            pushName: 'Teste Lead',
            message: {
                conversation: 'Oi! Quero saber mais sobre o sistema.'
            }
        }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        console.log('--- REPOSTA DO SERVIDOR LOCAL ---');
        console.log(result);
    } catch (err) {
        console.error('Erro ao chamar o servidor local:', err.message);
    }
}

testWebhook();
