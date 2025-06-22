const express=require('express')
const router =express.Router()
const { getallQueries,createQuery,getSinglequery,updateQuery,addnotes,deleteNote } = require('@/controllers/appControllers/queryController')
router.route('/queries').post(createQuery).get(getallQueries)
router.route('/queries/:id').get(getSinglequery).put(updateQuery)
router.route('/queries/:id/notes').post(addnotes)
router.route('/queries/:id/notes/:noteId').delete(deleteNote)
module.exports=router 