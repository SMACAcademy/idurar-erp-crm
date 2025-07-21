const queryService = require("../../services/queryServices/queryServices")

const createQuery = async (req, res) => {
    try {
        const { client, description, status, resolution } = req.body;
        if (!client) {
            const error = new Error("Client Id is required");
            error.code = 400;
            throw error;
        }
        if (!description) {
            const error = new Error("Description is required");
            error.code = 400;
            throw error;
        }
        if (resolution && resolution.length > 100) {
            const error = new Error("Resolution must be 100 characters or fewer.");
            error.code = 400;
            throw error;
        }

        const query = await queryService.createQuery({
            client, description, status, resolution
        })

        res.status(201).json({
            message: "Query created successfully",
            query
        });

    } catch (error) {
        console.error("Error creating query:", error);
        res.status(error.code || 500).json({ message: error.message || "Internal Server Error" });
    }
}

const getQueries = async (req, res) => {
    try {
        const { page = 1, limit = 10, status = '' } = req.query;

        const { queries, total } = await queryService.getQueries({
            page: parseInt(page),
            limit: parseInt(limit),
            status
        });

        res.status(200).json({
            result: queries,
            pagination: {
                total,
                pageSize: parseInt(limit),
                current: parseInt(page),
            },
        });

    } catch (error) {
        console.error('Error fetching queries:', error);
        res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
};

const getQueryById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            const error = new Error("Query ID is required");
            error.code = 400;
            throw error;
        }

        const query = await queryService.getQueryById(id);
        if (!query) {
            const error = new Error("Query not found");
            error.code = 404;
            throw error;
        }

        res.status(200).json({
            message: "Query fetched successfully",
            query
        });
    } catch (error) {
        console.error("Error fetching query by ID:", error);
        res.status(error.code || 500).json({ message: error.message || "Internal Server Error" });
    }
}

const updateQuery = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, resolution } = req.body;

        if (!id) throw new Error("Query ID is required");

        if (resolution?.length > 100) {
            const error = new Error("Resolution must be 100 characters or fewer.");
            error.code = 400;
            throw error;
        }

        const updated = await queryService.updateQuery(id, { status, resolution });
        if (!updated) {
            const error = new Error("Query not found");
            error.code = 404;
            throw error;
        }

        res.status(200).json({
            message: "Query updated successfully",
            query: updated
        });
    } catch (error) {
        console.error("Error updating query:", error);
        res.status(error.code || 500).json({ message: error.message || "Internal Server Error" });
    }
};

const addNoteToQuery = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;

        if (!content || content.trim() === '') {
            const error = new Error("Note content is required");
            error.code = 400;
            throw error;
        }

        const updated = await queryService.addNoteToQuery(id, content);
        res.status(200).json({
            message: "Note added successfully",
            data: updated
        });
    } catch (error) {
        console.error("Error adding note:", error);
        res.status(error.code || 500).json({ message: error.message });
    }
};

const deleteNoteFromQuery = async (req, res) => {
    try {
        const { id, noteId } = req.params;

        if (!id || !noteId) {
            const error = new Error("Query ID and Note ID are required");
            error.code = 400;
            throw error;
        }

        const updatedQuery = await queryService.deleteNoteFromQuery(id, noteId);
        res.status(200).json({
            message: "Note deleted successfully",
            data: updatedQuery
        });
    } catch (error) {
        console.error("Error deleting note:", error);
        res.status(error.code || 500).json({ message: error.message });
    }
};

module.exports = {
    createQuery,
    getQueries,
    getQueryById,
    updateQuery,
    addNoteToQuery,
    deleteNoteFromQuery
}