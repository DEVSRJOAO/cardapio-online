const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.addAdminRole = functions.https.onCall((data, context) => {
  // O bloco de segurança está desativado para criar o primeiro admin.
  // GARANTA QUE ESTE BLOCO ESTEJA COMENTADO OU APAGADO
  // if (context.auth.token.admin !== true) {
  //   return {
  //     error: "Apenas administradores podem adicionar outros.",
  //   };
  // }

  console.log("Dados recebidos pela função:", data);

  if (!data || typeof data.email !== "string" || data.email.length === 0) {
    console.error("Erro: 'data.email' inválido recebido.", data);
    throw new functions.https.HttpsError(
        "invalid-argument",
        "O campo 'email' é obrigatório e deve ser um texto.",
    );
  }

  const email = data.email.trim();

  return admin.auth().getUserByEmail(email).then((user) => {
    return admin.auth().setCustomUserClaims(user.uid, {
      admin: true,
    });
  }).then(() => {
    const successMessage = `Sucesso! ${email} se tornou um administrador.`;
    return {
      message: successMessage,
    };
  }).catch((err) => {
    console.error("Erro ao buscar usuário ou definir claims:", err);
    throw new functions.https.HttpsError("internal", err.message);
  });
});
