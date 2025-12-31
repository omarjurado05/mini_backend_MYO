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

    // 🔎 Verificar si ya existe un artículo con el mismo código de barras
    const existingSnapshot = await admin
        .database()
        .ref("articles")
        .orderByChild("codebar")
        .equalTo(codebar)
        .once("value");

    if (existingSnapshot.exists()) {
      return res.status(409).json({
        message: "El artículo con este código de barras ya existe.",
        statusCode: 409,
        duplicated_codebar: codebar,
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

// metodo actualizar

exports.updateArticle = functions.https.onRequest(async (req, res) => {
  try {
    // Permitir solo PUT
    if (req.method !== "PUT") {
      return res.status(405).json({
        message: "Método no permitido",
        statusCode: 405,
      });
    }

    const {id, name, description, brand, codebar, price} = req.body;

    // Validar que venga el ID
    if (!id) {
      return res.status(400).json({
        message: "El campo 'id' es obligatorio para actualizar.",
        statusCode: 400,
      });
    }

    // Referencia al artículo
    const articleRef = admin.database().ref(`articles/${id}`);
    const snapshot = await articleRef.once("value");

    // Verificar que exista el artículo
    if (!snapshot.exists()) {
      return res.status(404).json({
        message: "El artículo no existe.",
        statusCode: 404,
        id: id,
      });
    }

    const existingData = snapshot.val();
    // Construir los cambios
    const updatedData = {
      name: name ?? existingData.name,
      description: description ?? existingData.description,
      brand: brand ?? existingData.brand,
      codebar: codebar ?? existingData.codebar,
      price: price ?? existingData.price,
      id: existingData.id,
    };

    // Aplicar actualización
    await articleRef.update(updatedData);

    res.status(200).json({
      message: "success",
      statusCode: 200,
      data: updatedData,
    });
  } catch (error) {
    console.error("Error al actualizar artículo:", error);
    res.status(500).json({
      message: "error",
      statusCode: 500,
      error: error.message,
    });
  }
});
// metodo borrar
exports.deleteArticle = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "DELETE") {
      return res.status(405).json({
        message: "Método no permitido",
        statusCode: 405,
      });
    }

    const {id} = req.query;

    if (!id) {
      return res.status(400).json({
        message: "Falta el ID del artículo",
        statusCode: 400,
      });
    }

    const ref = admin.database().ref(`articles/${id}`);
    const snapshot = await ref.once("value");

    if (!snapshot.exists()) {
      return res.status(404).json({
        message: "Artículo no encontrado",
        statusCode: 404,
      });
    }

    // Eliminar nodo completo
    await ref.remove();

    return res.status(200).json({
      message: "success",
      statusCode: 200,
      deleted_id: id,
    });
  } catch (error) {
    console.error("Error al eliminar artículo:", error);
    return res.status(500).json({
      message: "error",
      statusCode: 500,
      error: error.message,
    });
  }
});
exports.getArticleById = functions.https.onRequest(async (req, res) => {
  try {
    // Permitir solo GET
    if (req.method !== "GET") {
      return res.status(405).json({
        message: "Método no permitido",
        statusCode: 405,
      });
    }

    const {id} = req.query;

    // Validar ID
    if (!id) {
      return res.status(400).json({
        message: "El parámetro 'id' es obligatorio",
        statusCode: 400,
      });
    }

    // Referencia al artículo
    const ref = admin.database().ref(`articles/${id}`);
    const snapshot = await ref.once("value");

    // Verificar existencia
    if (!snapshot.exists()) {
      return res.status(404).json({
        message: "Artículo no encontrado",
        statusCode: 404,
        id: id,
      });
    }

    return res.status(200).json({
      message: "success",
      statusCode: 200,
      data: snapshot.val(),
    });
  } catch (error) {
    console.error("Error al obtener el artículo:", error);
    return res.status(500).json({
      message: "error",
      statusCode: 500,
      error: error.message,
    });
  }
});

exports.getServices = functions.https.onRequest(async (req, res) => {
  try {
    const dbRef = admin.database().ref("services");
    const snapshot = await dbRef.once("value");

    const services = snapshot.val() || [];

    res.status(200).json({
      message: "success",
      statusCode: 200,
      data: services,
    });
  } catch (error) {
    console.error("Error al obtener servicios:", error);
    res.status(500).json({
      message: "error",
      statusCode: 500,
      error: error.message,
    });
  }
});
