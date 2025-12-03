const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * GET /getArticles
 * Devuelve la lista de artículos en formato array
 */
exports.getArticles = functions.https.onRequest(async (req, res) => {
  try {
    const dbRef = admin.database().ref("articles");
    const snapshot = await dbRef.once("value");

    const dataMap = snapshot.val() || {};

    const dataList = Object.keys(dataMap).map((key) => ({
      id: key,
      ...dataMap[key],
    }));

    res.status(200).json({
      message: "success",
      statusCode: 200,
      data: dataList,
    });
  } catch (error) {
    console.error("Error al obtener artículos:", error);
    res.status(500).json({
      message: "error",
      statusCode: 500,
      error: error.message,
    });
  }
});


/**
 * POST /createArticle
 * Crea un artículo nuevo con ID autogenerado (push)
 */
exports.createArticle = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        message: "Método no permitido",
        statusCode: 405,
      });
    }

    const {name, description, brand, codebar, price} = req.body;

    // Validar campos
    if (!name || !description || !brand || !codebar || !price) {
      return res.status(400).json({
        message: "Campos incompletos",
        statusCode: 400,
        required_fields: ["name", "description", "brand", "codebar", "price"],
      });
    }

    // Crear nodo con ID autogenerado
    const newRef = admin.database().ref("articles").push();

    const id = newRef.key; // ID generado por Firebase

    await newRef.set({
      id,
      name,
      description,
      brand,
      codebar,
      price,
    });

    res.status(201).json({
      message: "success",
      statusCode: 201,
      data: {
        id,
        name,
        description,
        brand,
        codebar,
        price,
      },
    });
  } catch (error) {
    console.error("Error al crear artículo:", error);
    res.status(500).json({
      message: "error",
      statusCode: 500,
      error: error.message,
    });
  }
});
