const mongoose = require('mongoose');

const AvatarSchema = new mongoose.Schema({
    url:{type:String, default:"https://api.iconify.design/mdi/account-circle.svg?color=%238c8c8c"},
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

const UserSettingsSchema = new mongoose.Schema({
  showLikeNotifications: { type: Boolean, default: true },
  showCommentNotifications: { type: Boolean, default: true },
  acceptAllPeersRequest: { type: Boolean, default: false },
    accountType: {
    type: String,
    enum: ["public", "private"],
    default: "public"
  },
  showOnlineStatus: { type: Boolean, default: true },
}, { _id: false });

const UserSchema = new mongoose.Schema({
    authorEmail: { type: mongoose.Schema.Types.ObjectId, ref: "Auth" },
    firstName: {
        type: String,
        trim: true,
        default: null,
    },
    lastName: {
        type: String,
        trim: true,
        default: null,
    },
    dob:{
        type:Date,
        default: null,
    },
    username:{
        type:String,
        trim:true,
        default: null,
    },
    gender:{
        type:String,
        enum:["male", "female", "other"],
        default:"other"
    },
    education: {
        level: { 
            type: String, 
            enum: ["school", "higher_secondary", "undergraduate", "postgraduate", "other"], 
        },

        standard: { 
            type: String, 
            enum: [
            "1", "2", "3", "4", "5", 
            "6", "7", "8", "9", "10",
            "11", "12" 
            ],
            default: null 
        },

        stream: { 
            type: String, 
            enum: ["Science", "Commerce", "Arts", "Other"], 
            default: null 
        },

        degree: { 
            type: String, 
            enum: [
            "B.Sc", "B.A", "B.Com", "B.Tech", "M.B.B.S", "BBA",
            "M.Sc", "M.A", "M.Com", "M.Tech", "MBA", "PhD",
            "Other"
            ], 
            default: null 
        },

        field: { 
            type: String, 
            default: "" 
        },
        institute: {
            type: String, 
        },

        startYear: { 
            type: Number, 
            default: null 
        },

        endYear: { 
            type: Number, 
            default: null 
        },

        currentYear: { 
            type: String, 
            default: null 
        }
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
    notification: [
       {
        user:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        Type: { type: String },
        whichPost: { type: mongoose.Schema.Types.ObjectId, ref: "Posts" },
        comment : { type: String },
       }
    ],

    setting: { type: UserSettingsSchema , default: () => ({})},

    Uid:{ type:String },
    firebaseUid:{type:String, unique:true},

    email: {
        type: String,
        required: true,
        unique: true,
    },

    password: {
        type: String,
    },

}, { timestamps: true });

UserSchema.set("toJSON", {
    transform: (_, ret) => {
        delete ret.__v;
        delete ret.password;
        return ret;
    }
});

UserSchema.index({ connections: 1 });
UserSchema.index({ MyConnections: 1 });
UserSchema.index({ connectionRequests: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ firebaseUid: 1 });
UserSchema.index({ Uid: 1 });
UserSchema.index({ username: "text", firstName: "text", lastName: "text" });


module.exports = mongoose.model("User" , UserSchema); 
