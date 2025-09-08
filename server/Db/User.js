const mongoose = require('mongoose');

const AvatarSchema = new mongoose.Schema({
    url:{type:String, default:""},
    publicId:{type:String, default:""}
} , { _id: false });

const UserProfileSchema = new mongoose.Schema({
    heading:{
        type:String,
        default:"Hey there! I am using StudyVerse.",
    },
    description:{
        type:String,
        default:""
    },
    avatar: AvatarSchema,
} , { _id: false });

const UserSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    dob:{
        type:Date,
        required:true,
    },
    username:{
        type:String,
        trim:true
    },
    gender:{
        type:String,
        enum:["male", "female", "other"],
        default:"other"
    },
    education:{
        type:String,
        required:true,
    },
    UserProfile: UserProfileSchema,
    connections: [
        { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    ],
    MyConnections: [
        { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    ],
    connectionRequests: [
        { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    ],
    Uid:{type:String, unique:true},
    firebaseUid:{type:String, unique:true}

}, { timestamps: true });

UserSchema.set("toJSON", {
    transform: (_, ret) => {
        delete ret.__v;
        delete ret.password;
        return ret;
    }
});


module.exports = mongoose.model("User" , UserSchema); 
