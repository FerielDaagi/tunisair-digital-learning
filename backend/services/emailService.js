const nodemailer = require('nodemailer');
const { URL } = require('url');

// Configuration du transporteur email
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'daagiferiel92@gmail.com',
      pass: process.env.EMAIL_PASS || 'nyzo ynjs vbbi uioc' //mot de passe d'application Gmail
    }
  });
};

// Générer un code de vérification
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper: adresse expéditeur homogène (même que l'email de confirmation d'inscription)
const getFromAddress = () => {
  const sender = process.env.EMAIL_USER || 'daagiferiel92@gmail.com';
  const display = process.env.EMAIL_FROM_NAME || 'Tunisair Academy';
  return `${display} <${sender}>`;
};

// Envoyer un email de vérification
const sendVerificationEmail = async (email, verificationCode) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: getFromAddress(),
      to: email,
      subject: 'Vérification de votre compte - E-Learning Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Vérification de compte</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">E-Learning Platform</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #333; margin-top: 0;">Bonjour !</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Merci de vous être inscrit sur notre plateforme d'apprentissage en ligne. 
              Pour activer votre compte, veuillez utiliser le code de vérification ci-dessous :
            </p>
            
            <div style="background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
              <h3 style="color: #667eea; margin: 0; font-size: 32px; letter-spacing: 5px; font-family: monospace;">
                ${verificationCode}
              </h3>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              <strong>Important :</strong> Ce code est valide pendant 10 minutes. 
              Si vous n'avez pas demandé cette vérification, vous pouvez ignorer cet email.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                Cet email a été envoyé automatiquement, merci de ne pas y répondre.
              </p>
            </div>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email de vérification envoyé:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Erreur envoi email:', error);
    return { success: false, error: error.message };
  }
};

// Envoyer un email de confirmation d'activation
const sendActivationConfirmation = async (email, userName) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: getFromAddress(),
      to: email,
      subject: 'Compte activé avec succès - E-Learning Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #38a169, #2f855a); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">✅ Compte activé !</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">E-Learning Platform</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #333; margin-top: 0;">Félicitations ${userName} !</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Votre compte a été activé avec succès. Vous pouvez maintenant vous connecter et 
              commencer votre parcours d'apprentissage.
            </p>
            
            <div style="background: white; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <h3 style="color: #333; margin-top: 0;">Prochaines étapes :</h3>
              <ul style="color: #666; line-height: 1.8;">
                <li>Connectez-vous à votre compte</li>
                <li>Explorez les cours disponibles</li>
                <li>Commencez votre apprentissage</li>
                <li>Suivez votre progression</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
                 style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Se connecter maintenant
              </a>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                Cet email a été envoyé automatiquement, merci de ne pas y répondre.
              </p>
            </div>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email de confirmation envoyé:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Erreur envoi email de confirmation:', error);
    return { success: false, error: error.message };
  }
};

// Envoyer un email de réinitialisation de mot de passe
const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const transporter = createTransporter();

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = new URL('/reset-password', baseUrl);
    resetUrl.searchParams.set('token', resetToken);

    const mailOptions = {
      from: getFromAddress(),
      to: email,
      subject: 'Réinitialisation de votre mot de passe - E-Learning Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Réinitialisation du mot de passe</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">E-Learning Platform</p>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :
            </p>
            <div style="text-align: center; margin: 25px 0;">
              <a href="${resetUrl.toString()}" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Réinitialiser mon mot de passe
              </a>
            </div>
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br/>
              <a href="${resetUrl.toString()}" style="color: #667eea; word-break: break-all;">${resetUrl.toString()}</a>
            </p>
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              <strong>Important :</strong> Ce lien est valable pendant 1 heure. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.
            </p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                Cet email a été envoyé automatiquement, merci de ne pas y répondre.
              </p>
            </div>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email de réinitialisation envoyé:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Erreur envoi email de réinitialisation:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  generateVerificationCode,
  sendVerificationEmail,
  sendActivationConfirmation,
  sendPasswordResetEmail
};
