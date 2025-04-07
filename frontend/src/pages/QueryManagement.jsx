import React, { useEffect, useState } from "react";
import axios from "axios";
// import "../../style/table.css";


const API_BASE_URL = "http://localhost:8888/api/queries";

const QueryManagement = () => {
  const [queries, setQueries] = useState([]);
  const [newQuery, setNewQuery] = useState({ customerName: "", description: "" });
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [totalQueries, setTotalQueries] = useState(0);
  const [notes, setNotes] = useState({});
  const [newNotes, setNewNotes] = useState({});

  useEffect(() => {
    fetchQueries();
  }, [page]);

  const fetchQueries = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}?page=${page}&limit=${limit}`);
      setQueries(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error fetching queries:", error);
    }
  };

  const createQuery = async () => {
    try {
      await axios.post(API_BASE_URL, newQuery);
      setNewQuery({ customerName: "", description: "" });
      setPage(1);
      await fetchQueries();
    } catch (error) {
      console.error("Error creating query:", error);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`${API_BASE_URL}/${id}`, { status });
      fetchQueries();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const fetchNotes = async (queryId) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/${queryId}`);
      setNotes((prevNotes) => ({
        ...prevNotes,
        [queryId]: res.data.notes || [],
      }));
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  };

  const addNote = async (queryId) => {
    try {
      await axios.post(`${API_BASE_URL}/${queryId}/notes`, { text: newNotes[queryId] });
      setNewNotes({ ...newNotes, [queryId]: "" });
      fetchNotes(queryId);
    } catch (error) {
      console.error("Error adding note:", error);
    }
  };

  const deleteNote = async (queryId, noteId) => {
    try {
      await axios.delete(`${API_BASE_URL}/${queryId}/notes/${noteId}`);
      fetchNotes(queryId);
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  return (
    <div className="container">
      <h2>Query Management</h2>

      <div className="query-form">
        <input
          type="text"
          placeholder="Customer Name"
          value={newQuery.customerName}
          onChange={(e) => setNewQuery({ ...newQuery, customerName: e.target.value })}
        />
        <input
          type="text"
          placeholder="Description"
          value={newQuery.description}
          onChange={(e) => setNewQuery({ ...newQuery, description: e.target.value })}
        />
        <button onClick={createQuery}>+ Add New Query</button>
      </div>

      <div>
        {queries.length === 0 ? (
          <p>No queries found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {queries.map((query) => (
                <React.Fragment key={query._id}>
                  <tr>
                    <td>{query.customerName}</td>
                    <td>{query.description}</td>
                    <td>
                      <select
                        value={query.status}
                        onChange={(e) => updateStatus(query._id, e.target.value)}
                      >
                        <option value="Open">Open</option>
                        <option value="InProgress">In Progress</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </td>
                    <td>
                      <button className="action-btn" onClick={() => updateStatus(query._id, "Closed")}>
                        Close
                      </button>
                    </td>
                    <td>
                      <button className="view-btn" onClick={() => fetchNotes(query._id)}>
                        View Notes
                      </button>
                    </td>
                  </tr>

                  {notes[query._id] && (
                    <tr>
                      <td colSpan="5">
                        <div className="notes-section">
                          <ul>
                            {notes[query._id].map((note) => (
                              <li key={note._id}>
                                {note.text}
                                <button className="delete-btn" onClick={() => deleteNote(query._id, note._id)}>
                                  🗑️
                                </button>
                              </li>
                            ))}
                          </ul>
                          <input
                            type="text"
                            placeholder="Add a note"
                            value={newNotes[query._id] || ""}
                            onChange={(e) =>
                              setNewNotes({ ...newNotes, [query._id]: e.target.value })
                            }
                          />
                          <button onClick={() => addNote(query._id)}>Add Note</button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="pagination">
        <button onClick={() => setPage(page - 1)} disabled={page === 1}>
          &lt;
        </button>
        <span style={{ margin: "0 10px", fontWeight: "bold" }}>{page}</span>
        <button onClick={() => setPage(page + 1)} disabled={page * limit >= totalQueries}>
          &gt;
        </button>
      </div>
    </div>
  );
};

export default QueryManagement;
