const http = require('http');
const fs = require('fs');
const path = require('path');

function testUpload() {
    console.log('🧪 Test d\'upload direct sur le serveur principal');
    console.log('================================================');
    
    // Créer un fichier de test
    const testContent = 'Contenu de test pour l\'upload';
    fs.writeFileSync('test-upload-file.txt', testContent);
    console.log('✅ Fichier de test créé: test-upload-file.txt');
    
    // Créer les données multipart/form-data
    const boundary = '----formdata-test-boundary';
    const fileContent = fs.readFileSync('test-upload-file.txt');
    
    let body = '';
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="title"\r\n\r\n`;
    body += `Test Lesson Upload\r\n`;
    
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="description"\r\n\r\n`;
    body += `Test d'upload de fichier\r\n`;
    
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="type"\r\n\r\n`;
    body += `file\r\n`;
    
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="content"\r\n\r\n`;
    body += `Contenu de test\r\n`;
    
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="duration"\r\n\r\n`;
    body += `10\r\n`;
    
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="order"\r\n\r\n`;
    body += `1\r\n`;
    
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="module"\r\n\r\n`;
    body += `68b18e0d60a520a1393b9e98\r\n`;
    
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="attachments"; filename="test-upload-file.txt"\r\n`;
    body += `Content-Type: text/plain\r\n\r\n`;
    body += fileContent.toString();
    body += `\r\n`;
    
    body += `--${boundary}--\r\n`;
    
    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/lessons/module/68b18e0d60a520a1393b9e98',
        method: 'POST',
        headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': Buffer.byteLength(body),
            'Authorization': 'Bearer test-token'
        }
    };
    
    console.log('📤 Envoi de la requête...');
    console.log('📋 Headers:', options.headers);
    
    const req = http.request(options, (res) => {
        console.log(`📊 Status: ${res.statusCode}`);
        console.log(`📊 Headers:`, res.headers);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('📊 Réponse complète:');
            console.log(data);
            
            if (res.statusCode === 200 || res.statusCode === 201) {
                console.log('✅ SUCCÈS!');
            } else {
                console.log('❌ ERREUR!');
            }
            
            // Nettoyage
            try {
                fs.unlinkSync('test-upload-file.txt');
                console.log('🧹 Fichier de test supprimé');
            } catch (e) {
                // Ignorer si le fichier n'existe pas
            }
        });
    });
    
    req.on('error', (error) => {
        console.log('❌ ERREUR RÉSEAU!');
        console.log(error.message);
        
        // Nettoyage
        try {
            fs.unlinkSync('test-upload-file.txt');
            console.log('🧹 Fichier de test supprimé');
        } catch (e) {
            // Ignorer si le fichier n'existe pas
        }
    });
    
    req.write(body);
    req.end();
}

// Attendre que le serveur soit prêt
setTimeout(() => {
    testUpload();
}, 3000);
