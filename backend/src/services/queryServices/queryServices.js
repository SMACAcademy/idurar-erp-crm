const queryDAO = require("../../dao/queryDAO/queryDAO");

const createQuery = async (data) => {
    return await queryDAO.createQuery(data);
}

const getQueries = async ({ page, limit, status }) => {
    const skip = (page - 1) * limit;
    return await queryDAO.getQueries({
        skip,
        limit,
        status
    });
};

const getQueryById = async (id) => {
    return await queryDAO.getQueryById(id);
}

const updateQuery = async (id, data) => {
    return await queryDAO.updateQuery(id, data);
};

const addNoteToQuery = async (queryId, content) => {
    return await queryDAO.addNote(queryId, content);
};

const deleteNoteFromQuery = async (queryId, noteId) => {
    return await queryDAO.deleteNote(queryId, noteId);
};


module.exports = {
    createQuery,
    getQueries,
    getQueryById,
    updateQuery,
    addNoteToQuery,
    deleteNoteFromQuery
}