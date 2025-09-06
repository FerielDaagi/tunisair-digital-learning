const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testUpload() {
    console.log('🧪 Test d\'upload direct sur le serveur principal');
    console.log('================================================');
    
    try {
        // Créer un fichier de test
        const testContent = 'Contenu de test pour l\'upload';
        fs.writeFileSync('test-upload-file.txt', testContent);
        console.log('✅ Fichier de test créé: test-upload-file.txt');
        
        // Créer FormData
        const formData = new FormData();
        formData.append('title', 'Test Lesson Upload');
        formData.append('description', 'Test d\'upload de fichier');
        formData.append('type', 'file');
        formData.append('content', 'Contenu de test');
        formData.append('duration', '10');
        formData.append('order', '1');
        formData.append('module', '68b18e0d60a520a1393b9e98');
        formData.append('attachments', fs.createReadStream('test-upload-file.txt'));
        
        console.log('📤 Envoi de la requête...');
        
        // Envoyer la requête
        const response = await axios.post(
            'http://localhost:5000/api/lessons/module/68b18e0d60a520a1393b9e98',
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': 'Bearer test-token'
                }
            }
        );
        
        console.log('✅ SUCCÈS!');
        console.log('📊 Réponse:', response.data);
        
    } catch (error) {
        console.log('❌ ERREUR!');
        if (error.response) {
            console.log('📊 Status:', error.response.status);
            console.log('📊 Data:', error.response.data);
        } else {
            console.log('📊 Erreur:', error.message);
        }
    } finally {
        // Nettoyage
        try {
            fs.unlinkSync('test-upload-file.txt');
            console.log('🧹 Fichier de test supprimé');
        } catch (e) {
            // Ignorer si le fichier n'existe pas
        }
    }
}

// Attendre que le serveur soit prêt
setTimeout(() => {
    testUpload();
}, 3000);
