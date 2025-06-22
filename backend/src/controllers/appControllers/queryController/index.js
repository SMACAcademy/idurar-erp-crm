const { parse } = require("dotenv");
const querySchema = require("../../../models/appModels/Queries");

const getallQueries=async(req,res)=>{
    const {page,limit}=req.query
    console.log("Fetching all queries");
    const pageNumber=parseInt(page) || 1;
    const limitNumber=parseInt(limit) || 10;
    const skip= (page - 1) * limit;
      try{
        const result=await querySchema.find().skip(skip).limit(limitNumber).sort({createdAt:-1})
        const totalPages = Math.ceil(totalDocuments / limitNumber);
        console.log(result)
        if (result.length > 0){
            return res.status(200).json({
                success:true,
                currencies:totalPages,
                totalPages,
                result,
                message:'queries fetched successfully'
            })
        }
        else if(result.length === 0){
            return res.status(200).json({
                success:true,
                result,
                message:'no queries'
            })
        }
      }
      catch(err){
          return res.status(500).json({
                success:false,
                error:err.message,
                message:'failed to fetch queries'
            })
      }
}


const createQuery=async(req,res)=>{
    const{description,status,resolution}=req.body
    if(!description || !status){
        return res.status(500).json({
            success:false,
            message:"please enter all details"
        })
    }
    if(resolution && resolution.length > 100){
        return res.status(500).json({
            success:false,
            message:"resolution should be less than 100 words"
        })
    }
    try{
        const result=await querySchema.create({
             description,
             status,
             resolution:resolution || ""
        })
        return res.status(200).json({
            success:true,
            result,
            message:"query successfully created"
        })
    }
    catch(err){
         return res.status(500).json({
            success:false,

            message:"server error"
        })
}
}

const getSinglequery=async(req,res)=>{
    const {id}=req.params
    if(!id){
        return res.status(400).json({
            success:false,
            message:"id is missing"
        })
    }
    try{
        const result=await querySchema.findById(id)
        if(!result){
            return res.status(404).json({
                success:false,
                message:'no such queries'
            })
        }
        return res.status(200).json({
            success:true,
            result,
            message:"query successfully fetched"
        })
    }
    catch(err){
          return res.status(500).json({
                success:false,
                message:'internal server error',
                error:err.message
            })
    }
}

const updateQuery=async(req,res)=>{
    const {id}=req.params
    if(!id){
        return res.status(400).json({
            success:false,
            message:"id is missing"
        })
    }
    try{
        const update=req.body
        if(Object.entries(update).length < 1){
             return res.status(400).json({
            success:false,
            message:"no entries to update"
        })
        }
        const result=await querySchema.findByIdAndUpdate(id,{$set:update},{new:true})
        return res.status(200).json({
            success:true,
            result,
            message:"successfully updated"
        })
    }
    catch(err){
          return res.status(500).json({
                success:false,
                message:'internal server error'
            })
    }
}

const addnotes=async(req,res)=>{
const {id}=req.params
const {description}=req.body
  if(!id || !description){
    return res.status(400).json({
        success:false,
        message:"id or description is missing"
    })
  }
    try{
        const note = {
            description,
            queryId: id
        };
        const result =await querySchema.findByIdAndUpdate(id, 
            { $push: { notes: note } }) ;
        return res.status(200).json({
            success:true,
            result,
            message:"note added successfully"
        })
    }
    catch(err){
        return res.status(500).json({
            success:false,
            message:"internal server error"
        })
    }

}

const deleteNote=async(req,res)=>{
const {id,noteId}=req.params
if(!id || !noteId){
    return res.status(400).json({
        success:false,
        message:"id or noteId is missing"
    })
}
try{
    const result=await querySchema.findByIdAndUpdate(id, 
        { $pull: { notes: { _id: noteId } } },{new:true});
    if(!result){
        return res.status(404).json({
            success:false,
            message:"no such query found"
        })
    }
    return res.status(200).json({   
        success: true,
        result,
        message: "note deleted successfully"
    });
   
}
catch(err){
    return res.status(500).json({
        success:false,
        message:"internal server error"
    })
}
}

module.exports={getallQueries,createQuery,getSinglequery,updateQuery,addnotes,deleteNote};
